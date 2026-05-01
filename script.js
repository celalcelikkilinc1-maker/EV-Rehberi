/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   EV-Asistan | Geliştirilmiş Dinamik Veri Modülü
*/

const questions = [
    { id: "budget", text: "Maksimum bütçeniz ne kadar?", options: [
        { text: "1.500.000 TL Altı", value: 1500000 },
        { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
        { text: "Sınır Yok", value: 999999999 }
    ]},
    { id: "segment", text: "Hangi araç tipi size daha uygun?", options: [
        { text: "Şehir içi (Hatchback)", value: "hatch" }, // Kısmi arama için
        { text: "Aile / Geniş (SUV)", value: "suv" },
        { text: "Konfor / Makam (Sedan)", value: "sedan" }
    ]},
    { id: "range", text: "Beklediğiniz minimum menzil nedir?", options: [
        { text: "300 km+", value: 300 },
        { text: "500 km+", value: 500 }
    ]},
    { id: "heatpump", text: "Isı Pompası (Heat Pump) sizin için şart mı?", options: [
        { text: "Evet, mutlaka olmalı", value: "yes" },
        { text: "Fark etmez", value: "all" }
    ]}
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
    if (currentQuestionIndex < questions.length) { showQuestion(); } 
    else { showResults(); }
}

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Veriler taranıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_3.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== "");
        
        const parseRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
        
        // Sütun İndekslerini Bul
        const findIdx = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
        
        const modelIdx = findIdx(["model"]) || 0;
        const priceIdx = findIdx(["fiyat", "tl", "price"]);
        const rangeIdx = findIdx(["range", "menzil"]);
        const hpIdx = findIdx(["heat pump", "ısı", "isi"]);
        const imgIdx = findIdx(["resim", "link", "image", "img"]);
        const segmentIdx = findIdx(["segment", "gövde"]);

        const filtered = lines.slice(1).map(parseRow).filter(cols => {
            if (cols.length < 5) return false;

            // Fiyatı Sayıya Çevir (N/A olsa bile hata vermez)
            const rawPrice = cols[priceIdx] ? cols[priceIdx].replace(/[^0-9]/g, '') : "";
            const price = parseInt(rawPrice) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = (cols[hpIdx] || "").toLowerCase();
            const segment = (cols[segmentIdx] || "").toLowerCase();

            // ESNEK FİLTRELEME
            const budgetOk = (price === 0 || price <= userChoices.budget);
            const rangeOk = range >= userChoices.range;
            const hpOk = (userChoices.heatpump === "all" || hp.includes("yes") || hp.includes("evet"));
            const segmentOk = segment.includes(userChoices.segment);

            return budgetOk && rangeOk && hpOk && segmentOk;
        }).slice(0, 8);

        if (filtered.length === 0) {
            carList.innerHTML = "<p>Kriterlere uygun sonuç bulunamadı. Lütfen filtreleri esneterek tekrar deneyin.</p>";
        } else {
            carList.innerHTML = filtered.map(cols => `
                <div class="car-card">
                    <img src="${cols[imgIdx] ? cols[imgIdx].replace(/"/g, '').trim() : ''}" 
                         alt="${cols[modelIdx]}" 
                         onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Hazirlaniyor'">
                    <h3>${cols[modelIdx].replace(/"/g, '')}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase().includes('yes') ? '✅ Var' : '❌ Yok'}</p>
                    <p class="price-tag">Fiyat: ${cols[priceIdx] || 'N/A'}</p>
                </div>
            `).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Bağlantı hatası! Lütfen CSV dosyasının adını kontrol edin.</p>";
    }
}

showQuestion();
