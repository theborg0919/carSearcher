const apiKey = "YOUR_EDMUNDS_API_KEY";

const makeSelect = document.getElementById('make-select');
const modelSelect = document.getElementById('model-select');
const yearSelect = document.getElementById('year-select');
const carForm = document.getElementById('car-form');
const resultsSection = document.getElementById('results-section');
const carInfoDiv = document.getElementById('car-info');
const searchAgainBtn = document.getElementById('search-again');
const compareBtn = document.getElementById('compare-button');
const compareSection = document.getElementById('compare-section');
const compareTableContainer = document.getElementById('compare-table-container');
const clearCompareBtn = document.getElementById('clear-compare');

let compareCars = [];

async function fetchMakes() {
    const url = `https://api.edmunds.com/api/vehicle/v2/makes?fmt=json&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.makes || [];
}

async function fetchModels(make) {
    const url = `https://api.edmunds.com/api/vehicle/v2/${make}/models?fmt=json&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.models || [];
}

async function fetchYears(make, model) {
    const url = `https://api.edmunds.com/api/vehicle/v2/${make}/${model}?fmt=json&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.years || [];
}

async function fetchCarDetails(make, model, year) {
    const url = `https://api.edmunds.com/api/vehicle/v2/${make}/${model}/${year}?fmt=json&api_key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

async function initMakes() {
    const makes = await fetchMakes();
    makeSelect.innerHTML = `<option value="">Select a Make</option>`;
    makes.forEach(makeObj => {
        const option = document.createElement('option');
        option.value = makeObj.niceName;
        option.textContent = makeObj.name;
        makeSelect.appendChild(option);
    });
}


makeSelect.addEventListener('change', async () => {
    const make = makeSelect.value;
    modelSelect.disabled = true;
    yearSelect.disabled = true;
    modelSelect.innerHTML = `<option value="">Loading models...</option>`;
    if (make) {
        const models = await fetchModels(make);
        modelSelect.innerHTML = `<option value="">Select a Model</option>`;
        models.forEach(modelObj => {
            const option = document.createElement('option');
            option.value = modelObj.niceName;
            option.textContent = modelObj.name;
            modelSelect.appendChild(option);
        });
        modelSelect.disabled = false;
    }
});

modelSelect.addEventListener('change', async () => {
    const make = makeSelect.value;
    const model = modelSelect.value;
    yearSelect.disabled = true;
    yearSelect.innerHTML = `<option value="">Loading years...</option>`;
    if (model) {
        const years = await fetchYears(make, model);
        yearSelect.innerHTML = `<option value="">Select a Year</option>`;
        years.forEach(yearObj => {
            const option = document.createElement('option');
            option.value = yearObj.year;
            option.textContent = yearObj.year;
            yearSelect.appendChild(option);
        });
        yearSelect.disabled = false;
    }
});

carForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const make = makeSelect.value;
    const model = modelSelect.value;
    const year = yearSelect.value;
    
    if (!make || !model || !year) return;

    const carDetails = await fetchCarDetails(make, model, year);

    displayCarDetails(carDetails);
});

function displayCarDetails(details) {
    resultsSection.classList.remove('hidden');
    carInfoDiv.innerHTML = '';

    const { make, model, year, categories, styles } = details;

    let imgSrc = '';
    if (details.media && details.media.photos && details.media.photos.length > 0) {
        imgSrc = details.media.photos[0].sources[0].link.href;
    }

    if (imgSrc) {
        const img = document.createElement('img');
        img.src = imgSrc;
        img.alt = `${make.name} ${model.name} ${year.year}`;
        carInfoDiv.appendChild(img);
    }

    const infoList = document.createElement('ul');
    infoList.innerHTML = `
        <li><strong>Make:</strong> ${make.name}</li>
        <li><strong>Model:</strong> ${model.name}</li>
        <li><strong>Year:</strong> ${year.year}</li>
        <li><strong>Body Type:</strong> ${categories && categories.vehicleStyle ? categories.vehicleStyle : 'N/A'}</li>
        <li><strong>Engine:</strong> ${styles && styles[0] && styles[0].engine ? styles[0].engine.size + 'L ' + styles[0].engine.type : 'N/A'}</li>
        <li><strong>Transmission:</strong> ${styles && styles[0] && styles[0].transmission ? styles[0].transmission.name : 'N/A'}</li>
    `;
    carInfoDiv.appendChild(infoList);
}


searchAgainBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    carInfoDiv.innerHTML = '';
    carForm.reset();
    modelSelect.disabled = true;
    yearSelect.disabled = true;
});

compareBtn.addEventListener('click', () => {
    const liItems = carInfoDiv.querySelectorAll('ul li');
    const carData = {};
    liItems.forEach(li => {
        const key = li.innerHTML.split('</strong>')[0].replace('<strong>','').replace(':','').trim();
        const value = li.innerHTML.split('</strong>')[1].trim();
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

initMakes();
