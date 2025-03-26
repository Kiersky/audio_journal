const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const log = require('electron-log');

class AudioFileManager {
    constructor() {
        //base directory for recordings
        this.baseDir = path.join(app.getPath('userData'), 'recordings');

        this.ensureDirectoryExists();

        log.info('AudioFileManager initialized, base directory:', this.baseDir);
    }

    ensureDirectoryExists() {
        try {
            if (!fs.existsSync(this.baseDir)) {
                fs.mkdirSync(this.baseDir, { recursive: true });
                log.info('Created recordings directory');
            }
        } catch (error) {
            log.error('Failed to create recordings directory:', error);
            throw error;
        }
    }
    //TODO resolve issue with file format - for now it's hardcoded to wav
    getNewFilePath(id, format = 'wav') {
        return path.join(this.baseDir, `recording_${id}.${format}`);
    }

    saveAudioFile(id, audioData, format = 'wav') {
        return new Promise((resolve, reject) => {
            const filePath = this.getNewFilePath(id, format);
            fs.writeFile(filePath, audioData, (error) => {
                if (error) {
                    log.error('Failed to save audio file:', error);
                    reject(error);
                } else {
                    log.info('Audio file saved:', filePath);
                    resolve(filePath);
                }
            });
        });
    }

    readAudioFile(id) {
        return new Promise((resolve, reject) => {
            const filePath = this.getNewFilePath(id);

            fs.readFile(filePath, (error, data) => {
                if (error) {
                    log.error('Failed to read audio file:', error);
                    reject(error);
                } else {
                    log.info('Audio file read:', filePath);
                    resolve(data);
                }
            });
        });
    }

    deleteAudioFile(id) {
        return new Promise((resolve, reject) => {
            const filePath = this.getNewFilePath(id);
            fs.unlink(filePath, (error) => {
                if (error) {
                    log.error('Failed to delete audio file:', error);
                    reject(error);
                } else {
                    log.info('Audio file deleted:', filePath);
                    resolve();
                }
            });
        });
    }

    listAudioFiles() {
        return new Promise((resolve, reject) => {
            fs.readdir(this.baseDir, (error, files) => {
                if (error) {
                    log.error('Failed to list audio files:', error);
                    reject(error);
                } else {
                    const audioFiles = files
                        .filter(file => file.startsWith('recording') && file.endsWith('.wav'))
                        .map(file => {
                            const id = file.replace('recording_', '').replace('.wav', '');
                            return {
                                id,
                                path: path.join(this.baseDir, file)
                            };
                        });
                    log.info('Audio files listed:', files);
                    resolve(audioFiles);
                }
            });
        });
    }

    getCustomStoragePath(customPath, id, format = 'wav') {
        return path.join(customPath, `recording_${id}.${format}`);
    }

    saveToCustomPath(id, audioData, customPath) {
        return new Promise((resolve, reject) => {
            const filePath = this.getCustomStoragePath(customPath, id);

            try {
                const dirPath = path.dirname(filePath);
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            } catch (error) {
                log.error('Failed to create custom directory:', error);
                reject(error);
                return;
            }

            fs.writeFile(filePath, audioData, (error) => {
                if (error) {
                    log.error('Failed to save audio file to custom path:', error);
                    reject(error);
                } else {
                    log.info('Audio file saved to custom path:', filePath);
                    resolve(filePath);
                }
            });
        });
    }
}

module.exports = new AudioFileManager();