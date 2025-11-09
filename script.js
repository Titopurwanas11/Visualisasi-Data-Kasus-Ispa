const COL_GENDER = 'JK';
const COL_AGE = 'Usia';
const COL_CATEGORY = 'Kategori ISPA';
const COL_SYMPTOMS = 'Gejala';
const CASE_COUNT_FIELD = 'CaseCount'; 
const DATA_FILE = 'ispa.json'; 
let ispaData = [];
let chartInstances = {};

document.addEventListener('DOMContentLoaded', () => {
    fetchData(DATA_FILE)
        .then(data => {
            ispaData = data;
            
            if (ispaData.length > 0) {
                ispaData = ispaData.map((d) => {
                    d[CASE_COUNT_FIELD] = 1;
                    d['NumericUsia'] = parseAgeToNumber(d[COL_AGE]);
                    return d;
                });
                
                setupFilters();
                initializeCharts();
            } else {
                document.getElementById('main-content').innerHTML = '<p style="color:red; text-align:center;">Data ISPA kosong.</p>';
            }
        })
        .catch(error => {
            console.error('Gagal memuat atau memproses data:', error);
            document.getElementById('main-content').innerHTML = `<p style="color:red; text-align:center;">Gagal memuat file JSON. ${error.message}</p>`;
        });
});

async function fetchData(filePath) {
    const response = await fetch(filePath); 
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
}

function parseAgeToNumber(ageString) {
    if (!ageString) return 0;
    const match = ageString.match(/(\d+)\s*(Th|Bl)/i);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2].toLowerCase();
        if (unit === 'th') return value; 
        if (unit === 'bl') return value / 100; 
    }
    return 0; 
}

function setupFilters() {
    const genderFilter = document.getElementById('filter-jk');
    const categoryFilter = document.getElementById('filter-kategori');
    
    const uniqueGenders = [...new Set(ispaData.map(d => d[COL_GENDER]))].filter(Boolean);
    const uniqueCategories = [...new Set(ispaData.map(d => d[COL_CATEGORY]))].filter(Boolean);

    uniqueGenders.forEach(gender => {
        const option = document.createElement('option');
        option.value = gender;
        option.textContent = (gender === 'LK' ? 'Laki-laki (LK)' : 'Perempuan (PR)');
        genderFilter.appendChild(option);
    });

    uniqueCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function initializeCharts() {
    Object.values(chartInstances).forEach(chart => chart.destroy());
    drawBarChart(ispaData);
    drawPieChart(ispaData);
    drawUsiaChart(ispaData);
}

window.updateAllCharts = function() {
    const selectedGender = document.getElementById('filter-jk').value;
    const selectedCategory = document.getElementById('filter-kategori').value;

    let filteredData = ispaData.filter(d => 
        (selectedGender === 'all' || d[COL_GENDER] === selectedGender) &&
        (selectedCategory === 'all' || d[COL_CATEGORY] === selectedCategory)
    );
    
    Object.values(chartInstances).forEach(chart => chart.destroy());
    drawBarChart(filteredData);
    drawPieChart(filteredData);
    drawUsiaChart(filteredData);
}

const CATEGORY_COLORS = {
    "ISPA Ringan": "#28a745", 
    "ISPA Sedang": "#ffc107", 
    "ISPA Berat": "#007bff",  
    "Lainnya": "#6c757d"
};


const GENDER_COLORS = {
    "LK": "rgba(54, 162, 235, 0.8)",  
    "PR": "rgba(255, 99, 132, 0.8)"   
};


function drawBarChart(dataToDraw) {
    const aggregated = dataToDraw.reduce((acc, curr) => {
        const category = curr[COL_CATEGORY] || 'Lainnya';
        acc[category] = (acc[category] || 0) + curr[CASE_COUNT_FIELD];
        return acc;
    }, {});

    const labels = Object.keys(aggregated).sort();
    const chartData = Object.values(aggregated);
    const backgroundColors = labels.map(cat => CATEGORY_COLORS[cat] || "#6c757d");
    const ctx = document.getElementById('barChart').getContext('2d');
    chartInstances.bar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Kasus',
                data: chartData,
                backgroundColor: backgroundColors,
                borderColor: "#343a40",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

function drawPieChart(dataToDraw) {
    const aggregated = dataToDraw.reduce((acc, curr) => {
        const gender = curr[COL_GENDER] || 'Lainnya';
        acc[gender] = (acc[gender] || 0) + curr[CASE_COUNT_FIELD];
        return acc;
    }, {});

    const labels = Object.keys(aggregated);
    const chartData = Object.values(aggregated);

    const backgroundColors = labels.map(g => GENDER_COLORS[g] || "#6c757d");

    const ctx = document.getElementById('pieChart').getContext('2d');
    chartInstances.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels.map(l => l === "LK" ? "Laki-laki (LK)" : "Perempuan (PR)"),
            datasets: [{
                data: chartData,
                backgroundColor: backgroundColors
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function drawUsiaChart(dataToDraw) {
    const aggregated = dataToDraw.reduce((acc, curr) => {
        const ageGroup = curr[COL_AGE] || 'Tidak Terdefinisi'; 
        acc[ageGroup] = (acc[ageGroup] || 0) + curr[CASE_COUNT_FIELD];
        return acc;
    }, {});

    const sortedLabels = Object.keys(aggregated).sort((a, b) => {
        const ageA = parseAgeToNumber(a);
        const ageB = parseAgeToNumber(b);
        return ageA - ageB;
    });

    const chartData = sortedLabels.map(label => aggregated[label]);

    const ctx = document.getElementById('usiaChart').getContext('2d');
    chartInstances.usia = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedLabels,
            datasets: [{
                label: 'Frekuensi Pasien',
                data: chartData,
                backgroundColor: 'rgba(255, 159, 64, 0.7)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { 
                x: { title: { display: true, text: 'Kelompok Usia (Th = Tahun, Bl = Bulan)' } },
                y: { beginAtZero: true, title: { display: true, text: 'Frekuensi Pasien' } } 
            },
            plugins: {
                title: { display: true, text: 'Distribusi Frekuensi Usia Pasien ISPA' },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}