import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

  let recorder;
  let data = [];

  async function startRecording(streamId) {
    if (recorder?.state === 'recording') {
      throw new Error('Called startRecording while recording is in progress.');
    }

    const media = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false // Requesting only audio
    });

    // Continue to play the captured audio to the user.
    const output = new AudioContext();
    const source = output.createMediaStreamSource(media);
    source.connect(output.destination);

    // Start recording.
    recorder = new MediaRecorder(media, { mimeType: 'audio/webm' }); // Adjust mimeType to audio
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.onstop = async () => {
      const blob = new Blob(data, { type: 'audio/webm' }); // Adjust blob type to audio
      if (blob.size > 10000){
        try {
          const base64String = await convertBlobToBase64(blob);
          console.log('Base64 encoded audio:', base64String);
          const resultPromise = transferToAPI(base64String); // Note: This returns a Promise
          const result = await resultPromise; // Wait for the Promise to resolve
          console.log('Result:', result);

          if (result.matches.length > 0){
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
          else{
            chrome.runtime.sendMessage('error')
          }
        } catch (error) {
          chrome.runtime.sendMessage('error')
          console.error('Error converting blob to base64:', error);
        }
      }
      else{
        chrome.runtime.sendMessage('noAudio')
      }
      console.log(blob)
      //window.open(URL.createObjectURL(blob), '_blank');

      // Clear state ready for next recording
      recorder = undefined;
      data = [];
    };
    recorder.start();

    window.location.hash = 'recording';
  }

  async function stopRecording() {
    recorder.stop();

    // Stopping the tracks makes sure the recording icon in the tab is removed.
    recorder.stream.getTracks().forEach((t) => t.stop());

    // Update current state in URL
    window.location.hash = '';

  }

  async function convertBlobToBase64(blob) {
    console.log("Function called to convert blob to base64 string")

    const ffmpeg = new FFmpeg();
    await ffmpeg.load();
    console.log("ffmpeg loaded")

    // Write blob to file in FFmpeg's virtual file system
    await ffmpeg.writeFile('input.mp3', await fetchFile(blob));
    const input = await ffmpeg.readFile('input.mp3')
    console.log("input.mp3", input)
    // Run FFmpeg command to convert input file to raw PCM format
    await ffmpeg.exec(['-i', 'input.mp3', '-f', 's16le', '-acodec', 'pcm_s16le', '-ac', '1', '-ar', '44100', 'output.raw']);

    // Read the converted raw audio file
    const data = await ffmpeg.readFile('output.raw');
    console.log("output.raw", data)

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

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.target === 'offscreen') {
      switch (message.type) {
        case 'start-recording':
          startRecording(message.data);
          break;
        case 'stop-recording':
          stopRecording();
          break;
        default:
          throw new Error('Unrecognized message:', message.type);
      }
    }
  });

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

    // Access and use the data from responseData
    console.log("Hello from the API")
    console.log("responseData: ", responseData);
    return responseData
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
