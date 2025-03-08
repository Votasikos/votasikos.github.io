const colorThief = new ColorThief();

const lautFmApiUrl = 'https://api.laut.fm/station/radio-dance-eu/current_song';
const spotifyClientId = 'a654d3f8a82546e9b5d1dcaf75117daf';
const spotifyClientSecret = '78ee3833697d458aa60d030f4f61f90a';

let isUpdating = false;

let currentSongTitle = '';
let currentArtistName = '';

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
    const albumCoverUrl = data.tracks?.items?.[0]?.album?.images?.[0]?.url;

    if (albumCoverUrl) {
      document.getElementById('album-cover').src = albumCoverUrl;
      document.getElementById('album-cover').crossOrigin = "Anonymous";

      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = albumCoverUrl;
      img.onload = () => {
        const color = colorThief.getColor(img);
        const darkerColor = makeColorDarker(color);
        const evenDarkerColor = makeColorEvenDarker(color);

        document.body.style.background = `linear-gradient(
          to bottom,
          rgb(${evenDarkerColor.join(', ')}),
          #000000
        )`;
        document.body.style.backgroundAttachment = "fixed";

        document.querySelector('#now-playing').style.backgroundColor = `rgb(${darkerColor.join(', ')})`;
      };
    }
  } catch (error) {
  }
}

function makeColorDarker(color, darknessFactor = 0.6) {
  return color.map(value => Math.floor(value * darknessFactor));
}

function makeColorEvenDarker(color) {
  const darknessFactor = 0.4;
  return makeColorDarker(color, darknessFactor);
}

async function getNowPlaying() {
  if (isUpdating) {
    return;
  }

  isUpdating = true;

  try {
    const response = await fetch(lautFmApiUrl);
    const data = await response.json();

    const songTitle = data.title;
    const artistName = data.artist.name;

    if (songTitle === currentSongTitle && artistName === currentArtistName) {
      isUpdating = false;
      return;
    }

    currentSongTitle = songTitle;
    currentArtistName = artistName;

    const trackInfo = document.querySelector('.track-info');
    trackInfo.classList.add('slide-out');

    setTimeout(() => {
      document.getElementById('song-title').innerText = songTitle;
      document.getElementById('artist-name').innerText = artistName;

      trackInfo.classList.remove('slide-out');
      trackInfo.classList.add('slide-in');

      setTimeout(() => {
        trackInfo.classList.remove('slide-in');
        isUpdating = false;
      }, 500);
    }, 500);

    getAlbumCoverFromSpotify(artistName, songTitle);

  } catch (error) {
    isUpdating = false;
  }
}

async function getListenerCount() {
  try {
    const response = await fetch('https://api.laut.fm/station/radio-dance-eu/listeners');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const listenerCount = await response.text();

    document.getElementById('listener-count').innerText = `Listeners: ${listenerCount}`;
  } catch (error) {
    document.getElementById('listener-count').innerText = 'Listeners: N/A';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const audio = new Audio('https://stream.laut.fm/radio-dance-eu');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const volumeSlider = document.getElementById('volume-slider');

  audio.volume = 0.5;

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

  volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
  });
});

document.addEventListener('DOMContentLoaded', () => {
  getNowPlaying();
  getListenerCount();
  setInterval(getNowPlaying, 10000);
  setInterval(getListenerCount, 10000);
});
