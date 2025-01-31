document.addEventListener("DOMContentLoaded", () => {
    console.log("Script loaded successfully!");

    // Initialize Odometers with specific formats
    const daysOdometer = new Odometer({ el: document.getElementById('days'), value: 0, format: 'd' });
    const hoursOdometer = new Odometer({ el: document.getElementById('hours'), value: 0, format: 'dd' });
    const minutesOdometer = new Odometer({ el: document.getElementById('minutes'), value: 0, format: 'dd' });
    const secondsOdometer = new Odometer({ el: document.getElementById('seconds'), value: 0, format: 'dd' });

    function updateCountdown() {
        const now = new Date();
        const targetDate = new Date('2025-02-01T19:00:00');
        const diff = targetDate - now;

        daysOdometer.update(Math.floor(diff / 864e5));
        hoursOdometer.update(Math.floor(diff / 36e5 % 24));
        minutesOdometer.update(Math.floor(diff / 6e4 % 60));
        secondsOdometer.update(Math.floor(diff / 1e3 % 60));
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Artist rotation logic
    const artistsList = [
        "hovinkovasracka",
        "Dzagub",
        "hvnpan",
        "lostondos",
        "DeratizacniKevlar5",
        "Krystof Crack",
        "Julca$h",
        "DjCarlozz"
    ];

    let artistIndex = 0;
    const artistsElement = document.getElementById("artists");

    function changeArtist() {
        console.log("Changing artist...");

        // Remove old artist smoothly
        const oldArtist = artistsElement.querySelector(".artist-text");
        if (oldArtist) {
            oldArtist.classList.remove("active");
            setTimeout(() => oldArtist.remove(), 500);
        }

        // Create new artist element
        const newArtist = document.createElement("div");
        newArtist.classList.add("artist-text");
        newArtist.textContent = artistsList[artistIndex];

        // Append new artist
        artistsElement.appendChild(newArtist);

        // Apply animation
        setTimeout(() => {
            newArtist.classList.add("active");
        }, 10);

        // Update index
        artistIndex = (artistIndex + 1) % artistsList.length;
    }

    setInterval(changeArtist, 2000);
    changeArtist();
});
