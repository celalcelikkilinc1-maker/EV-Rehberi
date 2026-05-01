const questions = [
    {
        id: "budget",
        text: "Maksimum bütçeniz ne kadar?",
        options: [
            { text: "1.500.000 TL Altı", value: 1500000 },
            { text: "1.500.000 - 3.000.000 TL", value: 3000000 },
            { text: "Sınır Yok", value: Infinity }
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

function showResults() {
    document.getElementById("quiz-container").classList.add("hidden");
    document.getElementById("result-container").classList.remove("hidden");
    const carList = document.getElementById("car-list");
    carList.innerHTML = "<p style='color:white'>Veritabanı taranıyor... Seçimlerinize göre en iyi modeller listelenecek.</p>";
    
    // Not: CSV okuma işlemi için fetch fonksiyonu buraya eklenebilir.
}

showQuestion();
