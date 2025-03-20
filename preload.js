const { contextBridge, ipcRenderer } = require('electron');
const log = require('electron-log');

contextBridge.exposeInMainWorld('audioJournal', {

    startRecording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    playRecording: (id) => ipcRenderer.invoke('play-recording', id),

    onRecordingComplete: (callback) => {
        ipcRenderer.on('recording-complete', (event, data) => callback(data));
    }
});

// Expose settings functions to the renderer process
contextBridge.exposeInMainWorld('settings', {
    // Get all settings
    getAll: () => ipcRenderer.invoke('get-settings'),

    // Get a specific setting
    get: (key) => ipcRenderer.invoke('get-setting', key),

    // Update a specific setting
    update: (key, value) => ipcRenderer.invoke('update-setting', key, value),

    // Update multiple settings at once
    updateMultiple: (newSettings) => ipcRenderer.invoke('update-settings', newSettings),

    // Reset all settings to defaults
    reset: () => ipcRenderer.invoke('reset-settings')
});