// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

chrome.action.onClicked.addListener(async (tab) => {
    // Get a MediaStream for the active tab.
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });

    startRecording(streamId);
    chrome.action.setIcon({ path: '/icons/recording.png' });
    setTimeout(() => {
        stopRecording();
        chrome.action.setIcon({ path: 'icons/not-recording.png' });
    }, 5000)

  });

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
    recorder.onstop = () => {
      const blob = new Blob(data, { type: 'audio/webm' }); // Adjust blob type to audio
      window.open(URL.createObjectURL(blob), '_blank');

      // Clear state ready for next recording
      recorder = undefined;
      data = [];
    };
    recorder.start();

    // Record the current state in the URL. This provides a very low-bandwidth
    // way of communicating with the service worker (the service worker can check
    // the URL of the document and see the current recording state). We can't
    // store that directly in the service worker as it may be terminated while
    // recording is in progress. We could write it to storage but that slightly
    // increases the risk of things getting out of sync.
    window.location.hash = 'recording';
  }

  async function stopRecording() {
    recorder.stop();

    // Stopping the tracks makes sure the recording icon in the tab is removed.
    recorder.stream.getTracks().forEach((t) => t.stop());

    // Update current state in URL
    window.location.hash = '';

    // Note: In a real extension, you would want to write the recording to a more
    // permanent location (e.g IndexedDB) and then close the offscreen document,
    // to avoid keeping a document around unnecessarily. Here we avoid that to
    // make sure the browser keeps the Object URL we create (see above) and to
    // keep the sample fairly simple to follow.
  }
