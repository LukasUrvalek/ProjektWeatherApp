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

document.getElementById("exportJsonBtn").addEventListener("click", async () => {
    const city = document.querySelector(".city").innerText;
    const temperature = document.querySelector(".temperature").innerText;
    const humidity = document.querySelector(".humidity").innerText;
    const wind = document.querySelector(".wind").innerText;
    const pressure = document.querySelector(".pressure").innerText;
    const uv = document.querySelector(".uv").innerText;
    const description = document.querySelector(".description").innerText;

    // Pokus o získání souřadnic města
    const apiUrl = `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(city)}&key=${apiKey}`;
    let latitude = null, longitude = null;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        if (data.data && data.data[0]) {
            latitude = data.data[0].lat;
            longitude = data.data[0].lon;
        }
    } catch (err) {
        console.error("Nepodařilo se získat souřadnice města:", err);
    }

    // Forecast
    const forecastElements = document.querySelectorAll(".forecast-day");
    const forecast = Array.from(forecastElements).map(day => ({
        icon: day.querySelector("img").src,
        temperature: day.querySelector("h4").innerText,
        date: day.querySelector("p").innerText
    }));

    // Aktuální čas
    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

    const weatherData = {
        city,
        coordinates: {
            latitude,
            longitude
        },
        exportedAt: timestamp,
        current: {
            temperature,
            humidity,
            wind,
            pressure,
            uv,
            description
        },
        forecast
    };

    const jsonString = JSON.stringify(weatherData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `weather_${city.replace(/\s+/g, "_").toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
