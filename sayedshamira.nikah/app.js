/* ========================================================================= */
/* Sayed & Shamira · Akad Nikah Standalone Guest RSVP Portal JavaScript     */
/* Inspired by sheikha.aizat.dev · Dual-Layer RSVP & Live Countdown Engine   */
/* ========================================================================= */

const $ = id => document.getElementById(id);

/* ========================================================================= */
/* 1. BILINGUAL TRANSLATION ENGINE (BM ↔ EN)                                 */
/* ========================================================================= */
const LANG_STORAGE_KEY = "sayedshamira_lang";

const I18N = {
  ms: {
    langBtn: "EN",
    navEvent: "Aturcara",
    navRsvp: "RSVP",
    navGift: "Hadiah",
    heroEyebrow: "WALIMATULURUS",
    heroDate: "Sabtu, 27 Mac 2027",
    heroVenue: "Masjid Raja Haji Fi Sabilillah, Cyberjaya",
    cdDays: "HARI",
    cdHours: "JAM",
    cdMinutes: "MINIT",
    cdSeconds: "SAAT",
    heroRsvpCta: "💌 Sahkan Kehadiran (RSVP)",
    heroDetailsCta: "📍 Aturcara & Lokasi",
    quranTranslation: '"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan untukmu pasangan-pasangan daripada jenismu sendiri, supaya kamu cenderung dan berasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih sayang dan belas kasihan."',
    greetingLead: "Assalamu’alaikum Warahmatullahi Wabarakatuh & Salam Sejahtera",
    invitationBody: "Dengan penuh rasa kesyukuran ke hadrat Ilahi, kami sekeluarga dengan berbesar hati menjemput Dato' / Datin / Tuan / Puan / Encik / Cik serta seisi keluarga ke majlis Akad Nikah dan Jamuan Kesyukuran putera dan puteri kami:",
    prayerSub: "Semoga dengan kehadiran dan doa restu para tetamu sekalian akan menyerikan lagi majlis serta memberkati ikatan suci yang terbina hingga ke Jannah, Insya-Allah.",
    eventKicker: "MAKLUMAT MAJLIS",
    eventTitle: "Aturcara & Lokasi Majlis",
    eventSubtitle: "Majlis Akad Nikah & Jamuan Kesyukuran Keluarga",
    cardDateTimeTitle: "Tarikh & Masa",
    cardDateVal: "Sabtu, 27 Mac 2027",
    cardHijriVal: "18 Ramadan 1448H",
    itinArrival: "Ketibaan Tetamu Jemputan",
    itinAkad: "Upacara Akad Nikah & Lafaz Ijab Qabul",
    itinPhoto: "Sesi Bergambar & Doa Selamat",
    itinFeast: "Jamuan Kesyukuran & Ramah Mesra",
    itinEnd: "Majlis Bersurai",
    cardVenueTitle: "Lokasi Masjid",
    cardVenueNotes: "Ruang Solat Utama & Dewan Jamuan Masjid (Aras Bawah)",
    cardDressTitle: "Tema & Kod Pakaian",
    cardDressHighlight: "Baju Melayu / Pakaian Sopan",
    cardDressSub: "Tona Warna Biru (Shades of Blue / Soft Pastel)",
    etiq1: "Pakaian menutup aurat dan sopan bersesuaian dengan adab di dalam masjid.",
    etiq2: "Ruang meletak kenderaan berpagar yang luas disediakan di perkarangan masjid.",
    etiq3: "Kapasiti majlis adalah terhad ≤ 200 tetamu untuk keselesaan bersama.",
    rsvpKicker: "PENGESAHAN KEHADIRAN",
    rsvpTitle: "Sahkan Kehadiran Anda (RSVP)",
    rsvpSubtitle: "Mohon maklumkan kehadiran anda selewat-lewatnya sebelum 27 Februari 2027 bagi membantu kami menguruskan kapasiti dewan (≤ 200 pax).",
    capBannerTitle: "Kapasiti Terhad Dewan Masjid Raja Haji",
    capBannerDesc: "Maksimum 200 Orang Tetamu Jemputan Sahaja",
    formNameLabel: "Nama Penuh Tetamu",
    formPhoneLabel: "Nombor WhatsApp / Telefon",
    formPhoneHint: "Untuk kami hantarkan peringatan dan pengesahan majlis.",
    formAttendingLabel: "Adakah anda akan hadir?",
    attendingYesTitle: "Ya, Saya Akan Hadir!",
    attendingYesSub: "Insya-Allah dapat hadir ke majlis",
    attendingNoTitle: "Maaf, Tidak Dapat Hadir",
    attendingNoSub: "Mendoakan dari kejauhan",
    formAdultsLabel: "Dewasa (12 tahun ke atas)",
    formKidsLabel: "Kanak-kanak (Bawah 12 tahun)",
    totalPaxLabel: "Jumlah Tetamu Keseluruhan:",
    formMessageLabel: "Titipan Ucapan & Doa Khas",
    btnSubmitRsvp: "Hantar Pengesahan Kehadiran 💌",
    successTitle: "Terima Kasih Atas Pengesahan Anda!",
    sumGuestName: "Nama Tetamu:",
    sumStatus: "Status Kehadiran:",
    sumPax: "Jumlah Kehadiran:",
    btnEditRsvp: "Kemaskini Maklumat RSVP ↺",
    registryKicker: "TANDA INGATAN & DOA RESTU",
    registryTitle: "Duit Salam Kaut & Senarai Hadiah",
    registrySubtitle: "Kehadiran dan doa anda adalah hadiah terindah buat kami. Namun sekiranya ingin memberi tanda ingatan, kami sertakan ruang di bawah.",
    salamTitle: "Duit Salam Kaut Digital",
    salamDesc: "Kemudahan tanpa tunai bagi tetamu yang ingin menghulurkan ingatan atau tidak berkesempatan hadir secara fizikal.",
    registryWishlistTitle: "🎁 Pilihan Hadiah Perkahwinan (Gift Wishlist)",
    registryWishlistSub: "Tiada had atau penguncian—setiap item boleh dihadiahkan oleh sesiapa sahaja mengikut keikhlasan hati.",
    customGiftTitle: "Cadang Hadiah / Hajat Sendiri",
    customGiftSub: "Mempunyai idea hadiah lain untuk dihadiahkan kepada pasangan pengantin?",
    customGiftBtn: "Hantar Cadangan Hadiah 🎁",
    wishesKicker: "TITIPAN DOA",
    wishesTitle: "Ucapan & Doa Tetamu",
    wishesSubtitle: "Titipan kata-kata manis dan doa restu daripada sanak saudara serta sahabat handai."
  },
  en: {
    langBtn: "BM",
    navEvent: "Schedule",
    navRsvp: "RSVP",
    navGift: "Registry",
    heroEyebrow: "THE WEDDING OF",
    heroDate: "Saturday, 27 March 2027",
    heroVenue: "Masjid Raja Haji Fi Sabilillah, Cyberjaya",
    cdDays: "DAYS",
    cdHours: "HOURS",
    cdMinutes: "MINS",
    cdSeconds: "SECS",
    heroRsvpCta: "💌 Confirm Attendance (RSVP)",
    heroDetailsCta: "📍 Event Schedule & Venue",
    quranTranslation: '"And among His signs is that He created for you spouses from among yourselves that you may find tranquility in them; and He placed between you affection and mercy."',
    greetingLead: "Peace and Warmest Greetings",
    invitationBody: "With profound gratitude to God, our families cordially invite you and your family to celebrate the Solemnization (Akad Nikah) and Thanksgiving Reception of our children:",
    prayerSub: "May your presence and prayers grace this occasion and bless this sacred union for all years to come.",
    eventKicker: "EVENT DETAILS",
    eventTitle: "Programme & Location",
    eventSubtitle: "Akad Nikah Ceremony & Family Thanksgiving Reception",
    cardDateTimeTitle: "Date & Time",
    cardDateVal: "Saturday, 27 March 2027",
    cardHijriVal: "18 Ramadan 1448H",
    itinArrival: "Guest & Family Arrival",
    itinAkad: "Solemnization Ceremony (Akad Nikah)",
    itinPhoto: "Photography & Thanksgiving Prayers",
    itinFeast: "Celebratory Feast & Reception",
    itinEnd: "Reception Concludes",
    cardVenueTitle: "Mosque Venue",
    cardVenueNotes: "Main Prayer Hall & Ground Floor Banquet Hall",
    cardDressTitle: "Attire & Dress Code",
    cardDressHighlight: "Modest Malay Attire / Smart Modest",
    cardDressSub: "Shades of Blue / Soft Pastel Tones",
    etiq1: "Modest, respectfully covered attire in line with mosque etiquette.",
    etiq2: "Ample designated secure parking available within mosque grounds.",
    etiq3: "Hall capacity strictly limited to ≤ 200 guests for comfort.",
    rsvpKicker: "ATTENDANCE CONFIRMATION",
    rsvpTitle: "RSVP Confirmation",
    rsvpSubtitle: "Please RSVP before 27 February 2027 to assist us in managing the limited venue capacity (≤ 200 pax).",
    capBannerTitle: "Limited Hall Capacity (Masjid Raja Haji)",
    capBannerDesc: "Strict Maximum of 200 Invited Guests",
    formNameLabel: "Guest Full Name",
    formPhoneLabel: "WhatsApp / Phone Number",
    formPhoneHint: "For event updates and confirmation notices.",
    formAttendingLabel: "Will you be attending?",
    attendingYesTitle: "Yes, I/We Will Attend!",
    attendingYesSub: "Looking forward to celebrating together",
    attendingNoTitle: "Unable to Attend",
    attendingNoSub: "Sending warm blessings from afar",
    formAdultsLabel: "Adults (12 years & older)",
    formKidsLabel: "Children (below 12 years)",
    totalPaxLabel: "Total Attending Headcount:",
    formMessageLabel: "Special Wishes & Prayers",
    btnSubmitRsvp: "Submit Attendance RSVP 💌",
    successTitle: "Thank You for Your Confirmation!",
    sumGuestName: "Guest Name:",
    sumStatus: "Attendance Status:",
    sumPax: "Total Pax:",
    btnEditRsvp: "Update RSVP Information ↺",
    registryKicker: "TOKENS OF LOVE & BLESSINGS",
    registryTitle: "Digital Salam Kaut & Gift Registry",
    registrySubtitle: "Your presence and prayers are the greatest gift. Should you wish to bless us with a token, details are provided below.",
    salamTitle: "Digital Duit Salam Kaut",
    salamDesc: "Cashless convenience for guests wishing to send a wedding blessing or unable to attend in person.",
    registryWishlistTitle: "🎁 Curated Wedding Gift Wishlist",
    registryWishlistSub: "No locks or restrictions—multiple guests can contribute toward any wishlist item.",
    customGiftTitle: "Suggest Your Own Gift Idea",
    customGiftSub: "Have a custom gift or wish in mind for the newly wed couple?",
    customGiftBtn: "Send Gift Suggestion 🎁",
    wishesKicker: "GUESTBOOK",
    wishesTitle: "Guest Wishes & Prayers",
    wishesSubtitle: "Heartfelt notes, congratulatory messages, and prayers from family and friends."
  }
};

