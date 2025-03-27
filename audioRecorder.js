const { ipcMain } = require('electron');//do i need this here
const log = require('electron-log');
const audioFileManager = require('./audioFileManager');
const journalDAO = require('./database/dao');//do i need this here
//mock for now - will be replaced with actual implementation
class AudioRecorder {
    constructor() {
        this.isRecording = false;
        this.currentRecordingId = null;
        this.recorodingStartTime = null;

        this.setupRecorder();

        log.info('AudioRecorder initialized');
    }

    setupRecorder() { }

    startRecording() {
        return new Promise((resolve, reject) => {
            if (this.isRecording) {
                return reject(new Error('Already recording'));
            }

            try {
                this.currentRecordingId = Date.now().toString();
                this.recorodingStartTime = Date.now();
                this.isRecording = true;

                log.info('Recording started:', this.currentRecordingId);
                resolve(this.currentRecordingId);
            } catch (error) {
                log.error('Failed to start recording:', error);
                reject(error);
            }
        });
    }

    stopRecording(mainWindow) {
        return new Promise(async (resolve, reject) => {
            if (!this.isRecording) {
                return reject(new Error('Not recording'));
            }
            try {
                const recordingId = this.currentRecordingId;
                const duration = (Date.now() - this.recorodingStartTime) / 1000;

                const fakeAudioData = Buffer.from(`Fake audio data`);

                const filePath = await audioFileManager.saveAudioFile(recordingId, fakeAudioData);
                log.info('Recording saved:', filePath);

                const entryData = {
                    title: `Recording ${recordingId}`,
                    audioPath: filePath,
                    duration: duration,
                    transcript: 'test transcript'
                };

                const entryId = await journalDAO.createEntry(entryData);

                this.isRecording = false;
                this.currentRecordingId = null;
                this.recorodingStartTime = null;

                if (mainWindow) {
                    mainWindow.webContents.send('recording-complete', {
                        id: recordingId,
                        entryId: entryId,
                        timestamp: Date.now(),
                        duration: duration,
                        filePath: filePath
                    });
                }

                log.info(`Recording stopped: ${recordingId}`);
                resolve({ recordingId, entryId, filePath, duration });
            } catch (error) {
                log.error('Failed to stop recording:', error);
                reject(error);
            }
        });
    }

    playRecording(id) {
        return new Promise((resolve, reject) => {
            try {
                //todo - implement playback
                log.info('Playing recording:', id);
                resolve();

            } catch (error) {
                log.error('Failed to play recording:', error);
                reject(error);
            }
        });
    }
}

module.exports = new AudioRecorder();