/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   EV-Asistan | Akıllı Veri Eşleştirme Modülü
*/

const questions = [
    { id: "budget", text: "Maksimum bütçeniz ne kadar?", options: [
        { text: "1.500.000 TL Altı", value: 1500000 },
        { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
        { text: "Sınır Yok", value: 999999999 }
    ]},
    { id: "segment", text: "Hangi araç tipi size daha uygun?", options: [
        { text: "Şehir içi (Hatchback)", value: "Hatchback" },
        { text: "Aile / Geniş (SUV)", value: "SUV" },
        { text: "Konfor / Makam (Sedan)", value: "Sedan" }
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

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Sonuçlar listeleniyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== "");
        
        // CSV'yi ayırırken tırnak içindeki virgülleri korur
        const parseRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
        
        // SÜTUNLARI TESPİT ET
        const modelIdx = headers.findIndex(h => h.includes("model")) || 0;
        const priceIdx = headers.findIndex(h => h.includes("fiyat") || h.includes("tl") || h.includes("tr_fiyati"));
        const imgIdx = headers.findIndex(h => h.includes("resim") || h.includes("link") || h.includes("image"));
        const rangeIdx = headers.findIndex(h => h.includes("range") || h.includes("menzil"));
        const hpIdx = headers.findIndex(h => h.includes("heat pump") || h.includes("isi pompasi"));
        const segmentIdx = headers.findIndex(h => h.includes("segment"));

        const results = lines.slice(1).map(parseRow).filter(cols => {
            if (cols.length < 5) return false;

            const rawPrice = cols[priceIdx] ? cols[priceIdx].replace(/[^0-9]/g, '') : "0";
            const price = parseInt(rawPrice) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = (cols[hpIdx] || "").toLowerCase();
            const segment = (cols[segmentIdx] || "").toLowerCase();

            // Sadece fiyatı "N/A" olmayan ve bütçeye uyanları al
            return price > 0 && price <= userChoices.budget &&
                   range >= userChoices.range &&
                   (userChoices.heatpump === "All" || hp.includes("yes")) &&
                   segment.includes(userChoices.segment.toLowerCase());
        }).slice(0, 5);

        if (results.length === 0) {
            carList.innerHTML = "<p>Uygun araç bulunamadı. Lütfen filtreleri esnetin.</p>";
        } else {
            carList.innerHTML = results.map(cols => {
                const imgUrl = cols[imgIdx] ? cols[imgIdx].replace(/"/g, '').trim() : "";
                const priceText = cols[priceIdx] ? cols[priceIdx].trim() : "Fiyat Bilgisi Yok";
                
                return `
                <div class="car-card">
                    <img src="${imgUrl}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Hata'">
                    <h3>${cols[modelIdx].replace(/"/g, '')}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase().includes('yes') ? '✅ Var' : '❌ Yok'}</p>
                    <p class="price-tag">Fiyat: ${priceText}</p>
                </div>`;
            }).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Bağlantı hatası! Lütfen sayfayı yenileyin.</p>";
    }
}

showQuestion();
