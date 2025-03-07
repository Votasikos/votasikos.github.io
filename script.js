// Include the Color Thief library
const colorThief = new ColorThief();

// API credentials
const lautFmApiUrl = 'https://api.laut.fm/station/radio-dance-eu/current_song'; // Station URL
const spotifyClientId = 'a654d3f8a82546e9b5d1dcaf75117daf'; // Replace with your Spotify Client ID
const spotifyClientSecret = '78ee3833697d458aa60d030f4f61f90a'; // Replace with your Spotify Client Secret

// Flag to track if an update is in progress
let isUpdating = false;

// Variables to track current track information
let currentSongTitle = '';
let currentArtistName = '';

// Function to get Spotify access token
async function getSpotifyAccessToken() {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${spotifyClientId}:${spotifyClientSecret}`),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    return null;
  }
}

// Function to fetch album cover from Spotify
async function getAlbumCoverFromSpotify(artist, track) {
  try {
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      throw new Error('Failed to get Spotify access token');
    }

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=track:${encodeURIComponent(track)} artist:${encodeURIComponent(artist)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    const albumCoverUrl = data.tracks?.items?.[0]?.album?.images?.[0]?.url; // Get the largest image

    if (albumCoverUrl) {
      document.getElementById('album-cover').src = albumCoverUrl;
      document.getElementById('album-cover').crossOrigin = "Anonymous"; // Set cross-origin header

      // Use Color Thief to extract the dominant color
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Allow cross-origin access
      img.src = albumCoverUrl;
      img.onload = () => {
        const color = colorThief.getColor(img); // Get dominant color
        const darkerColor = makeColorDarker(color); // Make the color darker for the "Now Playing" section
        const evenDarkerColor = makeColorEvenDarker(color); // Make the color even darker for the background

        // Apply the even darker color to the gradient background
        document.body.style.background = `linear-gradient(
          to bottom,
          rgb(${evenDarkerColor.join(', ')}), /* Even darker album color at the top */
          #000000 /* Dark gray at the bottom */
        )`;
        document.body.style.backgroundAttachment = "fixed"; // Ensure the gradient covers the entire page

        // Update the "Now Playing" section background
        document.querySelector('#now-playing').style.backgroundColor = `rgb(${darkerColor.join(', ')})`;
      };
    }
  } catch (error) {
    // Handle error silently
  }
}

// Function to make a color darker
function makeColorDarker(color, darknessFactor = 0.6) {
  return color.map(value => Math.floor(value * darknessFactor)); // Reduce each RGB value
}

// Function to make a color even darker for the background
function makeColorEvenDarker(color) {
  const darknessFactor = 0.4; // Adjust this value to control how much darker the color becomes
  return makeColorDarker(color, darknessFactor);
}

// Fetch now playing track from laut.fm API
async function getNowPlaying() {
  // Check if an update is already in progress
  if (isUpdating) {
    return;
  }

  // Set the flag to indicate an update is in progress
  isUpdating = true;

  try {
    const response = await fetch(lautFmApiUrl);
    const data = await response.json();

    const songTitle = data.title;
    const artistName = data.artist.name;  // Artist name is nested in the 'artist' object

    // Check if the track information has changed
    if (songTitle === currentSongTitle && artistName === currentArtistName) {
      isUpdating = false; // Reset the flag
      return;
    }

    // Update the current track information
    currentSongTitle = songTitle;
    currentArtistName = artistName;

    // Trigger slide-out animation
    const trackInfo = document.querySelector('.track-info');
    trackInfo.classList.add('slide-out');

    // Wait for the slide-out animation to complete
    setTimeout(() => {
      // Update the "Now Playing" section
      document.getElementById('song-title').innerText = songTitle;
      document.getElementById('artist-name').innerText = artistName;

      // Trigger slide-in animation
      trackInfo.classList.remove('slide-out');
      trackInfo.classList.add('slide-in');

      // Remove slide-in class after animation completes
      setTimeout(() => {
        trackInfo.classList.remove('slide-in');

        // Reset the flag after the animation completes
        isUpdating = false;
      }, 500); // Match the duration of the slide-in animation
    }, 500); // Match the duration of the slide-out animation

    // Fetch album cover from Spotify using the track info
    getAlbumCoverFromSpotify(artistName, songTitle);

  } catch (error) {
    // Reset the flag if an error occurs
    isUpdating = false;
  }
}

// Function to fetch listener count
async function getListenerCount() {
  try {
    const response = await fetch('https://api.laut.fm/station/radio-dance-eu/listeners');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const listenerCount = await response.text(); // The API returns the listener count as plain text

    // Update the listener count in the UI
    document.getElementById('listener-count').innerText = `Listeners: ${listenerCount}`;
  } catch (error) {
    document.getElementById('listener-count').innerText = 'Listeners: N/A'; // Fallback text
  }
}

// Player Controls Functionality
document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio('https://stream.laut.fm/radio-dance-eu'); // Replace with your radio stream URL
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const volumeSlider = document.getElementById('volume-slider');

  // Set initial volume to 50%
  audio.volume = 0.5;

  // Play/Pause Button
  playPauseBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'inline';
    } else {
      audio.pause();
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
    }
  });

  // Volume Slider
  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
  });
});

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  getNowPlaying();
  getListenerCount(); // Call the listener count function on page load
  setInterval(getNowPlaying, 10000); // Update now playing every 10 seconds
  setInterval(getListenerCount, 10000); // Update listener count every 10 seconds
});
