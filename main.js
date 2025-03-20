const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const log = require('electron-log');
const settings = require('./settings');

// Configure log file location and format
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Use log instead of console.log
log.info('Application starting...');

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
});

// Hot reload in development mode
if (process.env.NODE_ENV !== 'production') {
    require('electron-reload')(__dirname, {
        // Watch these file extensions
        electron: require(`${__dirname}/node_modules/electron`)
    });
}

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
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
    });

    mainWindow.loadFile('index.html');

    // if (process.env.NODE_ENV === 'development') {
    //     mainWindow.webContents.openDevTools();
    // }

    mainWindow.on('resize', () => {
        const { width, height } = mainWindow.getBounds();
        settings.updateSettings({
            windowWidth: width,
            windowHeight: height
        });
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// On macOS, recreate window when dock icon is clicked and no windows are open
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

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