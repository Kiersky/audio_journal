const path = require('path');
const { app, BrowserWindow } = require('electron');

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