// settings.js - Module for managing application settings
const { app } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

// Class to manage the application settings
class SettingsManager {
    constructor() {
        // Define the path to the settings file in the app's user data directory
        // This is a good practice as it's a standard location for app settings
        this.settingsPath = path.join(app.getPath('userData'), 'settings.json');

        console.log('App name:', app.getName());
        console.log('User data path:', app.getPath('userData'));
        console.log('Settings path:', this.settingsPath);
        console.log('Log path:', log.transports.file.getFile().path);
        // Default settings that will be used if no settings file exists
        this.defaultSettings = {
            audioQuality: 'medium', // low, medium, high
            saveLocation: path.join(app.getPath('documents'), 'AudioJournal'),
            autoSave: true,
            maxRecordingTimeMinutes: 30,
            theme: 'light' // light, dark
        };

        // The current settings object that will be used throughout the app
        this.settings = {};

        // Load settings when the manager is created
        this.loadSettings();
    }

    // Load settings from the file, or create with defaults if it doesn't exist
    loadSettings() {
        try {
            // Check if the settings file exists
            if (fs.existsSync(this.settingsPath)) {
                // Read and parse the settings file
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                this.settings = JSON.parse(data);
                log.info('Settings loaded successfully');
            } else {
                // If no settings file exists, use the defaults and create the file
                this.settings = { ...this.defaultSettings };
                this.saveSettings();
                log.info('Created new settings file with default values');
            }
        } catch (error) {
            // If there's an error (e.g., corrupted settings file), use defaults
            log.error('Failed to load settings:', error);
            this.settings = { ...this.defaultSettings };
        }

        return this.settings;
    }

    // Save the current settings to the file
    saveSettings() {
        try {
            // Ensure the directory exists
            const directory = path.dirname(this.settingsPath);
            console.log('Directory to create:', directory);

            if (!fs.existsSync(directory)) {
                console.log('Directory does not exist, creating...');
                fs.mkdirSync(directory, { recursive: true });
            } else {
                console.log('Directory already exists');
            }

            // Write the settings to the file
            console.log('Writing settings to:', this.settingsPath);
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2), 'utf8');
            console.log('Settings saved successfully');
            log.info('Settings saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            log.error('Failed to save settings:', error);
            return false;
        }
    }

    // Get a specific setting by key
    getSetting(key) {
        // Return the value if it exists, otherwise return the default value
        return this.settings[key] !== undefined
            ? this.settings[key]
            : this.defaultSettings[key];
    }

    // Update a specific setting
    updateSetting(key, value) {
        this.settings[key] = value;
        return this.saveSettings();
    }

    // Update multiple settings at once
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.saveSettings();
    }

    // Reset all settings to defaults
    resetToDefaults() {
        this.settings = { ...this.defaultSettings };
        return this.saveSettings();
    }
}

// Export a singleton instance of the settings manager
module.exports = new SettingsManager();