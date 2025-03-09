// Include the Color Thief library
const colorThief = new ColorThief();

// API credentials
const lautFmApiUrl = 'https://api.laut.fm/station/highfmeu/current_song'; // Station URL
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
    const response = await fetch('https://api.laut.fm/station/highfmeu/listeners');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const listenerCount = await response.text();
    document.getElementById('listener-number').innerText = listenerCount;
  } catch (error) {
    document.getElementById('listener-number').innerText = 'N/A';
  }
}


// Player Controls Functionality
document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio('https://stream.laut.fm/highfmeu'); // Replace with your radio stream URL
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

async function getTemperatureData() {
  const cities = [
    { name: 'Praha', lat: 50.0755, lon: 14.4378 }, // Praha
    { name: 'Brno', lat: 49.1951, lon: 16.6068 },   // Brno
    { name: 'Ostrava', lat: 49.8209, lon: 18.2625 }, // Ostrava
    { name: 'Plzeň', lat: 49.7384, lon: 13.3736 },   // Plzeň
    { name: 'Liberec', lat: 50.7671, lon: 15.0566 }, // Liberec
    { name: 'Olomouc', lat: 49.5938, lon: 17.2509 }, // Olomouc
    { name: 'Ústí nad Labem', lat: 50.6605, lon: 14.0322 }, // Ústí nad Labem
    { name: 'Hradec Králové', lat: 50.2092, lon: 15.8328 }, // Hradec Králové
    { name: 'Pardubice', lat: 50.0343, lon: 15.7812 }, // Pardubice
    { name: 'Zlín', lat: 49.2266, lon: 17.6687 }, // Zlín
    { name: 'České Budějovice', lat: 48.9745, lon: 14.4746 }, // České Budějovice
    { name: 'Karlovy Vary', lat: 50.2319, lon: 12.8712 }, // Karlovy Vary
    { name: 'Jihlava', lat: 49.3984, lon: 15.5874 }, // Jihlava
  ];

  let temperatureInfo = '<span class="info-text">Aktuální teploty po ČR: </span> '; // Přidán text

  for (const city of cities) {
    try {
      // URL pro Open-Meteo API
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;

      const response = await fetch(url);

      // Kontrola, zda je odpověď OK (status code 200)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      const temperature = Math.round(data.current_weather.temperature); // Teplota ve °C
      temperatureInfo += `${city.name.toUpperCase()} <span class="temperature">${temperature}°C</span> +++ `;
    } catch (error) {
      console.error(`Chyba při načítání počasí pro ${city.name}:`, error);
      temperatureInfo += `${city.name.toUpperCase()} <span class="temperature">N/A°C</span> +++ `;
    }
  }

  // Aktualizace teplotních informací v rolling textu
  document.getElementById('temperature-info').innerHTML = temperatureInfo;
}

// Inicializace stránky
document.addEventListener('DOMContentLoaded', () => {
  getTemperatureData(); // Načtení teplotních dat při načtení stránky
  setInterval(getTemperatureData, 600000); // Aktualizace teplot každých 10 minut

  getNowPlaying(); // Načtení aktuálně hrané skladby
  getListenerCount(); // Načtení počtu posluchačů
  setInterval(getNowPlaying, 10000); // Aktualizace skladby každých 10 sekund
  setInterval(getListenerCount, 10000); // Aktualizace počtu posluchačů každých 10 sekund
});
