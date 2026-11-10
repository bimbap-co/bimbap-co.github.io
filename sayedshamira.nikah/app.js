/* ========================================================================= */
/* Sayed & Shamira · Akad Nikah Standalone Guest RSVP Portal JavaScript     */
/* Inspired by sheikha.aizat.dev · Complete Dual-Layer RSVP Engine           */
/* ========================================================================= */

const $ = id => document.getElementById(id);

/* ========================================================================= */
/* 1. BILINGUAL TRANSLATION ENGINE (BM ↔ EN)                                 */
/* ========================================================================= */
const LANG_STORAGE_KEY = "sayedshamira_lang";

const I18N = {
  ms: {
    langBtn: "EN",
    navCouple: "Pengantin",
    navDetails: "Butiran",
    navCountdown: "Mengira Hari",
    navRsvp: "RSVP",
    navRegistry: "Hadiah",
    navWishes: "Titipan Doa",
    navSaveTheDate: "Simpan Tarikh",
    heroEyebrow: "WALIMATULURUS",
    heroDateLabel: "Tarikh",
    heroDate: "Sabtu, 27 Mac 2027",
    heroTimeLabel: "Masa",
    heroTime: "9:00 Pagi - 1:00 Petang",
    heroVenueLabel: "Lokasi",
    heroVenue: "Masjid Raja Haji Fi Sabilillah, Cyberjaya",
    heroRsvpCta: "💌 Sahkan Kehadiran (RSVP)",
    heroSaveTheDateCta: "📅 Simpan Tarikh (Save the Date)",
    quranTranslation: '"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan untukmu pasangan-pasangan daripada jenismu sendiri, supaya kamu cenderung dan berasa tenteram kepadanya, dan dijadikan-Nya di antaramu rasa kasih sayang dan belas kasihan."',
    greetingLead: "Assalamu’alaikum Warahmatullahi Wabarakatuh & Salam Sejahtera",
    invitationBody: "Dengan penuh rasa kesyukuran ke hadrat Ilahi, kami sekeluarga dengan berbesar hati menjemput Dato' / Datin / Tuan / Puan / Encik / Cik serta seisi keluarga ke majlis Akad Nikah dan Jamuan Kesyukuran putera dan puteri kami:",
    prayerSub: "Semoga dengan kehadiran dan doa restu para tetamu sekalian akan menyerikan lagi majlis serta memberkati ikatan suci yang terbina hingga ke Jannah, Insya-Allah.",
    coupleKicker: "MEMPELAI",
    coupleTitle: "Pengantin",
    coupleSubtitle: "Celebrating love, laughter, and a lifetime together.",
    coupleGroomRole: "Pengantin Lelaki / The Groom",
    coupleGroomParents: "Anak lelaki kepada Pn. Zaini & Keluarga",
    coupleGroomQuote: "Bismillah, memulakan fasa baharu dengan penuh kesyukuran dan redha Ilahi.",
    coupleBrideRole: "Pengantin Perempuan / The Bride",
    coupleBrideParents: "Anak perempuan kepada Pn. Norzilawati & Keluarga",
    coupleBrideQuote: "Semoga baitul muslim yang dibina dilimpahi barakah, mawaddah wa rahmah.",
    countdownKicker: "DETIK WAKTU",
    countdownTitle: "Mengira Hari",
    countdownSubtitle: "Menanti saat bermulanya ikatan suci kami",
    cdDays: "HARI",
    cdHours: "JAM",
    cdMinutes: "MINIT",
    cdSeconds: "SAAT",
    eventKicker: "MAKLUMAT MAJLIS",
    eventTitle: "Butiran Majlis & Lokasi",
    eventSubtitle: "Majlis Akad Nikah & Jamuan Kesyukuran Keluarga",
    cardDateTimeTitle: "Tarikh & Masa",
    cardDateVal: "Sabtu, 27 Mac 2027",
    cardHijriVal: "18 Ramadan 1448H",
    itineraryTitle: "Susunan Acara (Order of Events)",
    itinArrival: "Ketibaan Tetamu & Keluarga",
    itinAkad: "Upacara Akad Nikah & Lafaz Ijab Qabul",
    itinSarung: "Upacara Pembatalan Air Sembahyang & Sarung Cincin",
    itinFeast: "Jamuan Kesyukuran & Sesi Bergambar",
    itinEnd: "Majlis Bersurai",
    cardVenueTitle: "Lokasi Masjid",
    cardVenueNotes: "Ruang Solat Utama & Dewan Jamuan Masjid (Aras Bawah)",
    qrScanPrompt: "Imbas Kod QR Menggunakan Telefon Pintar",
    cardDressTitle: "Tema & Kod Pakaian",
    cardDressSub: "Tona Warna Biru (Shades of Blue / Modest Malay Attire)",
    etiq1: "Pakaian menutup aurat dan sopan bersesuaian dengan adab di dalam masjid.",
    etiq2: "Ruang meletak kenderaan berpagar yang luas disediakan di perkarangan masjid.",
    etiq3: "Kapasiti majlis adalah terhad ≤ 200 tetamu untuk keselesaan bersama.",
    rsvpKicker: "PENGESAHAN KEHADIRAN",
    rsvpTitle: "Sahkan Kehadiran Anda (RSVP)",
    rsvpSubtitle: "Mohon maklumkan kehadiran anda selewat-lewatnya sebelum 27 Februari 2027 bagi membantu kami menguruskan kapasiti dewan (≤ 200 pax).",
    capBannerTitle: "Kapasiti Terhad Dewan Masjid Raja Haji",
    capBannerDesc: "Maksimum 200 Orang Tetamu Jemputan Sahaja",
    formNameLabel: "Nama Penuh Tetamu *",
    formPhoneLabel: "Nombor WhatsApp / Telefon *",
    formPhoneHint: "Untuk kami hantarkan peringatan dan pengesahan majlis.",
    formAttendingLabel: "Adakah anda akan hadir? *",
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
    successSub: "Maklumat kehadiran anda telah selamat direkodkan ke dalam daftar tetamu majlis.",
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
    navCouple: "The Couple",
    navDetails: "Details",
    navCountdown: "Countdown",
    navRsvp: "RSVP",
    navRegistry: "Gifts",
    navWishes: "Wishes",
    navSaveTheDate: "Save the Date",
    heroEyebrow: "CELEBRATE WITH US!",
    heroDateLabel: "Date",
    heroDate: "Saturday, 27 March 2027",
    heroTimeLabel: "Time",
    heroTime: "9:00 AM - 1:00 PM",
    heroVenueLabel: "Venue",
    heroVenue: "Masjid Raja Haji Fi Sabilillah, Cyberjaya",
    heroRsvpCta: "💌 Confirm Attendance (RSVP)",
    heroSaveTheDateCta: "📅 Save the Date",
    quranTranslation: '"And among His signs is that He created for you spouses from among yourselves that you may find tranquility in them; and He placed between you affection and mercy."',
    greetingLead: "Peace and Warmest Greetings",
    invitationBody: "With profound gratitude to God, our families cordially invite you and your family to celebrate the Solemnization (Akad Nikah) and Thanksgiving Reception of our children:",
    prayerSub: "May your presence and prayers grace this occasion and bless this sacred union for all years to come.",
    coupleKicker: "THE NEWLYWEDS",
    coupleTitle: "The Couple",
    coupleSubtitle: "Celebrating love, laughter, and a lifetime together.",
    coupleGroomRole: "The Groom",
    coupleGroomParents: "Son of Pn. Zaini & Family",
    coupleGroomQuote: "Bismillah, embarking on this blessed new chapter with gratitude and peace.",
    coupleBrideRole: "The Bride",
    coupleBrideParents: "Daughter of Pn. Norzilawati & Family",
    coupleBrideQuote: "May our home and union be filled with perpetual blessings, grace, and harmony.",
    countdownKicker: "TIME REMAINING",
    countdownTitle: "Counting Down",
    countdownSubtitle: "Counting down the moments until we begin our journey together",
    cdDays: "DAYS",
    cdHours: "HOURS",
    cdMinutes: "MINS",
    cdSeconds: "SECS",
    eventKicker: "EVENT DETAILS",
    eventTitle: "Wedding Details & Venue",
    eventSubtitle: "Solemnization Ceremony (Akad Nikah) & Reception",
    cardDateTimeTitle: "Date & Time",
    cardDateVal: "Saturday, 27 March 2027",
    cardHijriVal: "18 Ramadan 1448H",
    itineraryTitle: "Order of Events (Itinerary)",
    itinArrival: "Guest & Family Arrival",
    itinAkad: "Akad Nikah Solemnization Ceremony",
    itinSarung: "Ablution Cancellation & Ring Exchange",
    itinFeast: "Celebratory Luncheon & Photography",
    itinEnd: "Reception Concludes",
    cardVenueTitle: "Mosque Venue",
    cardVenueNotes: "Main Prayer Hall & Ground Floor Banquet Hall",
    qrScanPrompt: "Scan QR Code with Your Smartphone Camera",
    cardDressTitle: "Theme & Dress Code",
    cardDressSub: "Shades of Blue (Navy, Royal Blue, Sky Blue / Modest Attire)",
    etiq1: "Modest, respectfully covered attire in line with mosque etiquette.",
    etiq2: "Ample designated secure parking available within mosque grounds.",
    etiq3: "Hall capacity strictly limited to ≤ 200 guests for comfort.",
    rsvpKicker: "ATTENDANCE CONFIRMATION",
    rsvpTitle: "RSVP Confirmation",
    rsvpSubtitle: "Please RSVP before 27 February 2027 to assist us in managing the limited venue capacity (≤ 200 pax).",
    capBannerTitle: "Limited Hall Capacity (Masjid Raja Haji)",
    capBannerDesc: "Strict Maximum of 200 Invited Guests",
    formNameLabel: "Guest Full Name *",
    formPhoneLabel: "WhatsApp / Phone Number *",
    formPhoneHint: "For event updates and confirmation notices.",
    formAttendingLabel: "Will you be attending? *",
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
    successSub: "Your attendance details have been recorded into the official guest register.",
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

      if (!name || !phone) {
        alert("Sila lengkapkan nama dan nombor telefon.");
        return;
      }

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

      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.style.opacity = "0.6";
      if (spinner) spinner.style.display = "inline-block";

      try {
        await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});

        localStorage.setItem("sayedshamira_nikah_rsvp", JSON.stringify(payload));
        showSuccessCard(payload);

        if (message && isAttending) {
          appendWishLocally(name, message);
        }
      } catch (err) {
        localStorage.setItem("sayedshamira_nikah_rsvp", JSON.stringify(payload));
        showSuccessCard(payload);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.style.opacity = "1";
        if (spinner) spinner.style.display = "none";
      }
    });
  }

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

  setupCalendarButtons();
}