function getActiveLanguage() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || "ms";
  } catch (e) {
    return "ms";
  }
}

function setLanguage(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {}

  document.documentElement.setAttribute("lang", lang);
  const dict = I18N[lang] || I18N.ms;

  const btnText = $("lang-btn-text");
  if (btnText) btnText.textContent = dict.langBtn;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  // Re-render conditional dynamic texts
  updatePaxCounter();
}

/* ========================================================================= */
/* 2. LIVE COUNTDOWN ENGINE (27 MARCH 2027 09:00:00 GMT+8)                  */
/* ========================================================================= */
const NIKAH_TARGET_TIME = new Date("2027-03-27T09:00:00+08:00").getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const diff = NIKAH_TARGET_TIME - now;

  const elDays = $("cd-days");
  const elHours = $("cd-hours");
  const elMins = $("cd-minutes");
  const elSecs = $("cd-seconds");

  if (diff <= 0) {
    if (elDays) elDays.textContent = "0";
    if (elHours) elHours.textContent = "0";
    if (elMins) elMins.textContent = "0";
    if (elSecs) elSecs.textContent = "0";
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (elDays) elDays.textContent = days;
  if (elHours) elHours.textContent = hours;
  if (elMins) elMins.textContent = minutes;
  if (elSecs) elSecs.textContent = seconds;
}

