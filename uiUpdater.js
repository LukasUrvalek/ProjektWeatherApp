// uiUpdater.js – aktualizace obsahu na stránce
function updateUI(weather, forecast) {
    if (!weather || !forecast) return;

    const uvIndexLabel = GetUvIndexDescription(weather.uv);

    document.querySelector(".city").innerText = weather.city;
    document.querySelector(".temperature").innerText = `${weather.temperature} ˚C`;
    document.querySelector(".humidity").innerText = `${weather.humidity} %`;
    document.querySelector(".wind").innerText = `${weather.wind} m/s`;
    document.querySelector(".pressure").innerText = `${weather.pressure} hPa`;
    document.querySelector(".uv").innerText = `${weather.uv} - ${uvIndexLabel}`;
    document.querySelector(".description").innerText = weather.description;
    document.querySelector(".weather-icon").src = getWeatherIcon(weather.code);

    const forecastContainer = document.querySelector(".forecast-scrollable");
    forecastContainer.innerHTML = "";
    const labels = [], highs = [], lows = [];

    forecast.forEach((day, index) => {
        const div = document.createElement("div");
        div.className = "forecast-day";

        const date = new Date();
        date.setDate(date.getDate() + index);
        const dayLabel = index === 0 ? "Today" : `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.`;

        div.innerHTML = `
            <img src="${day.icon}" alt="">
            <h4>${day.high_temperature}/${day.low_temperature}˚C</h4>
            <p>${dayLabel}</p>
        `;

        forecastContainer.appendChild(div);
        labels.push(dayLabel);
        highs.push(day.high_temperature);
        lows.push(day.low_temperature);
    });

    renderForecastChart(labels, highs, lows);

    // 🌍 Přesun mapy a markeru
    if (map && weather.coordinates) {
        const lat = weather.coordinates.latitude;
        const lon = weather.coordinates.longitude;

        map.setView([lat, lon], 8);

        if (mapMarker) {
            mapMarker.setLatLng([lat, lon]);
        } else {
            mapMarker = L.marker([lat, lon]).addTo(map);
        }
    }
}

function GetUvIndexDescription(uvIndex) {
    switch (true) {
        case (uvIndex <= 2):
            return "Low";
        case (uvIndex <= 5):
            return "Moderate";
        case (uvIndex <= 7):
            return "High";
        case (uvIndex <= 10):
            return "Very high";
        default:
            return "Extreme";
    }
}