function setupCalendarButtons() {
  const title = encodeURIComponent("Akad Nikah Sayed Arif & Nor Shamira (#SAHdenganIra)");
  const details = encodeURIComponent("Majlis Akad Nikah & Jamuan Kesyukuran Sayed Arif Hakimi & Nor Shamira Irwani.\nLokasi: Masjid Raja Haji Fi Sabilillah Cyberjaya.");
  const location = encodeURIComponent("Masjid Raja Haji Fi Sabilillah, Cyberjaya, Selangor");
  const dates = "20270327T010000Z/20270327T050000Z"; // 9:00 AM - 1:00 PM GMT+8

  const gcalBtn = $("btn-add-gcal");
  if (gcalBtn) {
    gcalBtn.href = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }

  const heroSaveBtn = $("btn-hero-save-date");
  if (heroSaveBtn) {
    heroSaveBtn.onclick = () => {
      window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`, "_blank");
    };
  }

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
/* 4. DUIT SALAM KAUT & INTERACTIVE GIFT REGISTRY                            */
/* ========================================================================= */
function bindSalamKaut() {
  const copyBtn = $("btn-copy-acc");
  const copyBtnText = $("copy-btn-text");
  const accNum = $("bank-acc-num")?.textContent.trim() || "162209995537";

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(accNum).then(() => {
        if (copyBtnText) copyBtnText.textContent = "Disalin! ✓";
        copyBtn.style.background = "#15803D";
        setTimeout(() => {
          if (copyBtnText) copyBtnText.textContent = "Salin 📋";
          copyBtn.style.background = "var(--primary)";
        }, 2500);
      }).catch(() => {
        alert("Nombor Akaun: " + accNum);
      });
    });
  }

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
  { id: "gift-1", name: "Air Fryer / Smart Oven", category: "Kitchen", selectedBy: null },
  { id: "gift-2", name: "Espresso Barista Coffee Machine", category: "Kitchen", selectedBy: null },
  { id: "gift-3", name: "Robot Vacuum Cleaner / Cordless Vacuum", category: "Home Essentials", selectedBy: null },
  { id: "gift-4", name: "Luxury Cotton Bedding & King Comforter Set", category: "Bedroom", selectedBy: null },
  { id: "gift-5", name: "Porcelain Dining Plate & Cutlery Set (16-pcs)", category: "Dining", selectedBy: null },
  { id: "gift-6", name: "Premium Sejadah & Telekung Set for Couple", category: "Spiritual", selectedBy: null }
];

let selectedGiftsState = {};

function loadGiftState() {
  try {
    const saved = localStorage.getItem("sayedshamira_selected_gifts");
    if (saved) selectedGiftsState = JSON.parse(saved);
  } catch (e) {}
}

function saveGiftState() {
  try {
    localStorage.setItem("sayedshamira_selected_gifts", JSON.stringify(selectedGiftsState));
  } catch (e) {}
}

function loadGiftRegistry() {
  const mount = $("gift-items-mount");
  if (!mount) return;

  loadGiftState();

  mount.innerHTML = DEFAULT_GIFTS.map(item => {
    const selectedInfo = selectedGiftsState[item.id];
    const isSelected = Boolean(selectedInfo);
    return `
      <div class="gift-item-card" id="card-${item.id}">
        <div>
          <div class="gift-cat-pill">${item.category}</div>
          <h4 class="gift-name">${item.name}</h4>
        </div>
        <div class="gift-footer">
          <span class="gift-status-pill ${isSelected ? 'status-selected' : 'status-available'}">
            ${isSelected ? `Dipilih oleh ${selectedInfo.name}` : 'Tersedia'}
          </span>
          <button type="button" class="btn-select-gift" data-id="${item.id}" data-name="${encodeURIComponent(item.name)}">
            ${isSelected ? 'Dipilih ✓' : 'Pilih Hadiah 🎁'}
          </button>
        </div>
      </div>
    `;
  }).join("");

  bindGiftModalEvents();
}

let pendingGiftId = null;
let pendingGiftName = null;

function bindGiftModalEvents() {
  const modal = $("gift-modal");
  const closeBtn = $("close-gift-modal");
  const cancelBtn = $("btn-cancel-gift");
  const confirmBtn = $("btn-confirm-gift");
  const giverInput = $("gift-giver-name");

  document.querySelectorAll(".btn-select-gift").forEach(btn => {
    btn.addEventListener("click", () => {
      pendingGiftId = btn.dataset.id;
      pendingGiftName = decodeURIComponent(btn.dataset.name);

      if (modal) {
        $("gift-modal-desc").textContent = `Sila masukkan nama anda untuk memilih: "${pendingGiftName}"`;
        if (giverInput) giverInput.value = "";
        modal.showModal();
      }
    });
  });

  const closeModal = () => modal && modal.close();
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  confirmBtn?.addEventListener("click", () => {
    const giverName = giverInput.value.trim() || "Tetamu";
    if (pendingGiftId) {
      selectedGiftsState[pendingGiftId] = {
        name: giverName,
        timestamp: new Date().toISOString()
      };
      saveGiftState();
      loadGiftRegistry();

      const text = encodeURIComponent(`Salam Sayed & Shamira, saya (${giverName}) berhasrat untuk menghadiahkan: "${pendingGiftName}" sempena majlis Akad Nikah kalian.`);
      window.open(`https://wa.me/601132641499?text=${text}`, "_blank");
    }
    closeModal();
  });
}

