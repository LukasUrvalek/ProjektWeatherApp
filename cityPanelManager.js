function loadSavedCities() {
    const saved = localStorage.getItem("savedCities");
    return saved ? JSON.parse(saved) : [];
}

function saveCities(cities) {
    localStorage.setItem("savedCities", JSON.stringify(cities));
}

function addCityToStorage(city) {
    const cities = loadSavedCities();
    if (!cities.includes(city)) {
        cities.push(city);
        saveCities(cities);
    }
}

function removeCityFromStorage(city) {
    const cities = loadSavedCities().filter(c => c.toLowerCase() !== city.toLowerCase());
    saveCities(cities);
}

function setupCityAddHandler() {
    const addButton = document.getElementById("addCityBtn");
    const input = document.getElementById("addCityInput");
    const clickSound = new Audio("Sounds/sound_click.mp3");

    async function handleAddCity() {
        clickSound.play();

        const city = input.value.trim();
        if (!city) return;

        const weather = await getWeatherByCity(city);
        if (!weather) {
            alert("Město nebylo nalezeno.");
            return;
        }

        addCityPanel(weather);
        addCityToStorage(weather.city);
        input.value = "";
        input.blur();
    }

    addButton.addEventListener("click", handleAddCity);
    input.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            handleAddCity();
        }
    });
}

function addCityPanel(weather) {
    const container = document.querySelector(".menu-content");

    const exists = Array.from(container.querySelectorAll(".menu-city-name"))
        .some(el => el.textContent.toLowerCase() === weather.city.toLowerCase());
    if (exists) return;

    const panel = document.createElement("div");
    panel.className = "menu-city-panel";
    panel.innerHTML = `
        <img src="${getWeatherIcon(weather.code)}" alt="" class="menu-icon">
        <div>
            <p class="menu-city-name">${weather.city}</p>
            <p class="menu-city-temp">${weather.temperature}°C</p>
        </div>
    `;

    // 🔁 PŘIDÁME KLIKNUTÍ
    panel.addEventListener("click", async () => {
        const city = weather.city;

        const weatherData = await getWeatherByCity(city);
        const forecastData = await getForecastByCity(city);

        if (weatherData && forecastData) {
            updateUI(weatherData, forecastData);
        }

        document.getElementById("menuPanel").classList.remove("active");
    });

    container.appendChild(panel);
    addCityToStorage(weather.city);

    // Swipe odstranění (touch gesture)
    let touchStartX = 0;

    panel.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
    });

    panel.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diffX = touchEndX - touchStartX;
        const deleteSound = new Audio("Sounds/sound_delete.mp3");

        if (Math.abs(diffX) > 50) {
            // Animace před odstraněním
            panel.style.transition = "transform 0.3s ease, opacity 0.3s ease";
            panel.style.transform = `translateX(${diffX > 0 ? "100%" : "-100%"})`;
            panel.style.opacity = "0";

            deleteSound.play();

            setTimeout(() => {
                panel.remove();
                removeCityFromStorage(weather.city);
            }, 300);
        }
    });
}

// Spustí se po načtení stránky
document.addEventListener("DOMContentLoaded", () => {
    setupCityAddHandler();
});