/* ========================================================================= */
/* 3. RSVP FORM & HEADCOUNT CONTROLLER                                       */
/* ========================================================================= */
let currentAttending = "Hadir";

function updatePaxCounter() {
  const adultsSelect = $("rsvp-adults");
  const kidsSelect = $("rsvp-kids");
  const totalBadge = $("total-pax-count");
  if (!adultsSelect || !kidsSelect || !totalBadge) return;

  if (currentAttending === "Tidak Hadir") {
    totalBadge.textContent = "0 Pax";
    return;
  }

  const adults = parseInt(adultsSelect.value, 10) || 1;
  const kids = parseInt(kidsSelect.value, 10) || 0;
  const total = adults + kids;
  totalBadge.textContent = `${total} Pax (${adults} Dewasa${kids > 0 ? `, ${kids} Kanak2` : ''})`;
}

function bindRsvpForm() {
  const form = $("nikah-rsvp-form");
  const optYes = $("opt-attending-yes");
  const optNo = $("opt-attending-no");
  const headcountSec = $("headcount-section");
  const adultsSelect = $("rsvp-adults");
  const kidsSelect = $("rsvp-kids");

  // Radio button card toggling
  if (optYes && optNo) {
    optYes.addEventListener("click", () => {
      currentAttending = "Hadir";
      optYes.classList.add("is-selected");
      optNo.classList.remove("is-selected");
      if (headcountSec) headcountSec.style.display = "block";
      updatePaxCounter();
    });

    optNo.addEventListener("click", () => {
      currentAttending = "Tidak Hadir";
      optNo.classList.add("is-selected");
      optYes.classList.remove("is-selected");
      if (headcountSec) headcountSec.style.display = "none";
      updatePaxCounter();
    });
  }

  if (adultsSelect) adultsSelect.addEventListener("change", updatePaxCounter);
  if (kidsSelect) kidsSelect.addEventListener("change", updatePaxCounter);

  // Check LocalStorage for existing submission
  const savedRsvp = localStorage.getItem("sayedshamira_nikah_rsvp");
  if (savedRsvp) {
    try {
      const data = JSON.parse(savedRsvp);
      showSuccessCard(data);
    } catch (e) {}
  }

  // Handle Form Submission
  if (form) {
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const submitBtn = $("btn-submit-rsvp");
      const btnText = $("submit-btn-text");
      const spinner = $("submit-spinner");

      const name = $("rsvp-name").value.trim();
      const phone = $("rsvp-phone").value.trim();
      const message = $("rsvp-message").value.trim();

      const isAttending = currentAttending === "Hadir";
      const adults = isAttending ? (parseInt(adultsSelect.value, 10) || 1) : 0;
      const kids = isAttending ? (parseInt(kidsSelect.value, 10) || 0) : 0;
      const totalPax = isAttending ? (adults + kids) : 0;

      const payload = {
        event: "Nikah",
        name,
        phone,
        attending: isAttending ? "Hadir" : "Tidak Hadir",
        adults,
        kids,
        total_pax: totalPax,
        message,
        timestamp: new Date().toISOString()
      };

      // UI Loading state
      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.opacity = "0.6";
      if (spinner) spinner.style.display = "inline-block";

      try {
        // Dual-Layer Submission:
        // 1. Submit to local/tunnel SQLite server
        await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {
          // Graceful offline fallback
        });

        // 2. Cache in localStorage
        localStorage.setItem("sayedshamira_nikah_rsvp", JSON.stringify(payload));

        // Show Success View
        showSuccessCard(payload);

        // Refresh wishes wall if message provided
        if (message && isAttending) {
          appendWishLocally(name, message);
        }
      } catch (err) {
        // Fallback: save locally anyway
        localStorage.setItem("sayedshamira_nikah_rsvp", JSON.stringify(payload));
        showSuccessCard(payload);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.opacity = "1";
        if (spinner) spinner.style.display = "none";
      }
    });
  }

  // Edit RSVP Button Handler
  $("btn-edit-rsvp")?.addEventListener("click", () => {
    $("nikah-rsvp-form").style.display = "flex";
    $("rsvp-success-card").style.display = "none";
  });
}

