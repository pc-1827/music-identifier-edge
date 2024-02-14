function audioCapture() {
  chrome.tabCapture.capture({ audio: true }, (stream) => {
    if (!stream) {
      console.error('Unable to capture the tab. Is the tab playing audio?');
      return;
    }

    //Continues to play the captured audio to the user
    const output = new AudioContext();
    const source = output.createMediaStreamSource(stream);
    source.connect(output.destination);

    //Records the captured audio using MediaRecorder API
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

    let chunks = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);

        const blob = new Blob(chunks, { type: 'mp3' });
        const blobURL = URL.createObjectURL(blob);

        console.log(blob)
        // const audio = new Audio(blobURL);
        // audio.play();
      } else {
        console.log('Received empty audio data. Is the tab playing audio?');
      }
    };

    mediaRecorder.onerror = (error) => console.error('MediaRecorder error:', error);

    mediaRecorder.start();
    console.log("Recording started (state:", mediaRecorder.state, ")");

    setTimeout(() => {
      mediaRecorder.stop();
      console.log("Recording stopped (state:", mediaRecorder.state, ")");
      source.disconnect(output.destination);

      // Stop capturing data from the tab
      stream.getTracks().forEach(track => track.stop());

    }, 5000);


  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === 'recordAudio') {
    audioCapture();
  }
});
