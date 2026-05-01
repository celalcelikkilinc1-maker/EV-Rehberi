/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   Proje: EV-Asistan (Geliştirilmiş Versiyon)
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
    carList.innerHTML = "<p>Sonuçlar hazırlanıyor, lütfen bekleyin...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const csvData = await response.text();
        const rows = csvData.split('\n').map(row => row.split(','));
        const headers = rows[0].map(h => h.trim());

        // Esnek Sütun Bulma (Küçük/Büyük harf duyarsız)
        const findIdx = (names) => headers.findIndex(h => names.some(n => h.toLowerCase().includes(n.toLowerCase())));
        
        const modelIdx = findIdx(['Model']);
        const priceIdx = findIdx(['Fiyat', 'TL', 'Tahmini']);
        const rangeIdx = findIdx(['Range', 'Menzil']);
        const hpIdx = findIdx(['Heat pump', 'Isı Pompası']);
        const imgIdx = findIdx(['Resim', 'Image', 'Link']);
        const segmentIdx = findIdx(['Segment']);

        const filtered = rows.slice(1).filter(cols => {
            if (cols.length < 5) return false;
            
            // Fiyatı Sayıya Çevirme (Nokta, Virgül ve TL ibarelerini temizler)
            const rawPrice = cols[priceIdx] ? cols[priceIdx].replace(/[^0-9]/g, '') : "0";
            const price = parseInt(rawPrice) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = cols[hpIdx] ? cols[hpIdx].trim() : "";
            const segment = cols[segmentIdx] ? cols[segmentIdx].trim() : "";

            const budgetOk = price <= userChoices.budget;
            const rangeOk = range >= userChoices.range;
            const hpOk = userChoices.heatpump === "All" || hp.toLowerCase() === "yes";
            const segmentOk = segment.toLowerCase().includes(userChoices.segment.toLowerCase());

            return budgetOk && rangeOk && hpOk && segmentOk;
        }).slice(0, 6);

        if (filtered.length === 0) {
            carList.innerHTML = "<p>Seçimlerinize uygun araç bulunamadı. Lütfen bütçeyi artırıp tekrar deneyin.</p>";
        } else {
            carList.innerHTML = filtered.map(cols => `
                <div class="car-card">
                    <img src="${cols[imgIdx]}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Bulunmadi'">
                    <h3>${cols[modelIdx]}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase() === 'yes' ? '✅ Var' : '❌ Yok'}</p>
                    <p class="price-tag">Fiyat: ${cols[priceIdx]} </p>
                </div>
            `).join('');
        }
    } catch (err) {
        carList.innerHTML = "<p>Veri çekme hatası! CSV dosyasının adını ve konumunu kontrol edin.</p>";
    }
}

showQuestion();
