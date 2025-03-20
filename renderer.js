// This script runs in the renderer process (the UI)
document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const playButton = document.getElementById('playButton');

    let currentRecordingId = null;

    // Set up button click handlers
    recordButton.addEventListener('click', async () => {
        try {
            // Get max recording time from settings
            const maxRecordingTime = await window.settings.get('maxRecordingTimeMinutes');

            // Call the function exposed in preload.js
            await window.audioJournal.startRecording();

            // Update UI
            recordButton.disabled = true;
            stopButton.disabled = false;

            // Auto-stop the recording after the max time if enabled
            if (maxRecordingTime > 0) {
                setTimeout(async () => {
                    if (!recordButton.disabled) return; // Don't stop if not recording
                    await window.audioJournal.stopRecording();
                    recordButton.disabled = false;
                    stopButton.disabled = true;
                    playButton.disabled = false;
                }, maxRecordingTime * 60 * 1000); // Convert minutes to milliseconds
            }
        } catch (error) {
            console.error('Failed to start recording:', error);
        }
    });

    stopButton.addEventListener('click', async () => {
        try {
            await window.audioJournal.stopRecording();

            // Update UI
            recordButton.disabled = false;
            stopButton.disabled = true;
            playButton.disabled = false;
        } catch (error) {
            console.error('Failed to stop recording:', error);
        }
    });

    playButton.addEventListener('click', async () => {
        if (currentRecordingId) {
            try {
                await window.audioJournal.playRecording(currentRecordingId);
            } catch (error) {
                console.error('Failed to play recording:', error);
            }
        }
    });

    // Listen for recording complete event from main process
    window.audioJournal.onRecordingComplete((data) => {
        currentRecordingId = data.id;

        // Add entry to journal list
        const entriesContainer = document.querySelector('.journal-entries');
        const entryElement = document.createElement('div');
        entryElement.classList.add('journal-entry');
        entryElement.innerHTML = `
        <h3>Recording ${data.id}</h3>
        <p>Date: ${new Date(data.timestamp).toLocaleString()}</p>
        <button class="play-entry" data-id="${data.id}">Play</button>
      `;

        entriesContainer.appendChild(entryElement);

        // Handle auto-save if enabled
        window.settings.get('autoSave').then(autoSave => {
            if (autoSave) {
                // Auto-save functionality would be implemented here
                console.log('Auto-saving recording...');
            }
        });
    });

    // Add event delegation for dynamically created play buttons
    document.querySelector('.journal-entries').addEventListener('click', async (event) => {
        if (event.target.classList.contains('play-entry')) {
            const recordingId = event.target.getAttribute('data-id');
            try {
                await window.audioJournal.playRecording(recordingId);
            } catch (error) {
                console.error('Failed to play recording:', error);
            }
        }
    });
});