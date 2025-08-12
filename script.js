const apiKey = '0a04e0f90be095af26f94c5fdee3ddd2';

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');

// บันทึกการค้นหาล่าสุดใน Local Storage
function saveSearchHistory(city) {
    let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (!history.includes(city)) {
        history.unshift(city);
        if (history.length > 5) history = history.slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(history));
    }
    displaySearchHistory();
}

function displaySearchHistory() {
    // ลบประวัติก่อนหน้าที่เคยแสดง
    const existingContainer = document.querySelector('.history-container');
    if (existingContainer) {
        existingContainer.remove();
    }

    const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
    if (history.length === 0) return;

    const container = document.createElement('div');
    container.classList.add('history-container');
    container.innerHTML = `
        <h3>ค้นหาล่าสุด</h3>
        ${history.map(city => `<button class="history-btn" data-city="${city}">${city}</button>`).join('')}
    `;

    weatherInfoContainer.prepend(container);

    document.querySelectorAll('.history-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            getWeather(btn.dataset.city);
        })
    );
}


searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const cityName = cityInput.value.trim();
    if (cityName) {
        getWeather(cityName);
    } else {
        alert('กรุณาป้อนชื่อเมือง');
    }
});

async function getWeather(city) {
    weatherInfoContainer.innerHTML = `<p class="loading">กำลังโหลดข้อมูล...</p>`;

    try {
        const [currentRes, forecastRes] = await Promise.all([
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`),
            fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`)
        ]);

        if (!currentRes.ok || !forecastRes.ok) {
            throw new Error('ไม่พบข้อมูลเมืองนี้');
        }

        const currentData = await currentRes.json();
        const forecastData = await forecastRes.json();

        displayWeather(currentData, forecastData);
        updateBackground(currentData.sys.sunrise, currentData.sys.sunset, currentData.timezone);

        saveSearchHistory(city);
    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayWeather(current, forecast) {
    const { name, main, weather, wind } = current;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    const forecastList = forecast.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 5);

    const forecastHtml = forecastList.map(item => {
        const date = new Date(item.dt_txt).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
        return `
            <div class="detail-item">
                <div class="detail-label">${date}</div>
                <div class="detail-value">
                    <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}">
                    ${item.main.temp.toFixed(1)}°C
                </div>
            </div>`;
    }).join('');

    weatherInfoContainer.innerHTML = `
        <div class="location">${name}</div>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p class="description">${description}</p>
        <div class="details">
            <div class="detail-item">
                <div class="detail-label">ความชื้น</div>
                <div class="detail-value">${humidity}%</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">ลม</div>
                <div class="detail-value">${wind.speed} m/s</div>
            </div>
        </div>
        <h3 style="margin-top:2rem;">พยากรณ์ 5 วัน</h3>
        <div class="details">${forecastHtml}</div>
    `;

    displaySearchHistory(); // แสดงปุ่มประวัติด้านบน
}

function updateBackground(sunrise, sunset, timezone) {
    // เวลาปัจจุบันของเมืองนั้น
    const nowUTC = Math.floor(Date.now() / 1000);
    const localTime = nowUTC + timezone;

    if (localTime >= sunrise && localTime < sunset) {
        document.body.classList.add("day");
        document.body.classList.remove("night");
    } else {
        document.body.classList.add("night");
        document.body.classList.remove("day");
    }
}
