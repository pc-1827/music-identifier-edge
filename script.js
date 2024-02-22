document.addEventListener('DOMContentLoaded', async function() {
  const logo = document.getElementById('logo');
  const arrowIcon = document.getElementById('arrowIcon');
  const songsTitle = document.getElementById('songsTitle');
  const songsList = document.getElementById('songsList');
  const statusText = document.getElementById('status');

  displayIdentifiedSongs()

  logo.addEventListener('click', function() {
      // Send a message to the background script to start audio capture
      chrome.runtime.sendMessage('recordAudio');

      // Start spinning the logo
      logo.classList.add('spin');
      statusText.textContent = 'Identifying...';
  });

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request === 'noAudio') {
      statusText.textContent = "No audio is playing in the current tab"
      logo.classList.remove('spin')
      setTimeout(() => {
        statusText.textContent = 'Touch to Identify'
      }, 5000)
    }
    if (request.type === 'SHAZAM_RESULT') {
      saveSongDetails(request, async function() {
          displayIdentifiedSongs(); // Wait for data to be displayed
          logo.classList.remove('spin');
          statusText.textContent = 'Touch to Identify'
          songsList.classList.add('show')
      });
  }
  });

  songsList.addEventListener('click', function(event) {
    if (event.target.classList.contains('delete-icon')) {
        // Find the closest song element containing the delete icon
        const songElement = event.target.closest('.song');

        // Get the time key of the song to delete (assuming it's stored as a data attribute)
        const songTime = songElement.dataset.time;

        // Delete the song from storage and update the song list
        deleteSong(songTime);
    }
});

    // Add event listener to the parent songsList container and delegate the click event to its children
    songsList.addEventListener('click', function(event) {
      const songElement = event.target.closest('.song');
      if (songElement) {
          // Extract relevant data from the clicked song element
          const title = songElement.querySelector('.song-title').textContent;
          const subtitle = songElement.querySelector('.song-subtitle').textContent;

          // Open new HTML page with additional links
          chrome.tabs.create({
              url: chrome.extension.getURL(`songDetails.html?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`)
          });
      }
  });


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
      function saveSongDetails(songDetails, callback) {
        getStoredSongs(function(identifiedSongs) {
            identifiedSongs.unshift(songDetails);
            chrome.storage.local.set({ 'identifiedSongs': identifiedSongs }, function() {
                if (typeof callback === 'function') {
                    callback(); // Call the callback function after saving the data
                }
            });
        });
    }

    function deleteSong(songTime) {
      getStoredSongs(function(identifiedSongs) {
          // Find the index of the song to delete based on its time key
          const indexToDelete = identifiedSongs.findIndex(song => song.data.time == songTime);

          if (indexToDelete !== -1) {
              // Remove the song from the identifiedSongs array
              identifiedSongs.splice(indexToDelete, 1);

              // Save the updated identifiedSongs array to storage
              chrome.storage.local.set({ 'identifiedSongs': identifiedSongs }, function() {
                  console.log('Song deleted successfully:', identifiedSongs);
                  // Display the updated song list
                  displayIdentifiedSongs();
              });
          } else {
              console.log('Song not found in storage:', songTime);
              statusText.innerText = songTime
          }
      });
  }

      function displayIdentifiedSongs() {
            getStoredSongs(function(identifiedSongs) {
                songsList.innerHTML = ''; // Clear previous list

                identifiedSongs.forEach(function(song) {
                    // Create elements for the song
                    const { coverArt, title, subtitle, time } = song.data;
                    const songElement = document.createElement('div');
                    songElement.classList.add('song');
                    songElement.setAttribute('id', 'song')

                    songElement.dataset.time = time;

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
                    identificationData.textContent = 'Identified on: ' + time;
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
        });
    }
});
