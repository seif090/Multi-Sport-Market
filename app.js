const courts = [
  {
    id: 1,
    name: "Arena Smouha",
    area: "smouha",
    areaLabel: "سموحة",
    sport: "football",
    sportLabel: "كرة قدم",
    price: "mid",
    priceLabel: "متوسط",
    badge: "متاح اليوم",
    description: "ملعب خماسي بمواعيد مرنة، إضاءة قوية، وحجز فوري بدون تعارض.",
  },
  {
    id: 2,
    name: "Cairo Street Padel",
    area: "sidi-gaber",
    areaLabel: "سيدي جابر",
    sport: "padel",
    sportLabel: "بادل",
    price: "high",
    priceLabel: "مرتفع",
    badge: "Premium",
    description: "تجربة بادل مميزة مع نظام عربون وتأكيد تلقائي للحجز.",
  },
  {
    id: 3,
    name: "Seaside Billiards Hall",
    area: "san-stefano",
    areaLabel: "سان ستيفانو",
    sport: "billiards",
    sportLabel: "بلياردو",
    price: "mid",
    priceLabel: "متوسط",
    badge: "Indoor",
    description: "صالات هادئة للحجز بالساعة مع أوقات مخصصة للبطولات الودية.",
  },
  {
    id: 4,
    name: "Abu Qir Play Zone",
    area: "abor",
    areaLabel: "أبو قير",
    sport: "playstation",
    sportLabel: "بلايستيشن",
    price: "low",
    priceLabel: "منخفض",
    badge: "Offers",
    description: "جلسات لعب جماعية وعروض منتصف الأسبوع لجذب المستخدمين الشباب.",
  },
  {
    id: 5,
    name: "Smouha Five-A-Side",
    area: "smouha",
    areaLabel: "سموحة",
    sport: "football",
    sportLabel: "كرة قدم",
    price: "high",
    priceLabel: "مرتفع",
    badge: "Top Rated",
    description: "ملعب سريع الحجز مع إدارة قوية للتواجد والمواعيد المتكررة.",
  },
  {
    id: 6,
    name: "Jaber Court Club",
    area: "sidi-gaber",
    areaLabel: "سيدي جابر",
    sport: "football",
    sportLabel: "كرة قدم",
    price: "low",
    priceLabel: "منخفض",
    badge: "New",
    description: "اختيار مناسب للتمرير السريع وتجربة الحجز الأقل تكلفة في المنطقة.",
  },
];

const areaFilter = document.getElementById("areaFilter");
const sportFilter = document.getElementById("sportFilter");
const priceFilter = document.getElementById("priceFilter");
const resetFilters = document.getElementById("resetFilters");
const courtsGrid = document.getElementById("courtsGrid");
const template = document.getElementById("courtCardTemplate");
const modal = document.getElementById("bookingModal");
const closeModal = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalMeta = document.getElementById("modalMeta");

function renderCourts() {
  const area = areaFilter.value;
  const sport = sportFilter.value;
  const price = priceFilter.value;

  const filtered = courts.filter((court) => {
    return (
      (area === "all" || court.area === area) &&
      (sport === "all" || court.sport === sport) &&
      (price === "all" || court.price === price)
    );
  });

  courtsGrid.innerHTML = "";

  if (!filtered.length) {
    courtsGrid.innerHTML = `
      <article class="court-card">
        <h4>مفيش نتائج مطابقة دلوقتي</h4>
        <p class="court-desc">جرّب تغير الفلاتر أو امسحها عشان تشوف ملاعب أكتر.</p>
      </article>
    `;
    return;
  }

  filtered.forEach((court) => {
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".court-card");
    fragment.querySelector(".court-area").textContent = court.areaLabel;
    fragment.querySelector(".court-name").textContent = court.name;
    fragment.querySelector(".court-badge").textContent = court.badge;
    fragment.querySelector(".court-sport").textContent = court.sportLabel;
    fragment.querySelector(".court-price").textContent = `السعر: ${court.priceLabel}`;
    fragment.querySelector(".court-desc").textContent = court.description;

    const button = fragment.querySelector(".court-book-btn");
    button.addEventListener("click", () => openBookingModal(court));

    card.dataset.area = court.area;
    courtsGrid.appendChild(fragment);
  });
}

function openBookingModal(court) {
  modalTitle.textContent = `طلب حجز - ${court.name}`;
  modalMeta.textContent = `${court.areaLabel} · ${court.sportLabel} · ${court.priceLabel}`;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeBookingModal() {
  modal.hidden = true;
  document.body.style.overflow = "";
}

areaFilter.addEventListener("change", renderCourts);
sportFilter.addEventListener("change", renderCourts);
priceFilter.addEventListener("change", renderCourts);
resetFilters.addEventListener("click", () => {
  areaFilter.value = "all";
  sportFilter.value = "all";
  priceFilter.value = "all";
  renderCourts();
});

closeModal.addEventListener("click", closeBookingModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeBookingModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.hidden) {
    closeBookingModal();
  }
});

renderCourts();
