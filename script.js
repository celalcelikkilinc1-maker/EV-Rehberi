/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   Proje: EV-Asistan | Hata Giderme Modülü
*/

const questions = [
    { id: "budget", text: "Maksimum bütçeniz ne kadar?", options: [
        { text: "1.500.000 TL Altı", value: 1500000 },
        { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
        { text: "Sınır Yok", value: 999999999 }
    ]},
    { id: "segment", text: "Hangi araç tipi size daha uygun?", options: [
        { text: "Hatchback (Şehir içi)", value: "Hatchback" },
        { text: "SUV (Aile/Geniş)", value: "SUV" },
        { text: "Sedan (Konfor)", value: "Sedan" }
    ]},
    { id: "range", text: "Beklediğiniz minimum menzil nedir?", options: [
        { text: "300 km+", value: 300 },
        { text: "500 km+", value: 500 }
    ]},
    { id: "heatpump", text: "Isı Pompası (Heat Pump) sizin için şart mı?", options: [
        { text: "Evet, mutlaka olmalı", value: "Yes" },
        { text: "Fark etmez", value: "All" }
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

// CSV satırlarını güvenli bir şekilde bölen fonksiyon (Hücre içindeki virgülleri korur)
function parseCSVRow(row) {
    const regex = /(?:"([^"]*)"|([^,;]+))/g;
    let matches = [];
    let match;
    while ((match = regex.exec(row)) !== null) {
        matches.push(match[1] || match[2]);
    }
    return matches;
}

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Veritabanı taranıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== "");
        const headers = parseCSVRow(lines[0]).map(h => h.trim().toLowerCase());

        // Sütunları isimden bul
        const modelIdx = headers.findIndex(h => h.includes("model"));
        const priceIdx = headers.findIndex(h => h.includes("fiyat") || h.includes("tl"));
        const rangeIdx = headers.findIndex(h => h.includes("range") || h.includes("menzil"));
        const hpIdx = headers.findIndex(h => h.includes("heat pump") || h.includes("isi pompasi"));
        const imgIdx = headers.findIndex(h => h.includes("resim") || h.includes("link") || h.includes("image"));
        const segmentIdx = headers.findIndex(h => h.includes("segment"));

        const results = lines.slice(1).map(parseCSVRow).filter(cols => {
            if (cols.length < 5) return false;

            const price = parseInt(cols[priceIdx].replace(/[^0-9]/g, '')) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = cols[hpIdx] ? cols[hpIdx].toLowerCase() : "";
            const segment = cols[segmentIdx] ? cols[segmentIdx].toLowerCase() : "";

            return price <= userChoices.budget &&
                   range >= userChoices.range &&
                   (userChoices.heatpump === "All" || hp.includes("yes")) &&
                   segment.includes(userChoices.segment.toLowerCase());
        }).slice(0, 6);

        if (results.length === 0) {
            carList.innerHTML = "<p>Kriterlere uygun araç bulunamadı.</p>";
        } else {
            carList.innerHTML = results.map(cols => `
                <div class="car-card">
                    <img src="${cols[imgIdx]}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Yüklenemedi'">
                    <h3>${cols[modelIdx]}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase().includes('yes') ? '✅ Var' : '❌ Yok'}</p>
                    <p class="price-tag">Fiyat: ${cols[priceIdx]} TL</p>
                </div>
            `).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Veri çekme hatası! Lütfen CSV dosyasını kontrol edin.</p>";
    }
}

showQuestion();
