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
    const userChoice = confirm("Chcete exportovat aktuální data (OK), nebo importovat z JSON (Zrušit)?");

    if (userChoice) {
        // === EXPORT ===
        const city = document.querySelector(".city").innerText;
        const temperature = document.querySelector(".temperature").innerText;
        const humidity = document.querySelector(".humidity").innerText;
        const wind = document.querySelector(".wind").innerText;
        const pressure = document.querySelector(".pressure").innerText;
        const uv = document.querySelector(".uv").innerText;
        const description = document.querySelector(".description").innerText;

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

        const forecastElements = document.querySelectorAll(".forecast-day");
        const forecast = Array.from(forecastElements).map(day => ({
            icon: day.querySelector("img").src,
            temperature: day.querySelector("h4").innerText,
            date: day.querySelector("p").innerText
        }));

        const now = new Date();
        const timestamp = now.toISOString().replace("T", " ").substring(0, 19);

        const weatherData = {
            city,
            coordinates: { latitude, longitude },
            exportedAt: timestamp,
            current: { temperature, humidity, wind, pressure, uv, description },
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

    } else {
        // === IMPORT ===
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";

        input.addEventListener("change", async () => {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    const city = data.city;

                    const weather = await getWeatherByCity(city);
                    const forecast = await getForecastByCity(city);

                    if (weather && forecast) {
                        addCityPanel(weather);
                        updateUI(weather, forecast);
                        alert(`Město "${city}" bylo úspěšně importováno a přidáno do oblíbených.`);
                    } else {
                        alert("Nepodařilo se načíst data pro importované město.");
                    }

                } catch (err) {
                    alert("Chybný formát souboru nebo poškozený JSON.");
                    console.error("Chyba při importu:", err);
                }
            };

            reader.readAsText(file);
        });

        input.click(); // spustí dialog pro výběr souboru
    }
});

let map;       // Leaflet mapa
let mapMarker; // Marker na mapě

document.addEventListener("DOMContentLoaded", () => {
    map = L.map('map').setView([50.0755, 14.4378], 6); // výchozí Praha

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', async function (e) {
        const { lat, lng } = e.latlng;

        if (mapMarker) map.removeLayer(mapMarker);
        mapMarker = L.marker([lat, lng]).addTo(map);

        const weather = await getWeatherByCoords(lat, lng);
        const forecast = await getForecastByCoords(lat, lng);

        if (weather && forecast) {
            updateUI(weather, forecast, { lat, lon: lng });
        } else {
            alert("Nepodařilo se načíst data pro tuto lokalitu.");
        }
    });
});
