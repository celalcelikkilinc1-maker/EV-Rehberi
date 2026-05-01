/* 
   Bursa Uludağ Üniversitesi - Hibrit ve Elektrikli Taşıtlar Teknolojisi 
   Proje: EV-Asistan | Fiyat ve Resim Onarım Modülü
*/

// ... (sorular kısmı aynı kalsın) ...

async function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p>Veritabanı taranıyor...</p>";

    try {
        const response = await fetch('ev_veritabani_TR_fiyatli_2.csv');
        const text = await response.text();
        
        // Satırları ayır ve boş satırları temizle
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Sütun İndekslerini Manuel Sabitleme veya Akıllı Arama
        const modelIdx = headers.findIndex(h => h.includes("model")) || 0;
        const priceIdx = headers.findIndex(h => h.includes("fiyat") || h.includes("tl") || h.includes("price"));
        const rangeIdx = headers.findIndex(h => h.includes("range") || h.includes("menzil"));
        const hpIdx = headers.findIndex(h => h.includes("heat pump") || h.includes("isi pompasi"));
        const imgIdx = headers.findIndex(h => h.includes("resim") || h.includes("link") || h.includes("img"));
        const segmentIdx = headers.findIndex(h => h.includes("segment"));

        const results = lines.slice(1).map(line => {
            // Virgül ile ayırırken tırnak içindeki virgülleri koruyan gelişmiş bölme
            return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        }).filter(cols => {
            if (cols.length < 5) return false;

            // Fiyat temizleme: "1.500.000 TL" -> 1500000
            const rawPrice = cols[priceIdx] ? cols[priceIdx].replace(/[^0-9]/g, '') : "0";
            const price = parseInt(rawPrice) || 0;
            const range = parseInt(cols[rangeIdx]) || 0;
            const hp = (cols[hpIdx] || "").toLowerCase();
            const segment = (cols[segmentIdx] || "").toLowerCase();

            // Filtreleme Mantığı
            const budgetMatch = price > 0 && price <= userChoices.budget;
            const rangeMatch = range >= userChoices.range;
            const hpMatch = userChoices.heatpump === "All" || hp.includes("yes");
            const segmentMatch = segment.includes(userChoices.segment.toLowerCase());

            return budgetMatch && rangeMatch && hpMatch && segmentMatch;
        }).slice(0, 6);

        if (results.length === 0) {
            carList.innerHTML = "<p>Kriterlerinize uygun bir araç bulunamadı. Lütfen filtreleri (bütçe veya menzil) genişletmeyi deneyin.</p>";
        } else {
            carList.innerHTML = results.map(cols => {
                const finalPrice = cols[priceIdx] ? cols[priceIdx].trim() : "Fiyat Bilgisi Yok";
                const finalImg = (cols[imgIdx] || "").replace(/"/g, '').trim();
                
                return `
                <div class="car-card">
                    <img src="${finalImg}" alt="${cols[modelIdx]}" onerror="this.src='https://via.placeholder.com/400x250?text=Gorsel+Bulunamadi'">
                    <h3>${cols[modelIdx].replace(/"/g, '')}</h3>
                    <p><strong>Menzil:</strong> ${cols[rangeIdx]} km</p>
                    <p><strong>Isı Pompası:</strong> ${cols[hpIdx].toLowerCase().includes('yes') ? '✅ Mevcut' : '❌ Mevcut Değil'}</p>
                    <p class="price-tag">Tahmini Fiyat: ${finalPrice} ${finalPrice.includes('TL') ? '' : 'TL'}</p>
                </div>`;
            }).join('');
        }
    } catch (e) {
        carList.innerHTML = "<p>Veri yükleme hatası. Lütfen CSV dosyasının adını kontrol edin.</p>";
    }
}
