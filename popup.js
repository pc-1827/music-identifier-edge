document.addEventListener('DOMContentLoaded', function() {
    const recordButton = document.getElementById('recordButton');

    recordButton.addEventListener('click', function() {
      // Send a message to the background script to start audio capture
      chrome.runtime.sendMessage('recordAudio');
      console.log("Hello there, form Audio Recorder")
    });
  });
