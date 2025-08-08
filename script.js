const apiKey = '6d80287c49bd74c7d78b175c516327ab';

const searchForm = document.querySelector('#search-form');
const cityInput = document.querySelector('#city-input');
const weatherInfoContainer = document.querySelector('#weather-info-container');

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
    weatherInfoContainer.innerHTML = `<p>กำลังโหลดข้อมูล...</p>`;
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('ไม่พบข้อมูลเมืองนี้');
        }
        const data = await response.json();
        displayWeather(data);
        saveRecentSearch(city);
        getForecast(city);
    } catch (error) {
        weatherInfoContainer.innerHTML = `<p class="error">${error.message}</p>`;
    }
}

function displayWeather(data) {
    const { name, main, weather } = data;
    const { temp, humidity } = main;
    const { description, icon } = weather[0];

    const weatherHtml = `
        <h2 class="text-2xl font-bold">${name}</h2>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${description}">
        <p class="temp">${temp.toFixed(1)}°C</p>
        <p>${description}</p>
        <p>ความชื้น: ${humidity}%</p>
    `;
    weatherInfoContainer.innerHTML = weatherHtml;
}

function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];

    // หลีกเลี่ยงชื่อเมืองซ้ำ
    if (!searches.includes(city)) {
        searches.unshift(city);
        if (searches.length > 5) searches.pop(); // จำกัดไว้แค่ 5 รายการล่าสุด
        localStorage.setItem('recentSearches', JSON.stringify(searches));
    }

    displayRecentSearches();
}

function displayRecentSearches() {
    const list = document.querySelector('#search-list');
    if (!list) return;

    const searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    list.innerHTML = '';

    searches.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.addEventListener('click', () => getWeather(city));
        list.appendChild(li);
    });
}

async function getForecast(city) {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=th`;

    try {
        const response = await fetch(forecastUrl);
        if (!response.ok) throw new Error('ไม่สามารถโหลดพยากรณ์อากาศได้');

        const data = await response.json();
        displayForecast(data.list);
    } catch (error) {
        console.error('Forecast error:', error);
    }
}

function displayForecast(list) {
    const daily = list.filter(item => item.dt_txt.includes("12:00:00"));

    let forecastHtml = '<h3 style="margin-top: 1.5rem;">พยากรณ์ล่วงหน้า 5 วัน</h3>';
    forecastHtml += '<div class="forecast-grid">';

    daily.forEach(day => {
        const date = new Date(day.dt_txt).toLocaleDateString('th-TH', {
            weekday: 'short', day: 'numeric', month: 'short'
        });

        forecastHtml += `
            <div class="forecast-card">
                <p>${date}</p>
                <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="${day.weather[0].description}">
                <p>${day.main.temp.toFixed(1)}°C</p>
                <p>${day.weather[0].description}</p>
            </div>
        `;
    });

    forecastHtml += '</div>';
    weatherInfoContainer.insertAdjacentHTML('beforeend', forecastHtml);
}

// เรียกแสดงรายการค้นหาล่าสุดเมื่อโหลดหน้าเว็บ
displayRecentSearches();
