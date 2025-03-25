
// weatherService.js – komunikace s API Weatherbit
const apiKey = '17629d6d4a324589ab60882aae435e90';

async function getWeatherByCity(city) {
    const url = `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(city)}&key=${apiKey}`;
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
        console.error("Chyba při načítání aktuálního počasí:", err);
    }
    return null;
}

async function getForecastByCity(city) {
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${encodeURIComponent(city)}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.data.slice(0, 7).map(day => ({
            high_temperature: Math.round(day.high_temp),
            low_temperature: Math.round(day.low_temp),
            icon: getWeatherIcon(day.weather.icon)
        }));
    } catch (err) {
        console.error("Chyba při načítání předpovědi:", err);
    }
    return null;
}
