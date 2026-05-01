const questions = [
    {
        id: "budget",
        text: "Maksimum bütçeniz ne kadar?",
        options: [
            { text: "1.500.000 TL Altı", value: 1500000 },
            { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
            { text: "Sınır Yok", value: 99999999 }
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
    carList.innerHTML = "<p>Veritabanı taranıyor ve fiyatlar hesaplanıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const csvData = await response.text();
        const rows = csvData.split('\n');
        const headers = rows[0].split(',');

        // Sütun indekslerini bul
        const modelIdx = headers.indexOf('Model');
        const priceIdx = headers.indexOf('Tahmini_TR_Fiyati_TL');
        const rangeIdx = headers.indexOf('Electric Range *');
        const hpIdx = headers.indexOf('Heat pump (HP)');
        const segmentIdx = headers.indexOf('Segment');
        const imgIdx = headers.indexOf('Resim_Link');

        const filtered = rows.slice(1).map(row => row.split(',')).filter(cols => {
            if (cols.length < 5) return false;

            const price = parseFloat(cols[priceIdx]) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = cols[hpIdx] ? cols[hpIdx].trim() : "";
            const segment = cols[segmentIdx] ? cols[segmentIdx].trim() : "";

            const budgetOk = price <= userChoices.budget;
            const rangeOk = range >= userChoices.range;
            const hpOk = userChoices.heatpump === "All" || hp === "Yes";
            const segmentOk = segment.includes(userChoices.segment);

            return budgetOk && rangeOk && hpOk && segmentOk;
        }).slice(0, 5);

        if (filtered.length === 0) {
            carList.innerHTML = "<p>Üzgünüz, kriterlerinize uygun bir araç bulunamadı.</p>";
        } else {
            carList.innerHTML = filtered.map(cols => `
                <div class="car-card">
                    <img src="${cols[imgIdx]}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Bulunamadi'">
                    <h3>${cols[modelIdx]}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx] === 'Yes' ? '✅ Mevcut' : '❌ Mevcut Değil'}</p>
                    <p class="price-tag">Tahmini Fiyat: ${parseFloat(cols[priceIdx]).toLocaleString('tr-TR')} TL</p>
                </div>
            `).join('');
        }
    } catch (err) {
        carList.innerHTML = "<p>Veri yüklenirken hata oluştu. Lütfen dosya adını kontrol edin.</p>";
    }
}

showQuestion();