function showSuccessCard(data) {
  const form = $("nikah-rsvp-form");
  const successCard = $("rsvp-success-card");
  if (!form || !successCard) return;

  form.style.display = "none";
  successCard.style.display = "block";

  $("sum-name").textContent = data.name || "Tetamu";
  const statusEl = $("sum-status");
  const isHadir = data.attending === "Hadir";

  if (statusEl) {
    statusEl.textContent = isHadir ? "Hadir (Attending)" : "Tidak Hadir (Regrets)";
    statusEl.style.color = isHadir ? "#15803D" : "#B91C1C";
  }

  const paxRow = $("sum-pax-row");
  const sumPax = $("sum-pax");
  if (isHadir) {
    if (paxRow) paxRow.style.display = "flex";
    if (sumPax) sumPax.textContent = `${data.total_pax || 1} Pax (${data.adults || 1} Dewasa, ${data.kids || 0} Kanak2)`;
  } else {
    if (paxRow) paxRow.style.display = "none";
  }

  // Generate Google Calendar Link
  const gcalBtn = $("btn-add-gcal");
  if (gcalBtn) {
    const title = encodeURIComponent("Akad Nikah Sayed Arif & Nor Shamira (#SAHdenganIra)");
    const details = encodeURIComponent("Majlis Akad Nikah & Jamuan Kesyukuran Sayed Arif Hakimi & Nor Shamira Irwani.\nLokasi: Masjid Raja Haji Fi Sabilillah Cyberjaya.");
    const location = encodeURIComponent("Masjid Raja Haji Fi Sabilillah, Cyberjaya, Selangor");
    const dates = "20270327T010000Z/20270327T050000Z"; // 9:00 AM - 1:00 PM GMT+8 (0100 - 0500 UTC)
    gcalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }

  // Generate iCal (.ics) Download
  const icsBtn = $("btn-download-ics");
  if (icsBtn) {
    icsBtn.onclick = () => {
      const icsData = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Sayed & Shamira//Wedding RSVP//EN",
        "BEGIN:VEVENT",
        "UID:nikah-sayed-shamira-20270327@sahdenganira.my",
        "DTSTAMP:20261110T000000Z",
        "DTSTART:20270327T010000Z",
        "DTEND:20270327T050000Z",
        "SUMMARY:Akad Nikah Sayed Arif & Nor Shamira (#SAHdenganIra)",
        "DESCRIPTION:Majlis Akad Nikah & Jamuan Kesyukuran Sayed Arif Hakimi & Nor Shamira Irwani.",
        "LOCATION:Masjid Raja Haji Fi Sabilillah, Cyberjaya",
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Akad_Nikah_Sayed_Shamira.ics";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
}

/* ========================================================================= */
/* 4. DUIT SALAM KAUT & GIFT REGISTRY                                        */
/* ========================================================================= */
function bindSalamKaut() {
  const copyBtn = $("btn-copy-acc");
  const copyBtnText = $("copy-btn-text");
  const accNum = $("bank-acc-num")?.textContent.trim() || "162834241920";

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(accNum).then(() => {
        if (copyBtnText) copyBtnText.textContent = "Disalin! ✓";
        copyBtn.style.background = "#15803D";
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "Salin 📋";
          copyBtn.style.background = "var(--gold-accent)";
        }, 2500);
      }).catch(() => {
        alert("Nombor Akaun: " + accNum);
      });
    });
  }

  // Custom Gift Suggestion Button
  const customGiftBtn = $("btn-custom-gift");
  const customGiftInput = $("custom-gift-input");
  if (customGiftBtn && customGiftInput) {
    customGiftBtn.addEventListener("click", () => {
      const val = customGiftInput.value.trim();
      if (!val) {
        alert("Sila masukkan cadangan hadiah anda terlebih dahulu.");
        return;
      }
      const text = encodeURIComponent(`Salam Sayed & Shamira, saya berhasrat untuk menghadiahkan: ${val} sempena perkahwinan kalian.`);
      window.open(`https://wa.me/601132641499?text=${text}`, "_blank");
      customGiftInput.value = "";
    });
  }
}

