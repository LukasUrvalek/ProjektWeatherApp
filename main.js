// main.js – vstupní bod aplikace
document.addEventListener("DOMContentLoaded", async () => {
    const searchButton = document.querySelector(".search button");
    const searchInput = document.querySelector(".search input");

    setupCityAddHandler();

    const savedCities = loadSavedCities();
    for (const city of savedCities) {
        const weather = await getWeatherByCity(city);
        if (weather) {
            addCityPanel(weather);
        }
    }

    searchButton.addEventListener("click", async () => {
        const city = searchInput.value.trim();
        if (city !== "") {
            const weather = await getWeatherByCity(city);
            const forecast = await getForecastByCity(city);
            updateUI(weather, forecast);
        }
    });

    searchInput.addEventListener("keypress", async (event) => {
        if (event.key === "Enter") {
            const city = searchInput.value.trim();
            if (city !== "") {
                const weather = await getWeatherByCity(city);
                const forecast = await getForecastByCity(city);
                updateUI(weather, forecast);
                input.blur();
            }
        }
    });

    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const weather = await getWeatherByCoords(lat, lon);
            const forecast = await getForecastByCoords(lat, lon);
            updateUI(weather, forecast);
        });
    }
});

async function getWeatherByCoords(lat, lon) {
    const url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.data.length > 0) {
            const w = data.data[0];
            return {
                temperature: Math.round(w.temp),
                humidity: w.rh,
                wind: w.wind_spd,
                pressure: w.pres,
                uv: w.uv,
                code: w.weather.icon,
                description: w.weather.description,
                city: w.city_name
            };
        }
    } catch (err) {
        console.error("Chyba při načítání polohy:", err);
    }
    return null;
}

async function getForecastByCoords(lat, lon) {
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data.slice(0, 7).map(day => ({
            high_temperature: Math.round(day.high_temp),
            low_temperature: Math.round(day.low_temp),
            icon: getWeatherIcon(day.weather.icon)
        }));
    } catch (err) {
        console.error("Chyba při načítání předpovědi podle souřadnic:", err);
    }
    return null;
}

document.getElementById("menu_bar").addEventListener("click", () => {
    document.getElementById("menuPanel").classList.toggle("active");
});

document.addEventListener("click", (event) => {
    const panel = document.getElementById("menuPanel");
    const toggleButton = document.getElementById("menu_bar");

    // Pokud klik nebyl na panel ani na tlačítko, skryj panel
    if (
        panel.classList.contains("active") &&
        !panel.contains(event.target) &&
        !toggleButton.contains(event.target)
    ) {
        panel.classList.remove("active");
    }
});

document.getElementById("infoBtn").addEventListener("click", () => {
    const toast = document.getElementById("infoToast");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 5000);
});