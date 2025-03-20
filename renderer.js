// This script runs in the renderer process (the UI)
document.addEventListener('DOMContentLoaded', () => {
    const recordButton = document.getElementById('recordButton');
    const stopButton = document.getElementById('stopButton');
    const playButton = document.getElementById('playButton');

    let currentRecordingId = null;

    // Set up button click handlers
    recordButton.addEventListener('click', async () => {
        try {
            // Call the function exposed in preload.js
            await window.audioJournal.startRecording();

            // Update UI
            recordButton.disabled = true;
            stopButton.disabled = false;
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
    });
});