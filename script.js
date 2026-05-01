/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   EV-Asistan | Esnek Filtreleme Modülü
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

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Sonuçlar hesaplanıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== "");
        
        // CSV satırlarını güvenli bölme
        const parseRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());
        
        // Sütun İndekslerini Bul (Özellikle Türkçe karakterlere duyarlı)
        const findIdx = (keywords) => headers.findIndex(h => keywords.some(k => h.includes(k)));
        
        const modelIdx = findIdx(["model"]) || 0;
        const priceIdx = findIdx(["fiyat", "tl", "tahmini", "price"]);
        const rangeIdx = findIdx(["range", "menzil", "elektrikli"]);
        const hpIdx = findIdx(["heat pump", "ısı pompası", "isi pompasi"]);
        const imgIdx = findIdx(["resim", "link", "image", "img"]);
        const segmentIdx = findIdx(["segment", "gövde", "tip"]);

        const results = lines.slice(1).map(parseRow).filter(cols => {
            if (cols.length < 5) return false;

            const rawPriceText = cols[priceIdx] ? cols[priceIdx].trim().toUpperCase() : "";
            const price = parseInt(rawPriceText.replace(/[^0-9]/g, '')) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = (cols[hpIdx] || "").toLowerCase();
            const segment = (cols[segmentIdx] || "").toLowerCase();

            // FİLTRELEME MANTIĞI (Esnetildi)
            const budgetMatch = (price === 0 || price <= userChoices.budget); // Fiyat yoksa da göster
            const rangeMatch = range >= userChoices.range;
            const hpMatch = (userChoices.heatpump === "All" || hp.includes("yes") || hp.includes("evet"));
            const segmentMatch = segment.includes(userChoices.segment.toLowerCase());

            return budgetMatch && rangeMatch && hpMatch && segmentMatch;
        }).slice(0, 10); // Daha fazla sonuç göster

        if (results.length === 0) {
            carList.innerHTML = "<p>Aradığınız kriterlerde araç bulunamadı. Lütfen daha düşük bir menzil veya daha yüksek bir bütçe seçerek tekrar deneyin.</p>";
        } else {
            carList.innerHTML = results.map(cols => {
                const img = cols[imgIdx] ? cols[imgIdx].replace(/"/g, '').trim() : "";
                const fiyat = (cols[priceIdx] && cols[priceIdx].trim() !== "N/A") ? cols[priceIdx].trim() : "Fiyat Belirlenmedi";
                
                return `
                <div class="car-card">
                    <img src="${img}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Hazirlaniyor'">
                    <h3>${cols[modelIdx].replace(/"/g, '')}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx] || 'Bilinmiyor'} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase().includes('yes') || cols[hpIdx].toLowerCase().includes('evet') ? '✅ Mevcut' : '❌ Mevcut Değil'}</p>
                    <p class="price-tag">Fiyat: ${fiyat}</p>
                </div>`;
            }).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Bağlantı hatası! Lütfen internetinizi ve dosya adını kontrol edin.</p>";
    }
}

showQuestion();
