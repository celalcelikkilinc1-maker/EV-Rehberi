/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   EV-Asistan | Akıllı Eşleştirme ve Veri Kurtarma Sistemi
*/

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Veriler işleniyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_3.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(l => l.trim() !== "");
        const parseRow = (row) => row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const headers = parseRow(lines[0]).map(h => h.trim().toLowerCase());

        // Sütun İndekslerini Belirle
        const findIdx = (keys) => headers.findIndex(h => keys.some(k => h.includes(k)));
        const modelIdx = findIdx(["model"]) || 0;
        const priceIdx = findIdx(["fiyat", "tl", "tahmini", "price"]);
        const rangeIdx = findIdx(["range", "menzil", "elektrikli"]);
        const hpIdx = findIdx(["heat pump", "ısı", "isi"]);
        const imgIdx = findIdx(["resim", "link", "image", "img"]);
        const segmentIdx = findIdx(["segment", "gövde", "tip"]);

        const results = lines.slice(1).map(parseRow).filter(cols => {
            if (cols.length < 5) return false;

            // Verileri Temizle
            const price = parseInt(cols[priceIdx]?.replace(/[^0-9]/g, '')) || 0;
            const range = parseInt(cols[rangeIdx]?.replace(/[^0-9]/g, '')) || 0;
            const hp = (cols[hpIdx] || "").toLowerCase();
            const segment = (cols[segmentIdx] || "").toLowerCase();

            // ESNEK FİLTRELEME: Segment içinde anahtar kelime var mı?
            const budgetMatch = (price === 0 || price <= userChoices.budget); 
            const rangeMatch = (range === 0 || range >= userChoices.range);
            const hpMatch = (userChoices.heatpump === "all" || hp.includes("yes") || hp.includes("evet") || hp.includes("var"));
            
            // Önemli: Segment filtresini "içerir" mantığına çekiyoruz
            const segmentMatch = segment.includes(userChoices.segment.toLowerCase()) || 
                                 userChoices.segment.toLowerCase().includes(segment);

            return budgetMatch && rangeMatch && hpMatch && segmentMatch;
        }).slice(0, 8);

        if (results.length === 0) {
            carList.innerHTML = `<p>⚠️ Eşleşme sağlanamadı. Lütfen seçimlerinizi esnetin.</p>`;
        } else {
            carList.innerHTML = results.map(cols => `
                <div class="car-card">
                    <img src="${cols[imgIdx]?.replace(/"/g, '').trim()}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Bulunmadi'">
                    <h3>${cols[modelIdx]?.replace(/"/g, '')}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx] || 'Bilinmiyor'}</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx]?.toLowerCase().includes('yes') ? '✅ Var' : '❌ Yok'}</p>
                    <p class="price-tag">Fiyat: ${cols[priceIdx] || 'Belirtilmedi'}</p>
                </div>`).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Bağlantı hatası!</p>";
    }
}