/* ========================================================================= */
/* 5. GUESTBOOK / WISHES WALL                                                */
/* ========================================================================= */
const DEFAULT_WISHES = [
  { name: "Pak Ngah & Mak Ngah", message: "Tahniah Soya & Shamira! Semoga ikatan perkahwinan ini diberkati Allah SWT dan kekal bahagia hingga ke syurga." },
  { name: "Afiq & Isteri", message: "Selamat melangkah ke alam perkahwinan! Semoga dimurahkan rezeki dan dipermudahkan segala urusan kedua-dua mempelai." },
  { name: "Mama & Family", message: "Doa restu kami sentiasa mengiringi perjalanan hidup baharu kamu berdua. Jadilah pasangan yang saling melengkapi dan menyayangi." }
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
/* 6. FLOATING SYNTHESIZED MUSIC & WHATSAPP DRAWER                           */
/* ========================================================================= */
let audioCtx = null;
let isSynthPlaying = false;
let synthTimer = null;

function playAmbientHarpChord() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  // Gentle acoustic wedding progression: D - A - Bm - G
  const chordNotes = [
    [293.66, 369.99, 440.0, 587.33], // D maj
    [220.0, 277.18, 329.63, 440.0],  // A maj
    [246.94, 293.66, 369.99, 493.88], // B min
    [196.0, 246.94, 293.66, 392.0]   // G maj
  ];

  let chordIndex = 0;
  function triggerNextChord() {
    if (!isSynthPlaying) return;
    const now = audioCtx.currentTime;
    const notes = chordNotes[chordIndex % chordNotes.length];
    chordIndex++;

    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.04, now + i * 0.12 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.12 + 3.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 3.5);
    });

    synthTimer = setTimeout(triggerNextChord, 3600);
  }

  triggerNextChord();
}

