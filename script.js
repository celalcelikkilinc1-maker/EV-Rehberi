/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   Proje: EV-Asistan 
*/

const questions = [
    {
        id: "budget",
        text: "Maksimum bütçeniz ne kadar?",
        options: [
            { text: "1.500.000 TL Altı", value: 1500000 },
            { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
            { text: "Sınır Yok", value: 100000000 }
        ]
    },
    {
        id: "segment",
        text: "Hangi araç tipi size daha uygun?",
        options: [
            { text: "Şehir içi (Hatchback)", value: "Hatchback" },
            { text: "Aile / Geniş (SUV)", value: "SUV" },
            { text: "Konfor / Makam (Sedan)", value: "Sedan" }
        ]
    },
    {
        id: "range",
        text: "Beklediğiniz minimum menzil nedir?",
        options: [
            { text: "300 km+", value: 300 },
            { text: "500 km+", value: 500 }
        ]
    },
    {
        id: "heatpump",
        text: "Isı Pompası (Heat Pump) sizin için şart mı?",
        options: [
            { text: "Evet, mutlaka olmalı", value: "Yes" },
            { text: "Fark etmez", value: "All" }
        ]
    }
];

let currentQuestionIndex = 0;
let userChoices = {};

function showQuestion() {
    const q = questions[currentQuestionIndex];
    document.getElementById("question-text").innerText = q.text;
    const container = document.getElementById("options-container");
    container.innerHTML = "";

    q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.innerText = opt.text;
        btn.className = "option-btn";
        btn.onclick = () => selectOption(q.id, opt.value);
        container.appendChild(btn);
    });
}

function selectOption(id, value) {
    userChoices[id] = value;
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
}

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Uygun araçlar hesaplanıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli.csv');
        const data = await response.text();
        const rows = data.split('\n');
        const headers = rows[0].split(',');
        
        // Sütun indekslerini bulalım (CSV yapısına göre)
        const modelIdx = headers.indexOf('Model');
        const priceIdx = headers.indexOf('Tahmini_TR_Fiyati_TL');
        const rangeIdx = headers.indexOf('Electric Range *');
        const hpIdx = headers.indexOf('Heat pump (HP)');
        const segmentIdx = headers.indexOf('Segment');

        const results = rows.slice(1).map(row => row.split(',')).filter(cols => {
            if (cols.length < 10) return false;
            
            const price = parseFloat(cols[priceIdx]) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = cols[hpIdx];
            const segment = cols[segmentIdx];

            const budgetMatch = price <= userChoices.budget;
            const rangeMatch = range >= userChoices.range;
            const hpMatch = userChoices.heatpump === "All" || hp === "Yes";
            const segmentMatch = segment.includes(userChoices.segment);

            return budgetMatch && rangeMatch && hpMatch && segmentMatch;
        }).slice(0, 5);

        if (results.length === 0) {
            carList.innerHTML = "<p>Kriterlerinize uygun araç bulunamadı.</p>";
        } else {
            carList.innerHTML = results.map(cols => `
                <div class="car-card">
                    <h3>${cols[modelIdx]}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx] === 'Yes' ? 'Var' : 'Yok'}</p>
                    <p><strong>Tahmini Fiyat:</strong> ${parseFloat(cols[priceIdx]).toLocaleString('tr-TR')} TL</p>
                </div>
            `).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Veritabanı okunurken bir hata oluştu.</p>";
    }
}

showQuestion();
