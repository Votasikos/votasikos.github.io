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
  const fallbackImage = 'fallback.png'; // Replace with your actual fallback image path

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
    let albumCoverUrl = data.tracks?.items?.[0]?.album?.images?.[0]?.url;

    if (!albumCoverUrl) {
      albumCoverUrl = fallbackImage; // Use fallback if no cover found
    }

    const albumCoverElement = document.getElementById('album-cover');
    albumCoverElement.src = albumCoverUrl;
    albumCoverElement.onerror = () => {
      albumCoverElement.src = fallbackImage; // If loading fails, set fallback image
    };

    albumCoverElement.crossOrigin = "Anonymous";

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

  } catch (error) {
    document.getElementById('album-cover').src = fallbackImage;
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
    document.getElementById('listener-number').innerText = listenerCount;
  } catch (error) {
    document.getElementById('listener-number').innerText = 'N/A';
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
async function getTemperatureData() {
  const cities = [
    { name: 'Praha', lat: 50.0755, lon: 14.4378 },
    { name: 'Brno', lat: 49.1951, lon: 16.6068 },
    { name: 'Ostrava', lat: 49.8209, lon: 18.2625 },
    { name: 'Plzeň', lat: 49.7384, lon: 13.3736 },
    { name: 'Liberec', lat: 50.7671, lon: 15.0566 },
    { name: 'Olomouc', lat: 49.5938, lon: 17.2509 },
    { name: 'Ústí nad Labem', lat: 50.6605, lon: 14.0322 },
    { name: 'Hradec Králové', lat: 50.2092, lon: 15.8328 },
    { name: 'Pardubice', lat: 50.0343, lon: 15.7812 },
    { name: 'Zlín', lat: 49.2266, lon: 17.6687 },
    { name: 'České Budějovice', lat: 48.9745, lon: 14.4746 },
    { name: 'Karlovy Vary', lat: 50.2319, lon: 12.8712 },
    { name: 'Jihlava', lat: 49.3984, lon: 15.5874 },
  ];

  let temperatureInfo = '<span class="info-text">Aktuální teploty po ČR: </span> ';
// Paralelní načítání dat pro všechna města
const promises = cities.map(async (city) => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    const temperature = Math.round(data.current_weather.temperature);
    return `${city.name} <span class="temperature">${temperature}°C</span> +++ `;
  } catch (error) {
    return `${city.name} <span class="temperature">N/A°C</span> +++ `;
  }
});


  // Počkejte na dokončení všech požadavků
  const results = await Promise.all(promises);
  temperatureInfo += results.join('');

  // Nastavení textu do elementu
  document.getElementById('temperature-info').innerHTML = temperatureInfo;

  // Restart animace po načtení nových dat
  startTextScroll();
}
function startTextScroll() {
  const rollingText = document.getElementById('rolling-text');
  const temperatureInfo = document.getElementById('temperature-info');

  const textWidth = temperatureInfo.scrollWidth; // Šířka textu
  const containerWidth = 440; // Pevná šířka kontejneru

  const speed = 50; // Rychlost scrollování (pixely za sekundu)
  const animationDuration = (textWidth + containerWidth) / speed; // Doba trvání animace

  // Resetování pozice textu
  temperatureInfo.style.transform = 'translateX(100%)';
  temperatureInfo.style.opacity = '1';

  // Definice klíčových snímků pro animaci
  const keyframes = `
    @keyframes scrollText {
      0% {
        transform: translateX(100%);
      }
      100% {
        transform: translateX(-${textWidth}px);
      }
    }
  `;

  // Přidání klíčových snímků do dokumentu
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);

  // Aplikace animace na text
  temperatureInfo.style.animation = `scrollText ${animationDuration}s linear infinite`;
}
// Přidejte náhledový text při načtení stránky
document.addEventListener('DOMContentLoaded', () => {
  const temperatureInfo = document.getElementById('temperature-info');
  temperatureInfo.innerHTML = '<span class="info-text">Načítám teploty...</span>';
  startTextScroll(); // Spusťte animaci okamžitě

  getTemperatureData(); // Načtěte data o teplotě
  setInterval(getTemperatureData, 600000); // Aktualizace každých 10 minut

  getNowPlaying();
  getListenerCount();
  setInterval(getNowPlaying, 10000);
  setInterval(getListenerCount, 10000);
});
