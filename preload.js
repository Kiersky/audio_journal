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