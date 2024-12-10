// Documentation: https://www.carqueryapi.com/documentation/api-usage/
const BASE_URL = "https://www.carqueryapi.com/api/0.3/";

const yearSelect = document.getElementById('year-select');
const makeSelect = document.getElementById('make-select');
const modelSelect = document.getElementById('model-select');
const carForm = document.getElementById('car-form');
const resultsSection = document.getElementById('results-section');
const carInfoDiv = document.getElementById('car-info');
const searchAgainBtn = document.getElementById('search-again');
const compareBtn = document.getElementById('compare-button');
const compareSection = document.getElementById('compare-section');
const compareTableContainer = document.getElementById('compare-table-container');
const clearCompareBtn = document.getElementById('clear-compare');

let compareCars = [];

function initYears() {
    const currentYear = new Date().getFullYear();
    let options = `<option value="">Select a Year</option>`;
    for (let y = currentYear; y >= 1980; y--) {
        options += `<option value="${y}">${y}</option>`;
    }
    yearSelect.innerHTML = options;
}
initYears();

async function fetchMakes(year) {
    const url = `${BASE_URL}?cmd=getMakes&year=${year}&sold_in_us=1`;
    const response = await fetch(url);
    const dataText = await response.text();
    const startIndex = dataText.indexOf('(');
    const endIndex = dataText.lastIndexOf(')');
    const jsonString = dataText.substring(startIndex + 1, endIndex);
    const data = JSON.parse(jsonString);
    return data.Makes || [];
}

async function fetchModels(year, make) {
    const url = `${BASE_URL}?cmd=getModels&make=${encodeURIComponent(make)}&year=${year}&sold_in_us=1`;
    const response = await fetch(url);
    const dataText = await response.text();
    const startIndex = dataText.indexOf('(');
    const endIndex = dataText.lastIndexOf(')');
    const jsonString = dataText.substring(startIndex + 1, endIndex);
    const data = JSON.parse(jsonString);
    return data.Models || [];
}

async function fetchTrims(year, make, model) {
    const url = `${BASE_URL}?cmd=getTrims&year=${year}&make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&sold_in_us=1`;
    const response = await fetch(url);
    const dataText = await response.text();
    const startIndex = dataText.indexOf('(');
    const endIndex = dataText.lastIndexOf(')');
    const jsonString = dataText.substring(startIndex + 1, endIndex);
    const data = JSON.parse(jsonString);
    return data.Trims || [];
}

yearSelect.addEventListener('change', async () => {
    const year = yearSelect.value;
    makeSelect.disabled = true;
    modelSelect.disabled = true;
    if (!year) return;
    makeSelect.innerHTML = `<option value="">Loading makes...</option>`;
    const makes = await fetchMakes(year);
    if (makes.length === 0) {
        makeSelect.innerHTML = `<option value="">No makes found for this year</option>`;
        return;
    }
    makeSelect.innerHTML = `<option value="">Select a Make</option>`;
    makes.forEach(m => {
        const option = document.createElement('option');
        option.value = m.make_display;
        option.textContent = m.make_display;
        makeSelect.appendChild(option);
    });
    makeSelect.disabled = false;
});

makeSelect.addEventListener('change', async () => {
    const year = yearSelect.value;
    const make = makeSelect.value;
    modelSelect.disabled = true;
    if (!make) return;
    modelSelect.innerHTML = `<option value="">Loading models...</option>`;
    const models = await fetchModels(year, make);
    if (models.length === 0) {
        modelSelect.innerHTML = `<option value="">No models found</option>`;
        return;
    }
    modelSelect.innerHTML = `<option value="">Select a Model</option>`;
    models.forEach(m => {
        const option = document.createElement('option');
        option.value = m.model_name;
        option.textContent = m.model_name;
        modelSelect.appendChild(option);
    });
    modelSelect.disabled = false;
});

carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const year = yearSelect.value;
    const make = makeSelect.value;
    const model = modelSelect.value;

    if (!year || !make || !model) return;

    const trims = await fetchTrims(year, make, model);
    if (!trims || trims.length === 0) {
        carInfoDiv.innerHTML = `<p>No detailed info found.</p>`;
        resultsSection.classList.remove('hidden');
        return;
    }

    const trim = trims[0];
    displayCarDetails(trim);
});

function displayCarDetails(trim) {
    resultsSection.classList.remove('hidden');
    carInfoDiv.innerHTML = '';

    let imgSrc = trim.model_img || '';
    if (!imgSrc) {
        imgSrc = 'https://via.placeholder.com/300x200?text=No+Image+Available';
    }

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `${trim.model_make_display} ${trim.model_name} ${trim.model_year}`;
    carInfoDiv.appendChild(img);

    const infoList = document.createElement('ul');
    infoList.innerHTML = `
        <li><strong>Make:</strong> ${trim.model_make_display}</li>
        <li><strong>Model:</strong> ${trim.model_name}</li>
        <li><strong>Year:</strong> ${trim.model_year}</li>
        <li><strong>Body Type:</strong> ${trim.model_body || 'N/A'}</li>
        <li><strong>Engine:</strong> ${trim.model_engine_cc ? (trim.model_engine_cc + 'cc ' + (trim.model_engine_type || 'Engine')) : 'N/A'}</li>
        <li><strong>Fuel Type:</strong> ${trim.model_engine_fuel || 'N/A'}</li>
        <li><strong>Transmission:</strong> ${trim.model_transmission_type || 'N/A'}</li>
        <li><strong>Drive Type:</strong> ${trim.model_drive || 'N/A'}</li>
        <li><strong>Horsepower:</strong> ${trim.model_engine_power_ps ? trim.model_engine_power_ps + ' PS' : 'N/A'}</li>
    `;
    carInfoDiv.appendChild(infoList);
}

searchAgainBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    carInfoDiv.innerHTML = '';
    carForm.reset();
    makeSelect.disabled = true;
    modelSelect.disabled = true;
});

compareBtn.addEventListener('click', () => {
    const liItems = carInfoDiv.querySelectorAll('ul li');
    const carData = {};

    liItems.forEach(li => {
        const parts = li.innerHTML.split('</strong>');
        const key = parts[0].replace('<strong>', '').replace(':', '').trim();
        const value = parts[1].trim();
        carData[key] = value;
    });

    const img = carInfoDiv.querySelector('img');
    carData['Image'] = img ? img.src : '';

    compareCars.push(carData);
    updateCompareTable();
});

function updateCompareTable() {
    if (compareCars.length === 0) {
        compareSection.classList.add('hidden');
        compareTableContainer.innerHTML = '';
        return;
    }

    compareSection.classList.remove('hidden');

    const allKeys = new Set();
    compareCars.forEach(car => {
        Object.keys(car).forEach(key => allKeys.add(key));
    });

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>Specification</th>` + compareCars.map((_, i) => `<th>Car ${i+1}</th>`).join('');
    thead.appendChild(headerRow);

    allKeys.forEach(key => {
        const row = document.createElement('tr');
        const cells = [`<td><strong>${key}</strong></td>`];
        compareCars.forEach(car => {
            let value = car[key] || 'N/A';
            if (key === 'Image' && value !== 'N/A' && value !== '') {
                value = `<img src="${value}" style="max-width:100px;"/>`;
            }
            cells.push(`<td>${value}</td>`);
        });
        row.innerHTML = cells.join('');
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    compareTableContainer.innerHTML = '';
    compareTableContainer.appendChild(table);
}

clearCompareBtn.addEventListener('click', () => {
    compareCars = [];
    updateCompareTable();
});
