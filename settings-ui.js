// settings-ui.js - Manages the settings UI and interacts with the settings API

document.addEventListener('DOMContentLoaded', () => {
    // Tab navigation
    const recordingTabBtn = document.getElementById('recordingTabBtn');
    const settingsTabBtn = document.getElementById('settingsTabBtn');
    const recordingTab = document.getElementById('recordingTab');
    const settingsTab = document.getElementById('settingsTab');

    // Form elements
    const settingsForm = document.getElementById('settingsForm');
    const audioQualitySelect = document.getElementById('audioQuality');
    const saveLocationInput = document.getElementById('saveLocation');
    const browseFolderBtn = document.getElementById('browseFolderBtn');
    const autoSaveCheckbox = document.getElementById('autoSave');
    const maxRecordingTimeInput = document.getElementById('maxRecordingTime');
    const themeSelect = document.getElementById('theme');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');

    // Tab switching
    recordingTabBtn.addEventListener('click', () => {
        settingsTabBtn.classList.remove('active');
        recordingTabBtn.classList.add('active');
        settingsTab.classList.remove('active');
        recordingTab.classList.add('active');
    });

    settingsTabBtn.addEventListener('click', () => {
        recordingTabBtn.classList.remove('active');
        settingsTabBtn.classList.add('active');
        recordingTab.classList.remove('active');
        settingsTab.classList.add('active');

        // Load current settings when opening the settings tab
        loadSettings();
    });

    // Load settings from main process
    async function loadSettings() {
        try {
            const settings = await window.settings.getAll();

            // Populate form fields with current settings
            audioQualitySelect.value = settings.audioQuality;
            saveLocationInput.value = settings.saveLocation;
            autoSaveCheckbox.checked = settings.autoSave;
            maxRecordingTimeInput.value = settings.maxRecordingTimeMinutes;
            themeSelect.value = settings.theme;

            // Apply the theme
            applyTheme(settings.theme);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    // Apply theme to the document
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }

    // Handle settings form submission
    settingsForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const newSettings = {
            audioQuality: audioQualitySelect.value,
            saveLocation: saveLocationInput.value,
            autoSave: autoSaveCheckbox.checked,
            maxRecordingTimeMinutes: parseInt(maxRecordingTimeInput.value, 10),
            theme: themeSelect.value
        };

        try {
            await window.settings.updateMultiple(newSettings);
            alert('Settings saved successfully!');

            // Apply the theme immediately
            applyTheme(newSettings.theme);
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        }
    });

    // Reset settings to defaults
    resetSettingsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            try {
                await window.settings.reset();
                alert('Settings have been reset to defaults.');
                loadSettings(); // Reload settings from main process
            } catch (error) {
                console.error('Failed to reset settings:', error);
                alert('Failed to reset settings. Please try again.');
            }
        }
    });

    // Browse for folder is not implemented in this version
    // In a real app, you would use dialog.showOpenDialog from the main process
    browseFolderBtn.addEventListener('click', () => {
        alert('This feature is not implemented in this version.');
    });

    // Load settings on initial page load
    loadSettings();
});