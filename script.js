document.addEventListener('DOMContentLoaded', async function() {
  const logo = document.getElementById('logo');
  const arrowIcon = document.getElementById('arrowIcon');
  const songsTitle = document.getElementById('songsTitle');
  const songsList = document.getElementById('songsList');
  const statusText = document.getElementById('status');

  await displayIdentifiedSongs();

  logo.addEventListener('click', function() {
      // Send a message to the background script to start audio capture
      chrome.runtime.sendMessage('recordAudio');

      // Start spinning the logo
      logo.classList.add('spin');
      statusText.textContent = 'Identifying...';
  });

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request === 'audioCaptureComplete') {
      logo.classList.remove('spin');
      statusText.textContent = 'Touch to Identify'
      songsList.classList.add('show')
    }
    if (request === 'noAudio') {
      statusText.textContent = "No audio is playing in the current tab"
      logo.classList.remove('spin')
      setTimeout(() => {
        statusText.textContent = 'Touch to Identify'
      }, 5000)
    }
    if (request.type === 'SHAZAM_RESULT') {
      saveSongDetails(request);
      displayIdentifiedSongs();
  }
  });

//   songsList.addEventListener('click', function(event) {
//     if (event.target.classList.contains('delete-icon')) {
//         const songElement = event.target.closest('.song');
//         songElement.remove();
//     }
// });

  songsTitle.addEventListener('click', function() {
      // Toggle songs list visibility
      songsList.classList.toggle('show');

      // Rotate arrow icon
      arrowIcon.classList.toggle('rotate');
  });

        // Function to retrieve stored song details from Chrome storage
        function getStoredSongs(callback) {
          chrome.storage.local.get('identifiedSongs', function(data) {
              const identifiedSongs = data.identifiedSongs || [];
              callback(identifiedSongs);
          });
      }

      // Function to save identified song details to Chrome storage
      function saveSongDetails(songDetails) {
          getStoredSongs(function(identifiedSongs) {
              identifiedSongs.push(songDetails);
              chrome.storage.local.set({ 'identifiedSongs': identifiedSongs });
          });
      }

      function displayIdentifiedSongs() {
        return new Promise((resolve, reject) => {
            getStoredSongs(function(identifiedSongs) {
                const songsList = document.getElementById('songsList');
                songsList.innerHTML = ''; // Clear previous list

                identifiedSongs.forEach(function(song) {
                    // Create elements for the song
                    const { coverArt, title, subtitle } = song.data;
                    const songElement = document.createElement('div');
                    songElement.classList.add('song');

                    const coverArtImg = document.createElement('img');
                    coverArtImg.src = coverArt;
                    coverArtImg.alt = 'Cover Art';
                    coverArtImg.classList.add('song-logo');

                    const songDetails = document.createElement('div');
                    songDetails.classList.add('song-details');

                    const songTitle = document.createElement('p');
                    songTitle.textContent = title;
                    songTitle.classList.add('song-title');

                    const songSubtitle = document.createElement('p');
                    songSubtitle.textContent = subtitle;
                    songSubtitle.classList.add('song-subtitle');

                    const identificationData = document.createElement('p');
                    identificationData.textContent = 'Identified on: ' + new Date().toLocaleString();
                    identificationData.classList.add('identification-data');

                    const deleteIcon = document.createElement('i');
                    deleteIcon.classList.add('fas', 'fa-trash', 'delete-icon');

                    // Append elements to the song container
                    songDetails.appendChild(songTitle);
                    songDetails.appendChild(songSubtitle);
                    songDetails.appendChild(identificationData);
                    songElement.appendChild(coverArtImg);
                    songElement.appendChild(songDetails);
                    songElement.appendChild(deleteIcon);

                    // Append the song container to the song list container
                    songsList.appendChild(songElement);
                });
                resolve(); // Resolve the promise after displaying songs
            });
        });
    }

});