const DEFAULT_GIFTS = [
  { id: "gift-1", name: "Air Fryer / Smart Oven", category: "Kitchenware", count: 0 },
  { id: "gift-2", name: "Espresso Barista Coffee Machine", category: "Kitchenware", count: 0 },
  { id: "gift-3", name: "Robot Vacuum Cleaner / Cordless Vacuum", category: "Home Essentials", count: 0 },
  { id: "gift-4", name: "Luxury Cotton Bedding & King Comforter Set", category: "Bedroom", count: 0 },
  { id: "gift-5", name: "Porcelain Dining Plate & Cutlery Set (16-pcs)", category: "Dining", count: 0 },
  { id: "gift-6", name: "Premium Sejadah & Telekung Set for Couple", category: "Spiritual", count: 0 }
];

async function loadGiftRegistry() {
  const mount = $("gift-items-mount");
  if (!mount) return;

  let items = DEFAULT_GIFTS;
  try {
    const res = await fetch("/api/registry");
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length) {
        items = data.items;
      }
    }
  } catch (e) {}

  mount.innerHTML = items.map(item => `
    <div class="gift-item-card">
      <div>
        <div class="gift-cat-pill">${item.category}</div>
        <h4 class="gift-name">${item.name}</h4>
      </div>
      <div class="gift-footer">
        <span class="gift-counter" id="gift-count-${item.id}">${item.count > 0 ? `${item.count} dihadiahkan` : 'Boleh dipilih'}</span>
        <button type="button" class="btn-select-gift" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}">
          Hadiahkan Ini 🎁
        </button>
      </div>
    </div>
  `).join("");

  mount.querySelectorAll(".btn-select-gift").forEach(btn => {
    btn.addEventListener("click", () => {
      const gid = btn.dataset.id;
      const gname = decodeURIComponent(btn.dataset.name);
      const text = encodeURIComponent(`Salam Sayed & Shamira, saya berhasrat untuk menghadiahkan: "${gname}" untuk majlis Akad Nikah kalian.`);
      window.open(`https://wa.me/601132641499?text=${text}`, "_blank");

      // Post count update if endpoint available
      fetch("/api/registry/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gift_id: gid, giver_name: "Tetamu" })
      }).catch(() => {});
    });
  });
}

