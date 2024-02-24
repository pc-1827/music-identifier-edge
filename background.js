import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

function audioCapture() {
  //Captures the audio using tabCapture API
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
    const mediaRecorder = new MediaRecorder(stream);

    let chunks = [];
    mediaRecorder.ondataavailable = async (e) => {
      if (e.data.size > 10000) {
        chunks.push(e.data);
        const blob = new Blob(chunks, { 'type' : 'mp3' });

        try {
          const base64String = await convertBlobToBase64(blob); // Converts the mp3 blob to base64 string
          const resultPromise = transferToAPI(base64String); // Note: This returns a Promise
          const result = await resultPromise; // Wait for the Promise to resolve

          if (result.matches.length == 0){
            chrome.runtime.sendMessage('error')
          }
          else{
            chrome.runtime.sendMessage({
              type: 'SHAZAM_RESULT',
              data: {
                coverArt: result.track.images.coverart,
                title: result.track.title,
                subtitle: result.track.subtitle,
                time: new Date().toLocaleString(),
                tagid: result.tagid,
                apple: result.track.hub.options[0].actions[0].uri,
                spotify: result.track.hub.providers[0].actions[0].uri,
                youtubeurl: result.track.sections[1].youtubeurl.actions[0].uri
              },
            });
          }
        } catch (error) {
          chrome.runtime.sendMessage('error')
        }

      } else {
        chrome.runtime.sendMessage('noAudio');
      }
    };

    mediaRecorder.onerror = (error) => {
      chrome.runtime.sendMessage('error')
    }

    mediaRecorder.start();

    setTimeout(() => {
      mediaRecorder.stop();
      source.disconnect(output.destination);

      // Stop capturing data from the tab
      stream.getTracks().forEach(track => track.stop());

    }, 4000); //Records audio for 4 seconds

  });
}

async function convertBlobToBase64(blob) {
  // Loading the ffmpeg
  const ffmpeg = new FFmpeg();
  await ffmpeg.load();

  // Write blob to file in FFmpeg's virtual file system
  await ffmpeg.writeFile('input.mp3', await fetchFile(blob));
  const input = await ffmpeg.readFile('input.mp3')

  // Run FFmpeg command to convert input file to raw PCM format
  await ffmpeg.exec(['-i', 'input.mp3', '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '44100', 'output.raw']);

  // Read the converted raw audio file
  const data = await ffmpeg.readFile('output.raw');

  // Encode raw audio data to base64
  const base64 = await base64Encoder(data);

  return base64;
}

async function base64Encoder(data) {
  const uint8Array = new Uint8Array(data);
  const binaryString = uint8Array.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
  const base64String = btoa(binaryString);
  return base64String;
}

async function transferToAPI(base64String){
  const url = 'url';
  const options = {
    method: 'POST',
    headers: {
      'content-type': 'text/plain',
      'X-RapidAPI-Key': 'API-Key',
      'X-RapidAPI-Host': 'API-Host'
    },
    body: base64String
};

try {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const responseData = await response.json(); // Parse JSON response
  return responseData

} catch (error) {
  chrome.runtime.sendMessage('error')
}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request === 'recordAudio') {
    audioCapture();
  }
});
