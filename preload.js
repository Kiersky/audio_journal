const { contextBridge, ipcRenderer } = require('electron');
//const { listAudioFiles, saveToCustomPath } = require('./audioFileManager');

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
    reset: () => ipcRenderer.invoke('reset-settings'),

    browseDirectory: () => ipcRenderer.invoke('open-directory-dialog')
});

// Expose database APIs to the renderer process
contextBridge.exposeInMainWorld('database', {
    // Entry operations
    createEntry: (entryData) => ipcRenderer.invoke('create-entry', entryData),
    getAllEntries: (options) => ipcRenderer.invoke('get-all-entries', options),
    getEntry: (id, includeTags) => ipcRenderer.invoke('get-entry', id, includeTags),
    updateEntry: (entryData) => ipcRenderer.invoke('update-entry', entryData),
    deleteEntry: (id) => ipcRenderer.invoke('delete-entry', id),
    searchEntries: (keyword) => ipcRenderer.invoke('search-entries', keyword),

    // Tag operations
    createTag: (name) => ipcRenderer.invoke('create-tag', name),
    getAllTags: () => ipcRenderer.invoke('get-all-tags'),
    tagEntry: (entryId, tagId) => ipcRenderer.invoke('tag-entry', entryId, tagId),
    untagEntry: (entryId, tagId) => ipcRenderer.invoke('untag-entry', entryId, tagId),
    getTagsForEntry: (entryId) => ipcRenderer.invoke('get-tags-for-entry', entryId),
    getEntriesWithTag: (tagId) => ipcRenderer.invoke('get-entries-with-tag', tagId),

    // Compound operations
    addEntryWithTags: (entryData, tagNames) =>
        ipcRenderer.invoke('add-entry-with-tags', entryData, tagNames)
});

// Expose audio file manager APIs to the renderer process
contextBridge.exposeInMainWorld('audioFiles', {
    getAudioFile: (id) => ipcRenderer.invoke('get-audio-file', id),
    saveAudioFile: (id, audioData) => ipcRenderer.invoke('save-audio-file', id, audioData),
    deleteAudioFile: (id) => ipcRenderer.invoke('delete-audio-file', id),
    listAudioFiles: () => ipcRenderer.invoke('list-audio-files'),
    saveToCustomPath: (id, audioData, customPath) =>
        ipcRenderer.invoke('save-to-custom-path', id, audioData, customPath),
    updateStorageLocation: (newPath) => ipcRenderer.invoke('update-audio-storage-location', newPath)

});