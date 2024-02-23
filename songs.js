document.addEventListener('DOMContentLoaded', function() {
    // Function to extract URL parameters
    function getUrlParameter(name) {
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
        const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
        const results = regex.exec(location.search);
        return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
    };

    chrome.storage.local.get('identifiedSongs', function(data) {
        const identifiedSongs = data.identifiedSongs || [];
        const title = getUrlParameter('title');
        const subtitle = getUrlParameter('subtitle');

        // Find the song in the identifiedSongs array
        const song = identifiedSongs.find(song => song.data.title === title && song.data.subtitle === subtitle);

        if (song) {
            const { title, subtitle, coverArt, apple, spotify, youtubeurl } = song.data;

            // Set song title and subtitle
            document.getElementById('songTitle').textContent = title;
            document.getElementById('songSubtitle').textContent = subtitle;
            document.getElementById('song-image').src = coverArt
            // Set external links
            document.getElementById('appleMusicLink').href = apple;
            document.getElementById('spotifyLink').href = spotify;
            document.getElementById('youtubeLink').href = youtubeurl;
        }
    });
});
