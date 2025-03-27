const path = require('path');
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const log = require('electron-log');
const settings = require('./settings');
const database = require('./database/db');
const { journalDao } = require('./database/dao');
const audioFileManager = require('./audioFileManager');
const audioRecorder = require('./audioRecorder');

// Configure log file location and format
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Use log instead of console.log
log.info('Application starting...');

// Hot reload in development mode
if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        // Watch these file extensions
        electron: require(`${__dirname}/node_modules/electron`)
    });
}

let mainWindow;


//Creates the main application window with specified settings and security configurations.
function createWindow() {
    // Make sure settings are loaded before creating the window
    settings.loadSettings();

    // Get display dimensions
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: maxWidth, height: maxHeight } = primaryDisplay.workAreaSize;

    // Apply window size from settings or use defaults
    let width = settings.getSetting('windowWidth') || 800;
    let height = settings.getSetting('windowHeight') || 600;

    // Ensure window size is reasonable (not larger than screen)
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);

    // Also ensure minimum reasonable size
    width = Math.max(width, 400);
    height = Math.max(height, 300);

    const windowSettings = {
        width,
        height,
        webPreferences: {
            // Security: Isolate renderer process from Node.js environment
            nodeIntegration: false,
            // Use preload script to safely expose specific APIs
            preload: path.join(__dirname, 'preload.js'),
            // Security: Prevent remote module loading
            enableRemoteModule: false,
            // Security: Restrict renderer to same origin content
            contextIsolation: true
        },
    };

    mainWindow = new BrowserWindow(windowSettings);


    mainWindow.loadFile('index.html');

    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }

    // Save window size when it's resized - but only when not maximized
    mainWindow.on('resize', debounce(() => {
        // Don't save maximized dimensions
        if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
            const { width, height } = mainWindow.getBounds();
            settings.updateSettings({
                windowWidth: width,
                windowHeight: height
            });
            log.info(`Window resized to ${width}x${height}`);
        }
    }, 500));

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    try {
        // Initialize database
        await database.initialize();
        log.info('Database initialized successfully');

        // // Set up IPC handlers
        // setupIPCHandlers();

        // Create the main window
        createWindow();
    } catch (error) {
        log.error('Failed to initialize application:', error);
        app.quit();
    }
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', async (event) => {
    // Prevent the app from quitting immediately
    event.preventDefault();

    try {
        // Close database connection
        await database.close();
        log.info('Database connection closed');

        // Now we can quit
        app.exit();
    } catch (error) {
        log.error('Error during app cleanup:', error);
        app.exit(1); // Force quit with error code
    }
});

// On macOS, recreate window when dock icon is clicked and no windows are open
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});
// Simple debounce function to prevent excessive calls
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// IPC handlers for settings
ipcMain.handle('get-settings', async () => {
    return settings.loadSettings(); // Return all settings
});

ipcMain.handle('get-setting', async (event, key) => {
    return settings.getSetting(key);
});

ipcMain.handle('update-setting', async (event, key, value) => {
    return settings.updateSetting(key, value);
});

ipcMain.handle('update-settings', async (event, newSettings) => {
    return settings.updateSettings(newSettings);
});

ipcMain.handle('reset-settings', async () => {
    return settings.resetToDefaults();
});

// IPC handlers for database operations
// function setupIPCHandlers() {


// Entry operations
ipcMain.handle('create-entry', async (event, entryData) => {
    return journalDAO.createEntry(entryData);
});

ipcMain.handle('get-all-entries', async (event, options) => {
    return journalDAO.getAllEntries(options);
});

ipcMain.handle('get-entry', async (event, id, includeTags) => {
    return journalDAO.getEntry(id, includeTags);
});

ipcMain.handle('update-entry', async (event, entryData) => {
    return journalDAO.updateEntry(entryData);
});

ipcMain.handle('delete-entry', async (event, id) => {
    return journalDAO.deleteEntry(id);
});

ipcMain.handle('search-entries', async (event, keyword) => {
    return journalDAO.searchEntries(keyword);
});

// Tag operations
ipcMain.handle('create-tag', async (event, name) => {
    return journalDAO.createTag(name);
});

ipcMain.handle('get-all-tags', async () => {
    return journalDAO.getAllTags();
});

ipcMain.handle('tag-entry', async (event, entryId, tagId) => {
    return journalDAO.tagEntry(entryId, tagId);
});

ipcMain.handle('untag-entry', async (event, entryId, tagId) => {
    return journalDAO.untagEntry(entryId, tagId);
});

ipcMain.handle('get-tags-for-entry', async (event, entryId) => {
    return journalDAO.getTagsForEntry(entryId);
});

ipcMain.handle('get-entries-with-tag', async (event, tagId) => {
    return journalDAO.getEntriesWithTag(tagId);
});

// Example of transaction usage
ipcMain.handle('add-entry-with-tags', async (event, entryData, tagNames) => {
    return journalDAO.transaction(async (dao) => {
        // Create entry
        const entryId = await dao.createEntry(entryData);

        // Add all tags
        const tagPromises = tagNames.map(async (tagName) => {
            const tagId = await dao.createTag(tagName);
            return dao.tagEntry(entryId, tagId);
        });

        await Promise.all(tagPromises);

        // Return the complete entry with tags
        return dao.getEntry(entryId, true);
    });
});
//}

// IPC handlers for audio file operations
ipcMain.handle('get-audio-file', async (event, id) => {
    try {
        return await audioFileManager.readAudioFile(id);
    } catch (error) {
        log.error('Failed to read audio file:', error);
        throw error;
    }
});

ipcMain.handle('save-audio-file', async (event, id, audioData) => {
    try {
        return await audioFileManager.saveAudioFile(id, Buffer.from(audioData));
    } catch (error) {
        log.error('Failed to save audio file:', error);
        throw error;
    }
});
ipcMain.handle('list-audio-files', async () => {
    try {
        return await audioFileManager.listAudioFiles();
    } catch (error) {
        log.error('Failed to list audio files:', error);
        throw error;
    }
});
ipcMain.handle('save-audio-to-custom-path', async (event, id, audioData, customPath) => {
    try {
        return await audioFileManager.saveToCustomPath(id, Buffer.from(audioData), customPath);
    } catch (error) {
        log.error('Failed to save audio file to custom location:', error);
        throw error;
    }
});

// IPC handlers for audio recording
ipcMain.handle('start-recording', async () => {
    try {
        return await audioRecorder.startRecording();
    } catch (error) {
        log.error('Failed to start recording:', error);
        throw error;
    }
});

ipcMain.handle('stop-recording', async () => {
    try {
        return await audioRecorder.stopRecording(mainWindow);
    } catch (error) {
        log.error('Failed to stop recording:', error);
        throw error;
    }
});

ipcMain.handle('play-recording', async (event, id) => {
    try {
        return await audioRecorder.playRecording(id);
    } catch (error) {
        log.error('Failed to play recording:', error);
        throw error;
    }
});