function bindFloatingControls() {
  const audioBtn = $("btn-floating-music");
  const audioEl = $("ambient-audio");
  const musicIcon = $("music-icon");
  let isPlaying = false;

  if (audioBtn && audioEl) {
    audioEl.volume = 0.6;

    const startAudio = () => {
      if (isPlaying) return;
      audioEl.play().then(() => {
        isPlaying = true;
        audioBtn.classList.add("is-playing");
        if (musicIcon) musicIcon.textContent = "🔊";
      }).catch((err) => {
        console.log("Autoplay waiting for user interaction:", err);
      });
    };

    audioBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isPlaying) {
        audioEl.play().then(() => {
          isPlaying = true;
          audioBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        }).catch((err) => {
          console.log("Audio playback error, falling back to synth:", err);
          isPlaying = true;
          isSynthPlaying = true;
          playAmbientHarpChord();
          audioBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        });
      } else {
        audioEl.pause();
        isPlaying = false;
        isSynthPlaying = false;
        if (synthTimer) clearTimeout(synthTimer);
        audioBtn.classList.remove("is-playing");
        if (musicIcon) musicIcon.textContent = "🎵";
      }
    });

    // Auto-play the music on each refresh after 2 seconds
    setTimeout(startAudio, 2000);

    // Also attach first-interaction listener if browser autoplay policy delays unprompted audio
    ["click", "touchstart", "scroll", "keydown"].forEach((evt) => {
      window.addEventListener(evt, startAudio, { once: true, passive: true });
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
  setupCalendarButtons();
});
