
// chartRenderer.js – vykreslení grafu
function renderForecastChart(labels, highs, lows) {
    const ctx = document.getElementById("forecastChart").getContext("2d");

    if (window.forecastChart && typeof window.forecastChart.destroy === 'function') {
        window.forecastChart.destroy();
    }

    window.forecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Day',
                    data: highs,
                    borderColor: 'orange',
                    backgroundColor: 'orange',
                    tension: 0.3
                },
                {
                    label: 'Night',
                    data: lows,
                    borderColor: 'lightblue',
                    backgroundColor: 'lightblue',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        color: '#fff' // barva popisků na ose Y
                    }
                },
                x: {
                    ticks: {
                        color: '#fff' // barva popisků na ose X
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff' // barva legendy (popisky Day/Night)
                    }
                }
            }
        }        
    });
}