/* ========================================================================= */
/* 5. GUESTBOOK / WISHES WALL                                                */
/* ========================================================================= */
const DEFAULT_WISHES = [
  { name: "Pak Ngah & Mak Ngah", message: "Tahniah Soya & Shamira! Semoga ikatan perkahwinan ini diberkati Allah SWT dan kekal bahagia hingga ke syurga." },
  { name: "Afiq & Isteri", message: "Selamat melangkah ke alam perkahwinan! Semoga dimurahkan rezeki dan dipermudahkan urusan kedua-dua mempelai." },
  { name: "Ibu & Ayah", message: "Doa restu kami sentiasa mengiringi perjalanan hidup baharu kamu berdua. Jadilah pasangan yang saling melengkapi." }
];

async function loadWishesWall() {
  const mount = $("wishes-wall-mount");
  if (!mount) return;

  let wishes = DEFAULT_WISHES;
  try {
    const res = await fetch("/api/rsvps");
    if (res.ok) {
      const data = await res.json();
      if (data.public && data.public.wishes && data.public.wishes.length) {
        wishes = data.public.wishes;
      }
    }
  } catch (e) {}

  mount.innerHTML = wishes.map(w => `
    <div class="wish-card">
      <p class="wish-message">"${w.message || w.ucapan}"</p>
      <div class="wish-author">👤 ${w.name || w.guest_name}</div>
    </div>
  `).join("");
}

function appendWishLocally(name, message) {
  const mount = $("wishes-wall-mount");
  if (!mount) return;
  const card = document.createElement("div");
  card.className = "wish-card";
  card.innerHTML = `
    <p class="wish-message">"${message}"</p>
    <div class="wish-author">👤 ${name}</div>
  `;
  mount.prepend(card);
}

/* ========================================================================= */
/* 6. FLOATING AUDIO & WHATSAPP DRAWER                                       */
/* ========================================================================= */
function bindFloatingControls() {
  // Audio Player
  const audioBtn = $("btn-floating-music");
  const audioEl = $("ambient-audio");
  const musicIcon = $("music-icon");

  if (audioBtn && audioEl) {
    audioBtn.addEventListener("click", () => {
      if (audioEl.paused) {
        audioEl.play().then(() => {
          audioBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        }).catch(() => {
          audioBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        });
      } else {
        audioEl.pause();
        audioBtn.classList.remove("is-playing");
        if (musicIcon) musicIcon.textContent = "🎵";
      }
    });
  }

  // WhatsApp PIC Drawer
  const waBtn = $("btn-floating-wa");
  const waDrawer = $("wa-drawer");
  const waClose = $("btn-close-wa");

  if (waBtn && waDrawer) {
    waBtn.addEventListener("click", () => {
      waDrawer.style.display = waDrawer.style.display === "none" ? "flex" : "none";
    });
    if (waClose) {
      waClose.addEventListener("click", () => {
        waDrawer.style.display = "none";
      });
    }
  }

  // Bilingual Switcher
  const langBtn = $("btn-lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const cur = getActiveLanguage();
      const next = cur === "ms" ? "en" : "ms";
      setLanguage(next);
    });
  }
}

/* ========================================================================= */
/* INITIALIZATION                                                            */
/* ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(getActiveLanguage());
  updateCountdown();
  setInterval(updateCountdown, 1000);
  bindRsvpForm();
  bindSalamKaut();
  loadGiftRegistry();
  loadWishesWall();
  bindFloatingControls();
});
