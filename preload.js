const { contextBridge, ipcRenderer } = require('electron');
const log = require('electron-log');

contextBridge.exposeInMainWorld('audio_journal', {

    startRecorording: () => ipcRenderer.invoke('start-recording'),
    stopRecording: () => ipcRenderer.invoke('stop-recording'),
    playRecording: (id) => ipcRenderer.invoke('play-recording'),

    onRecordingComplete: (callback) => {
        ipcRenderer.on('recording-complete', (event, data) => callback(data));
    }
});