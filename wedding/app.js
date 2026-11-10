/* ========================================================================= */
/* Sayed & Shamira Wedding (#SAHdenganIra) — Official Public Guest Portal    */
/* Strictly Guest-Only Build · Zero Private Records · Zero Financial Metrics  */
/* ========================================================================= */

const $ = id => document.getElementById(id);

function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function daysUntil(dateString) {
  const target = new Date(dateString + "T00:00:00+08:00");
  const now = new Date();
  const diff = target - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

/* ========================================================================= */
/* BILINGUAL LANGUAGE ENGINE (BM ↔ EN)                                      */
/* ========================================================================= */
const LANG_STORAGE_KEY = "soyarin_lang";

const I18N = {
  ms: {
    langBtn: "EN",
    langPrompt: "Tukar ke Bahasa Inggeris (Switch to English)",
    navGuest: "Menu Utama",
    navTentative: "Aturcara",
    navRsvp: "RSVP Nikah",
    navContacts: "Hubungi",
    heroTitle: "Sayed & Shamira Wedding",
    heroSub: "Dengan penuh kesyukuran dan kasih sayang, kami mengalu-alukan kehadiran keluarga serta para tetamu yang dirahmati ke lembaran bahagia kami.",
    rsvpCta: "Sahkan Kehadiran Nikah (RSVP)",
    tentativeCta: "Lihat Aturcara Majlis",
    daysToGo: "Hari Lagi",
    rsvpTitle: "Pengesahan Kehadiran (RSVP) Akad Nikah",
    rsvpDesc: "Majlis Akad Nikah & Jamuan Kesyukuran · Sabtu, 27 Mac 2027 · Masjid Raja Haji Fi Sabilillah, Cyberjaya. Sila sahkan kehadiran anda bagi membantu perancangan kapasiti (< 200 pax).",
    nameLabel: "Nama Penuh Anda",
    namePlaceholder: "cth: Pak Ngah / En. Ahmad & Pn. Aminah",
    phoneLabel: "Nombor Telefon / WhatsApp",
    phonePlaceholder: "cth: 012-3456789",
    attendingLabel: "Adakah anda akan hadir?",
    attendingYes: "Ya, saya/kami akan hadir!",
    attendingNo: "Maaf, tidak dapat hadir",
    adultsLabel: "Bilangan Dewasa (12 tahun ke atas)",
    kidsLabel: "Bilangan Kanak-kanak (bawah 12 tahun)",
    totalPaxLabel: "Jumlah Kehadiran (Pax)",
    messageLabel: "Ucapan & Doa Khas (Pilihan)",
    messagePlaceholder: "Titipkan doa dan ucapan manis buat kedua mempelai…",
    submitBtn: "Hantar Pengesahan Kehadiran 💌",
    submitting: "Sedang menghantar…",
    submitSuccess: "Alhamdulillah! Terima kasih atas pengesahan kehadiran anda.",
    registryTitle: "Hajat & Hadiah Buat Mempelai",
    registryDesc: "Kehadiran serta doa restu anda adalah hadiah yang paling bermakna. Sekiranya berhajat menitipkan tanda ingatan, berikut adalah senarai hajat kami atau sumbangan Duit Salam Kaut:",
    salamKautTitle: "Duit Salam Kaut (Bank QR & Pindahan)",
    salamKautDesc: "Imbas kod DuitNow QR atau salin nombor akaun di bawah. Selepas pindahan, anda boleh klik butang WhatsApp untuk menghantar resit/notifikasi terus kepada pengantin.",
    customGiftTitle: "Cadang Hadiah / Hajat Sendiri",
    customGiftPlaceholder: "cth: Set Periuk Memasak / Blender",
    customGiftBtn: "Hantar Cadangan Hadiah 🎁",
    wishesTitle: "Titipan Doa & Ucapan Tetamu",
  },
  en: {
    langBtn: "BM",
    langPrompt: "Switch to Bahasa Melayu",
    navGuest: "Guest Menu",
    navTentative: "Tentative",
    navRsvp: "Nikah RSVP",
    navContacts: "Contacts",
    heroTitle: "Sayed & Shamira Wedding",
    heroSub: "With gratitude and joy, we warmly welcome our beloved family and friends to celebrate this special chapter of our lives.",
    rsvpCta: "RSVP for Akad Nikah",
    tentativeCta: "View Event Schedule",
    daysToGo: "Days to Go",
    rsvpTitle: "Akad Nikah Attendance Confirmation (RSVP)",
    rsvpDesc: "Solemnization & Thanksgiving Reception · Saturday, 27 March 2027 · Masjid Raja Haji Fi Sabilillah, Cyberjaya. Please RSVP to help us manage venue capacity (< 200 pax).",
    nameLabel: "Your Full Name",
    namePlaceholder: "e.g. Uncle John / Mr. Ahmad & Mrs. Aminah",
    phoneLabel: "Phone / WhatsApp Number",
    phonePlaceholder: "e.g. +6012-3456789",
    attendingLabel: "Will you be attending?",
    attendingYes: "Yes, I/we will be attending!",
    attendingNo: "Sorry, unable to attend",
    adultsLabel: "Adults (12 years and above)",
    kidsLabel: "Children (below 12 years)",
    totalPaxLabel: "Total Headcount (Pax)",
    messageLabel: "Special Wishes & Du'a (Optional)",
    messagePlaceholder: "Leave a warm message or prayer for the couple…",
    submitBtn: "Submit RSVP Confirmation 💌",
    submitting: "Submitting…",
    submitSuccess: "Alhamdulillah! Thank you for confirming your attendance.",
    registryTitle: "Gift Registry & Wishes",
    registryDesc: "Your presence and prayers are the greatest gifts of all. Should you wish to honor us with a gift, here is our registry and Duit Salam Kaut options:",
    salamKautTitle: "Duit Salam Kaut (DuitNow QR & Transfer)",
    salamKautDesc: "Scan the DuitNow QR or copy the bank account details below. After transfer, tap the WhatsApp button to notify the couple directly.",
    customGiftTitle: "Suggest Your Own Gift",
    customGiftPlaceholder: "e.g. Microwave Oven / Dinnerware Set",
    customGiftBtn: "Submit Gift Suggestion 🎁",
    wishesTitle: "Guest Book & Well Wishes",
  }
};

function getActiveLanguage() {
  try {
    return localStorage.getItem(LANG_STORAGE_KEY) || "ms";
  } catch (e) {
    return "ms";
  }
}

function t(key) {
  const lang = getActiveLanguage();
  return I18N[lang]?.[key] || I18N.ms[key] || key;
}

function setLanguage(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (e) {}
  const btnLabel = $("lang-current-label");
  if (btnLabel) btnLabel.textContent = lang === "ms" ? "EN" : "BM";
  render();
}

/* ========================================================================= */
/* THEME MANAGER (LIGHT · DARK · SYSTEM)                                     */
/* ========================================================================= */
const THEME_STORAGE_KEY = "soyarin_theme";

function getActiveThemePreference() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || "system";
  } catch (e) {
    return "system";
  }
}

function applyTheme(preference) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const effectiveTheme = (preference === "dark" || (preference === "system" && prefersDark)) ? "dark" : "light";

  root.setAttribute("data-theme", effectiveTheme);
  root.setAttribute("data-theme-preference", preference);

  document.querySelectorAll(".theme-switcher-btn").forEach(btn => {
    const val = btn.getAttribute("data-theme-val");
    const isActive = val === preference;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  const themeIcons = { light: "☀️", dark: "🌙", system: "💻" };
  const currentIcon = themeIcons[preference] || (effectiveTheme === "dark" ? "🌙" : "☀️");
  document.querySelectorAll(".theme-current-icon").forEach(el => {
    el.textContent = currentIcon;
  });

  const modeCapitalized = preference.charAt(0).toUpperCase() + preference.slice(1);
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.setAttribute("data-prompt", `Theme: ${modeCapitalized} (Click to change)`);
    btn.setAttribute("title", `Theme: ${modeCapitalized}`);
  });

  document.querySelectorAll(".theme-menu-item").forEach(item => {
    const val = item.getAttribute("data-theme-val");
    const isActive = val === preference;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function bindThemeDropdown(container = document) {
  const toggleBtn = container.querySelector("#btn-theme-toggle") || container.querySelector(".theme-toggle-btn");
  const menu = container.querySelector("#theme-dropdown-menu") || container.querySelector(".theme-dropdown-menu");

  if (toggleBtn && menu) {
    toggleBtn.onclick = e => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = menu.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    };

    menu.querySelectorAll(".theme-menu-item").forEach(item => {
      item.onclick = e => {
        e.preventDefault();
        e.stopPropagation();
        const val = item.getAttribute("data-theme-val");
        if (val) {
          setThemePreference(val);
        }
        menu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      };
    });

    document.addEventListener("click", e => {
      if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
        menu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
}

function setThemePreference(preference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch (e) {}
  applyTheme(preference);
}

function createThemeSwitcherHtml(idPrefix = "nav") {
  const cur = getActiveThemePreference();
  return `
    <div class="theme-switcher-group" role="group" aria-label="Theme mode switcher">
      <button type="button" class="theme-switcher-btn ${cur === 'light' ? 'is-active' : ''}" data-theme-val="light" title="Light theme" aria-label="Light mode" aria-pressed="${cur === 'light'}">
        <span class="theme-icon">☀️</span>
        <span class="theme-label">Light</span>
      </button>
      <button type="button" class="theme-switcher-btn ${cur === 'dark' ? 'is-active' : ''}" data-theme-val="dark" title="Dark theme" aria-label="Dark mode" aria-pressed="${cur === 'dark'}">
        <span class="theme-icon">🌙</span>
        <span class="theme-label">Dark</span>
      </button>
      <button type="button" class="theme-switcher-btn ${cur === 'system' ? 'is-active' : ''}" data-theme-val="system" title="Follow system theme" aria-label="System mode" aria-pressed="${cur === 'system'}">
        <span class="theme-icon">💻</span>
        <span class="theme-label">Auto</span>
      </button>
    </div>
  `;
}

function bindThemeSwitcherEvents(container = document) {
  container.querySelectorAll(".theme-switcher-btn").forEach(btn => {
    btn.onclick = e => {
      e.preventDefault();
      const val = btn.getAttribute("data-theme-val");
      if (val) {
        setThemePreference(val);
      }
    };
  });
}

function openWaB64(enc) {
  try {
    const raw = atob(enc);
    const cleaned = raw.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleaned}`, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("Invalid base64 phone", e);
  }
}

function callB64(enc) {
  try {
    const raw = atob(enc);
    const cleaned = raw.replace(/[^0-9+]/g, "");
    window.location.href = `tel:${cleaned}`;
  } catch (e) {
    console.error("Invalid base64 phone", e);
  }
}

/* ========================================================================= */
/* APPROVED WEDDING EVENTS REGISTRY                                          */
/* ========================================================================= */
const APPROVED_EVENTS = [
  {
    id: "tunang",
    phaseNum: "1. Tunang",
    date: "2026-12-27",
    dateFormatted: "Sunday, 27/12/2026",
    time: "10:00 AM – 1:00 PM",
    location: "Gastrohub Event House, Cyberjaya",
    dressCode: "Matcha & Strawberry",
    mapsUrl: "https://maps.app.goo.gl/231k2Gxhw8KxayAr7",
    wazeUrl: "https://waze.com/ul/hw22rurtuh",
    posterUrl: "./posters/poster-tunang.jpg"
  },
  {
    id: "nikah",
    phaseNum: "2. Nikah",
    date: "2027-03-27",
    dateFormatted: "Saturday, 27/03/2027",
    time: "9:00 AM – 1:00 PM",
    location: "Masjid Raja Haji Fi Sabilillah, Cyberjaya",
    dressCode: "Shades of Blue",
    mapsUrl: "https://maps.app.goo.gl/tEW5DLnAUDDHascHA",
    wazeUrl: "https://waze.com/ul/hw2829j9sp",
    posterUrl: "./posters/poster-nikah.jpg"
  },
  {
    id: "sanding",
    phaseNum: "3. Sanding",
    date: "2027-11-27",
    dateFormatted: "Saturday, 27/11/2027",
    time: "11:00 AM – 4:00 PM",
    location: "Royale Palace, Cyberjaya",
    dressCode: "Shades of Purple",
    mapsUrl: "https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9",
    wazeUrl: "https://waze.com/ul/hw2829ntvy",
    posterUrl: "./posters/poster-sanding.jpg"
  }
];

/* ========================================================================= */
/* APPROVED PUBLIC COORDINATOR DIRECTORY (BASE64 CONTACT SECURED)            */
/* ========================================================================= */
const APPROVED_COORDINATORS = [
  {
    category: "Family Principals & Couple",
    role: "Groom",
    name: "Sayed Arif Hakimi (Sayed)",
    phone: "018-3767437",
    rawPhone: "60183767437",
    note: "Primary groom coordinator",
    icon: "🤵"
  },
  {
    category: "Family Principals & Couple",
    role: "Bride",
    name: "Nor Shamira Irwani (Shamira)",
    phone: "018-9559415",
    rawPhone: "60189559415",
    note: "Primary bride coordinator",
    icon: "👰"
  },
  {
    category: "Family Principals & Couple",
    role: "Groom's Mother",
    name: "Mama (Groom's Mother)",
    phone: "012-2839140",
    rawPhone: "60122839140",
    note: "Groom family liaison & sarung cincin lead (Pn. Zaini)",
    icon: "🧕"
  },
  {
    category: "Family Principals & Couple",
    role: "Bride's Mother",
    name: "Ibu (Bride's Mother)",
    phone: "019-6458300",
    rawPhone: "60196458300",
    note: "Bride family liaison & welcoming lead (Pn. Norzilawati)",
    icon: "🧕"
  },
  {
    category: "Venues & Event Logistics",
    role: "Gastrohub Venue PIC",
    name: "En. Izz (Gastrohub)",
    phone: "013-5599032",
    rawPhone: "60135599032",
    note: "Engagement venue operations & floor manager",
    icon: "🏛️"
  },
  {
    category: "Venues & Event Logistics",
    role: "Masjid Raja Haji PIC",
    name: "Ustaz Syahir (Masjid Raja Haji)",
    phone: "013-4767535",
    rawPhone: "60134767535",
    note: "Akad Nikah ceremony coordinator & hall booking",
    icon: "🕌"
  },
  {
    category: "Venues & Event Logistics",
    role: "Royale Palace Grand Manager",
    name: "Pn. Elyna (Royale Palace)",
    phone: "017-9377965",
    rawPhone: "60179377965",
    note: "Reception hall, banquet catering & bridal entrance",
    icon: "👑"
  },
  {
    category: "Media & Photography",
    role: "Videography Lead",
    name: "Deloka Videography Official",
    phone: "012-5888015",
    rawPhone: "60125888015",
    note: "Official wedding cinematic film",
    icon: "🎥"
  },
  {
    category: "Media & Photography",
    role: "Photography Lead",
    name: "SejedaFilm Official",
    phone: "017-9878278",
    rawPhone: "60179878278",
    note: "Official portraits, ceremony & album coverage",
    icon: "📸"
  }
];

/* ========================================================================= */
/* 3. MODAL DIALOGS                                                          */
/* ========================================================================= */
const detailModal = $("detail-modal");
const detailModalTitle = $("detail-modal-title");
const detailModalBody = $("detail-modal-body");

function openDetailModal(title, htmlContent) {
  if (!detailModal) return;
  if (detailModalTitle) detailModalTitle.textContent = title;
  if (detailModalBody) detailModalBody.innerHTML = htmlContent;
  detailModal.showModal();
}

function closeDetailModal() {
  if (!detailModal) return;
  detailModal.close();
  if (detailModalBody) detailModalBody.innerHTML = "";
}

function openPosterModal(phaseName, posterSrc) {
  openDetailModal(`Official Poster · ${phaseName}`, `
    <div style="text-align: center; padding: 4px 0;">
      <img src="${posterSrc}" alt="${phaseName} Official Poster" style="max-width: 100%; max-height: 72vh; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.15); display: inline-block;">
      <div style="margin-top: 14px; display: flex; justify-content: center; gap: 8px;">
        <a href="${posterSrc}" target="_blank" download class="quick-action-btn">⬇️ Download High-Res Image</a>
        <button type="button" class="quick-action-btn" onclick="document.getElementById('detail-modal').close();">Close</button>
      </div>
    </div>
  `);
}

$("close-detail-modal")?.addEventListener("click", closeDetailModal);
detailModal?.addEventListener("click", event => {
  if (event.target === detailModal) closeDetailModal();
});

/* ========================================================================= */
/* 4. NAVIGATION TABS                                                        */
/* ========================================================================= */
const GUEST_TABS = {
  guest: ["Guest Menu", "🌸", "Official Wedding Guide"],
  tentative: ["Tentative", "📅", "Day Programmes & Posters"],
  rsvp: ["RSVP Nikah", "💌", "Sahkan Kehadiran & Hadiah"],
  contacts: ["Contacts", "📞", "Key PIC Directory"]
};

function renderNav() {
  const navBar = $("nav");
  if (!navBar) return;
  navBar.replaceChildren();

  const tabsInner = make("div", "tabs-bar-inner guest-nav-layout");
  let requested = location.hash.slice(1);
  if (!requested || !GUEST_TABS[requested]) requested = "guest";

  const leftSpacer = make("div", "nav-side-spacer");
  leftSpacer.setAttribute("aria-hidden", "true");

  const centerTabs = make("div", "nav-center-tabs");
  for (const [id, [label, icon, desc]] of Object.entries(GUEST_TABS)) {
    const a = make("a");
    a.href = `#${id}`;
    a.title = desc;
    if (id === requested) a.classList.add("is-active");

    const iconSpan = make("span", "icon", icon);
    const dynamicLabel = id === "guest" ? t("navGuest") :
                         id === "tentative" ? t("navTentative") :
                         id === "rsvp" ? t("navRsvp") :
                         id === "contacts" ? t("navContacts") : label;
    const labelSpan = make("span", "label", dynamicLabel);
    a.append(iconSpan, labelSpan);
    centerTabs.append(a);
  }

  const rightAction = make("div", "nav-side-action");

  tabsInner.append(leftSpacer, centerTabs, rightAction);
  navBar.append(tabsInner);
  bindThemeSwitcherEvents(navBar);
}

/* ========================================================================= */
/* APPROVED WEDDING SPONSORS & IN-KIND CONTRIBUTIONS (DISCREET GUEST LIST)   */
/* ========================================================================= */
const APPROVED_SPONSORS = [
  {
    name: "Achin (Groom's Uncle)",
    function: "Nikah Ceremony Gift",
    date: "27/03/2027",
    phase: "Nikah",
    phaseClass: "phase-chip-nikah"
  },
  {
    name: "Mama (Groom's Mother)",
    function: "Groom Nikah Ring Sponsorship",
    date: "27/03/2027",
    phase: "Nikah",
    phaseClass: "phase-chip-nikah"
  },
  {
    name: "Achin (Groom's Uncle)",
    function: "Bunga Telur Rebus (In-Kind)",
    date: "27/03/2027",
    phase: "Nikah",
    phaseClass: "phase-chip-nikah"
  },
  {
    name: "Cik Jah (Groom's Auntie)",
    function: "Balang Kacang Favors (In-Kind)",
    date: "27/03/2027",
    phase: "Nikah",
    phaseClass: "phase-chip-nikah"
  },
  {
    name: "Mama (Groom's Mother)",
    function: "Reception Beras Supply (In-Kind)",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  },
  {
    name: "Mama (Groom's Mother)",
    function: "Apam Balik & Ice Cream Live Kiosk",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  },
  {
    name: "Mama (Groom's Mother)",
    function: "Laksa Live Kiosk",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  },
  {
    name: "Angah (Groom's Siblings)",
    function: "Artisan Coffee Live Kiosk",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  },
  {
    name: "Along (Groom's Siblings)",
    function: "Photobooth Live Station (In-Kind)",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  },
  {
    name: "Ibu (Bride's Mother)",
    function: "Sweet Dessert & Pastry Table",
    date: "27/11/2027",
    phase: "Sanding",
    phaseClass: "phase-chip-sanding"
  }
];

function guestSponsorsView(parent) {
  const card = make("div", "coordinator-card guest-sponsors-section");
  card.style.marginTop = "24px";
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px; flex-wrap: wrap; gap: 8px;">
      <div>
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 4px 0;">
          🎁 Wedding Sponsors &amp; In-Kind Contributions
        </h3>
        <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
          Heartfelt gratitude to our beloved family and sponsors for their generous blessings and contributions.
        </p>
      </div>
      <span class="tab-badge" style="background: var(--burgundy); color: #fff; border-radius: 9999px; padding: 2px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">
        ${APPROVED_SPONSORS.length} Contributions
      </span>
    </div>
    <div class="guest-sponsors-grid">
      ${APPROVED_SPONSORS.map(s => `
        <div class="guest-sponsor-card">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span class="${s.phaseClass}" style="font-size: 11px; font-weight: 700;">${s.phase}</span>
            <span style="font-size: 11px; color: var(--charcoal-muted); font-weight: 600;">📅 ${s.date}</span>
          </div>
          <h4 style="font-size: 15px; font-weight: 700; color: var(--charcoal); margin: 0 0 4px 0; font-family: var(--font-sans);">${s.name}</h4>
          <div style="font-size: 13px; font-weight: 600; color: var(--burgundy);">${s.function}</div>
        </div>
      `).join("")}
    </div>
  `;
  parent.append(card);
}

/* ========================================================================= */
/* 5. GUEST MENU VIEW (TAB 1)                                                */
/* ========================================================================= */
function guestView(parent) {
  const container = make("div", "guest-guide-wrap");

  // Hero Card with Romantic Malay Greeting
  const hero = make("div", "guest-hero-card");
  hero.innerHTML = `
    <div style="width: 100%;">
      <div class="guest-hero-title">
        <span>Sayed &amp; Shamira Wedding</span>
        <span class="hashtag-badge">#SAHdenganIra</span>
        <span class="year-badge">2026 – 2027</span>
      </div>
      <p class="guest-hero-sub" style="font-style: italic;">
        ${t("heroSub")}
      </p>
      <div class="guest-hero-actions">
        <a href="#rsvp" class="hero-cta-btn rsvp-cta-btn">
          <span>💌</span> <span>${t("rsvpCta")}</span>
        </a>
        <a href="#tentative" class="hero-cta-btn tentative-cta-btn">
          <span>📅</span> <span>${t("tentativeCta")}</span>
        </a>
      </div>
    </div>
  `;
  container.append(hero);

  // The Three Wedding Phases Grid
  const eventsGrid = make("div", "guest-event-grid");

  for (const ev of APPROVED_EVENTS) {
    const card = make("article", "guest-event-card");
    const chipClass = `phase-chip-${ev.id}`;
    const rsvpAction = ev.id === "nikah" ? `
      <a href="#rsvp" class="guest-btn" style="background: var(--burgundy); color: #fff; border-color: var(--burgundy);">
        💌 ${t("rsvpCta")}
      </a>
    ` : "";

    card.innerHTML = `
      <div class="guest-event-eyebrow">
        <span class="${chipClass}">${ev.phaseNum}</span>
        <span>${ev.dateFormatted}</span>
      </div>
      <div>
        <div class="guest-countdown-badge">
          <span>${daysUntil(ev.date)}</span>
          <span class="guest-countdown-label">${t("daysToGo")}</span>
        </div>
      </div>
      <div class="guest-event-meta-list">
        <div class="guest-meta-item">
          <span><strong>Time:</strong> ${ev.time}</span>
        </div>
        <div class="guest-meta-item">
          <span><strong>Location:</strong> ${ev.location}</span>
        </div>
        <div class="guest-meta-item">
          <span><strong>Dress Code:</strong> ${ev.dressCode}</span>
        </div>
      </div>
      <div class="guest-actions-bar">
        ${rsvpAction}
        <a href="${ev.mapsUrl}" target="_blank" rel="noopener noreferrer" class="guest-btn">📍 Google Maps</a>
        <a href="${ev.wazeUrl}" target="_blank" rel="noopener noreferrer" class="guest-btn">🧭 Waze</a>
        <button type="button" class="guest-btn" id="poster-btn-${ev.id}">🖼️ Poster</button>
      </div>
    `;

    card.querySelector(`#poster-btn-${ev.id}`)?.addEventListener("click", () => {
      openPosterModal(ev.phaseNum, ev.posterUrl);
    });

    eventsGrid.append(card);
  }

  container.append(eventsGrid);

  // Core Guidelines & Etiquette (Accordion/Details format)
  const guidelinesCard = make("div", "coordinator-card");
  guidelinesCard.style.marginTop = "24px";
  guidelinesCard.innerHTML = `
    <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 12px 0;">
      ✨ Guest Etiquette &amp; Attire Guide
    </h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
      <div class="guideline-box">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin: 0 0 4px 0;">🌸 Dress Codes by Phase</h4>
        <ul style="font-size: 12px; color: var(--charcoal-muted); margin: 0; padding-left: 18px; line-height: 1.6;">
          <li><strong>1. Tunang:</strong> Soft Pastels (Matcha &amp; Strawberry)</li>
          <li><strong>2. Nikah:</strong> Modest Malay Attire (Baju Melayu / Baju Kurung), White &amp; Soft Neutral</li>
          <li><strong>3. Sanding:</strong> Grand Reception Attire, Shades of Purple (Deep Purple, Lilac &amp; Lavender)</li>
        </ul>
      </div>
      <div class="guideline-box">
        <h4 style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin: 0 0 4px 0;">🚗 Parking &amp; Navigation</h4>
        <ul style="font-size: 12px; color: var(--charcoal-muted); margin: 0; padding-left: 18px; line-height: 1.6;">
          <li>Ample designated parking provided at all 3 venues.</li>
          <li>Click or scan Waze / Google Maps buttons for direct turn-by-turn navigation.</li>
        </ul>
      </div>
    </div>
  `;
  container.append(guidelinesCard);

  // Wedding Sponsors & In-Kind Contributions (Discreet Cards Grid)
  guestSponsorsView(container);

  parent.append(container);
}

/* ========================================================================= */
/* 6. TENTATIVE SCHEDULES & PROGRAMMES VIEW (TAB 2)                          */
/* ========================================================================= */
function tentativeView(parent) {
  const container = make("div", "guest-tentative-wrap");

  container.innerHTML = `
    <div class="tentative-header-bar">
      <div>
        <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--burgundy); margin: 0 0 4px 0;">
          Tentative Event Schedules &amp; Facts
        </h2>
        <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
          Approved working programmes, venue locations, dress codes, and vendor contacts for all 3 phases.
        </p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button type="button" class="quick-action-btn" id="btn-open-contacts">📞 Contacts Directory</button>
        <button type="button" class="quick-action-btn" id="btn-toggle-all-phases">▾ Expand All Phases</button>
      </div>
    </div>

    <!-- PHASE 1: TUNANG -->
    <div class="phase-accordion" id="accordion-phase-1" style="margin-top: 18px;">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: var(--burgundy);">P1</span>
          <div>
            <h3 class="phase-accordion-heading">1. Tunang</h3>
            <div class="phase-accordion-sub">Sunday, 27/12/2026 · 10:00 AM–1:00 PM · Gastrohub Event House, Nilai</div>
          </div>
        </div>
        <div class="phase-accordion-meta">
          <span class="event-time-pill">10:00 AM – 1:00 PM</span>
          <span class="phase-accordion-chevron">▼</span>
        </div>
      </div>
      <div class="phase-accordion-body">
        <div class="tentative-cards-grid">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Gastrohub Event House Nilai</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Persiaran Korporat, Nilai, Negeri Sembilan</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag matcha"><span class="dot"></span> Groom Family: Matcha Green</span>
              <span class="dresscode-tag strawberry"><span class="dot"></span> Bride Family: Strawberry Pink</span>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">CAPACITY &amp; RUN SHEET</div>
            <div class="tentative-info-val">30 Pax Family VIP</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">VIP intimate engagement luncheon</div>
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 2: NIKAH -->
    <div class="phase-accordion" id="accordion-phase-2" style="margin-top: 18px;">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: var(--burgundy);">P2</span>
          <div>
            <h3 class="phase-accordion-heading">2. Nikah</h3>
            <div class="phase-accordion-sub">Saturday, 27/03/2027 · 9:00 AM–1:00 PM (Akad 10:05 AM) · Masjid Raja Haji Fi Sabilillah, Cyberjaya</div>
          </div>
        </div>
        <div class="phase-accordion-meta">
          <span class="event-time-pill">9:00 AM – 1:00 PM</span>
          <span class="phase-accordion-chevron">▼</span>
        </div>
      </div>
      <div class="phase-accordion-body">
        <div class="tentative-cards-grid">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Masjid Raja Haji Fi Sabilillah</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Persiaran Semarak Api, Cyberjaya</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/yQ6uB2bcvNqg7i2m6" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw2829ev3c" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag neutral"><span class="dot"></span> White &amp; Neutral Tones</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Sopan &amp; Menutup Aurat di Masjid</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">RSVP &amp; KAPASITI</div>
            <div class="tentative-info-val">&le; 200 Pax Jemputan</div>
            <div style="margin-top: 6px;">
              <a href="#rsvp" class="contact-btn" style="background: var(--burgundy); color: #fff; text-decoration: none;">💌 Sahkan Kehadiran (RSVP)</a>
            </div>
          </div>
        </div>

        <!-- Desktop QR Code Navigation Display for Masjid Raja Haji -->
        <div class="qr-nav-desktop-box">
          <div style="width: 100%; text-align: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); letter-spacing: 0.5px;">
              📱 Imbas Kod QR untuk Navigasi Terus ke Masjid (Telefon Pintar)
            </span>
          </div>
          <div class="qr-nav-item">
            <img src="./qr/qr-waze-nikah.svg" alt="QR Waze Nikah" loading="lazy">
            <span>🧭 Waze</span>
          </div>
          <div class="qr-nav-item">
            <img src="./qr/qr-maps-nikah.svg" alt="QR Google Maps Nikah" loading="lazy">
            <span>📍 Google Maps</span>
          </div>
        </div>

        <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin: 16px 0 8px 0;">Approved Itinerary (9:00 AM – 1:00 PM)</h4>
        <div class="table-wrap" style="overflow-x: auto; margin-bottom: 18px;">
          <table class="tentative-schedule-table">
            <thead>
              <tr>
                <th style="width: 105px;">Time</th>
                <th>Program &amp; Activity</th>
                <th style="width: 160px;">Lead / PIC</th>
                <th>Notes &amp; Location</th>
              </tr>
            </thead>
            <tbody>
              <tr><td><span class="tentative-time-badge">09:00 AM</span></td><td><strong>Ketibaan Tetamu &amp; Keluarga</strong></td><td>Keluarga &amp; Urus Setia</td><td>Dewan Solat Utama Masjid</td></tr>
              <tr><td><span class="tentative-time-badge">09:45 AM</span></td><td><strong>Pemeriksaan Dokumen &amp; Khutbah Nikah</strong></td><td>Tuan Kadi / Jurunikah</td><td>Meja Nikah Dewan Solat Utama</td></tr>
              <tr style="background: rgba(107, 29, 47, 0.03);"><td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFF;">10:05 AM</span></td><td><strong style="color: var(--burgundy);">Upacara Akad Nikah (Ijab &amp; Qabul)</strong></td><td>Tuan Kadi, Pengantin &amp; Wali</td><td>Lafaz Akad, Mas Kahwin &amp; Taklik</td></tr>
              <tr><td><span class="tentative-time-badge">10:40 AM</span></td><td><strong>Sesi Batal Air Sembahyang &amp; Hantaran</strong></td><td>Pasangan Pengantin &amp; Keluarga</td><td>Penyarungan Cincin &amp; Hadiah</td></tr>
              <tr><td><span class="tentative-time-badge">11:15 AM</span></td><td><strong>Sesi Fotografi Bersama Keluarga</strong></td><td>Jurutera Foto Rasmi</td><td>Dewan Utama &amp; Laman Masjid</td></tr>
              <tr style="background: rgba(107, 29, 47, 0.03);"><td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFF;">11:45 AM</span></td><td><strong style="color: var(--burgundy);">Jamuan Kesyukuran Akad Nikah</strong></td><td>Katering &amp; Urus Setia</td><td>Dewan Jamuan Masjid</td></tr>
              <tr><td><span class="tentative-time-badge">01:00 PM</span></td><td><strong>Majlis Bersurai</strong></td><td>Semua Tetamu</td><td>Ucapan Kesyukuran &amp; Bersurai</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- PHASE 3: SANDING -->
    <div class="phase-accordion" id="accordion-phase-3" style="margin-top: 18px;">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: var(--burgundy);">P3</span>
          <div>
            <h3 class="phase-accordion-heading">3. Sanding</h3>
            <div class="phase-accordion-sub">Saturday, 27/11/2027 · 11:00 AM–4:00 PM · Royale Palace Grand Ballroom, Cyberjaya</div>
          </div>
        </div>
        <div class="phase-accordion-meta">
          <span class="event-time-pill">11:00 AM – 4:00 PM</span>
          <span class="phase-accordion-chevron">▼</span>
        </div>
      </div>
      <div class="phase-accordion-body">
        <div class="tentative-cards-grid">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Royale Palace Grand Ballroom</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">2 Jalan Teknokrat 2, Cyberjaya</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/wY3v46a3W6Z4zS7H6" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw28297hce" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag purple"><span class="dot"></span> Shades of Purple (Both Families)</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Deep Purple, Lilac &amp; Lavender</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE PIC &amp; CONTACT</div>
            <div class="tentative-info-val">Pn. Elyna (Royale Palace)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <button type="button" onclick="callB64('NjAxNzkzNzc5NjU=')" class="contact-btn btn-call" style="cursor: pointer;">📞 +60 17-937 7965</button>
              <button type="button" onclick="openWaB64('NjAxNzkzNzc5NjU=')" class="contact-btn btn-wa" style="cursor: pointer;">💬 WhatsApp</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Accordion Expand/Collapse Logic
  const accordions = container.querySelectorAll(".phase-accordion");
  accordions.forEach(acc => {
    const header = acc.querySelector(".phase-accordion-header");
    header?.addEventListener("click", () => {
      const isOpen = acc.classList.contains("is-open");
      acc.classList.toggle("is-open", !isOpen);
      header.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });

  let allExpanded = false;
  const toggleBtn = container.querySelector("#btn-toggle-all-phases");
  toggleBtn?.addEventListener("click", () => {
    allExpanded = !allExpanded;
    accordions.forEach(acc => {
      acc.classList.toggle("is-open", allExpanded);
      acc.querySelector(".phase-accordion-header")?.setAttribute("aria-expanded", allExpanded ? "true" : "false");
    });
    toggleBtn.textContent = allExpanded ? "▴ Collapse All Phases" : "▾ Expand All Phases";
  });

  container.querySelector("#btn-open-contacts")?.addEventListener("click", () => {
    window.location.hash = "#contacts";
  });

  parent.append(container);
}

/* ========================================================================= */
/* 7. NIKAH RSVP & GIFT REGISTRY VIEW (TAB 3)                                */
/* ========================================================================= */
function rsvpView(parent) {
  const container = make("div", "rsvp-section-wrap");

  // 1. Ceremony Banner
  const banner = make("div", "rsvp-banner-card");
  banner.innerHTML = `
    <span class="rsvp-badge-pill">Akad Nikah · 27 Mac 2027</span>
    <h2 class="rsvp-banner-title">${t("rsvpTitle")}</h2>
    <p class="rsvp-banner-sub">${t("rsvpDesc")}</p>
    <div class="rsvp-facts-grid">
      <div class="rsvp-fact-box">
        <div class="rsvp-fact-label">Tarikh &amp; Hari</div>
        <div class="rsvp-fact-val">Sabtu, 27/03/2027</div>
      </div>
      <div class="rsvp-fact-box">
        <div class="rsvp-fact-label">Masa Majlis</div>
        <div class="rsvp-fact-val">9:00 AM – 1:00 PM (Akad 10:05 AM)</div>
      </div>
      <div class="rsvp-fact-box">
        <div class="rsvp-fact-label">Lokasi Masjid</div>
        <div class="rsvp-fact-val">Masjid Raja Haji Fi Sabilillah</div>
      </div>
      <div class="rsvp-fact-box">
        <div class="rsvp-fact-label">Had Kapasiti Dewan</div>
        <div class="rsvp-fact-val" style="color: #15803D;">Maksimum &le; 200 Pax</div>
      </div>
    </div>
  `;
  container.append(banner);

  // 2. RSVP Form Card
  const formCard = make("div", "rsvp-form-card");
  const existingRsvpStr = localStorage.getItem("soyarin_nikah_rsvp");
  let existingRsvp = null;
  try {
    if (existingRsvpStr) existingRsvp = JSON.parse(existingRsvpStr);
  } catch (e) {}

  if (existingRsvp) {
    formCard.innerHTML = `
      <div style="text-align: center; padding: 12px 0;">
        <div style="font-size: 40px; margin-bottom: 8px;">✅</div>
        <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--burgundy); margin: 0 0 6px 0;">
          ${t("submitSuccess")}
        </h3>
        <p style="font-size: 13px; color: var(--charcoal-muted); margin: 0 0 16px 0;">
          Pengesahan kehadiran telah direkodkan atas nama: <strong>${existingRsvp.name}</strong> (${existingRsvp.attending === "Tidak Hadir" ? "Tidak Hadir" : existingRsvp.pax + " Pax"}).
        </p>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Akad+Nikah+Sayed+%26+Shamira&dates=20270327T010000Z/20270327T050000Z&details=Majlis+Akad+Nikah+Sayed+Arif+Hakimi+%26+Nor+Shamira+Irwani&location=Masjid+Raja+Haji+Fi+Sabilillah+Cyberjaya" target="_blank" rel="noopener noreferrer" class="hero-cta-btn tentative-cta-btn">
            📅 Tambah ke Google Calendar
          </a>
          <button type="button" class="btn-copy-acc" id="btn-edit-rsvp" style="padding: 10px 16px;">
            ✏️ Kemaskini Semula RSVP
          </button>
        </div>
      </div>
    `;
    formCard.querySelector("#btn-edit-rsvp")?.addEventListener("click", () => {
      localStorage.removeItem("soyarin_nikah_rsvp");
      rsvpView(parent);
    });
  } else {
    formCard.innerHTML = `
      <form id="nikah-rsvp-form">
        <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 16px 0; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          Borang Pengesahan Kehadiran Tetamu
        </h3>

        <div class="rsvp-form-group">
          <label class="rsvp-form-label" for="rsvp-name">${t("nameLabel")} *</label>
          <input type="text" class="rsvp-form-input" id="rsvp-name" required placeholder="${t("namePlaceholder")}">
        </div>

        <div class="rsvp-form-group">
          <label class="rsvp-form-label" for="rsvp-phone">${t("phoneLabel")} *</label>
          <input type="tel" class="rsvp-form-input" id="rsvp-phone" required placeholder="${t("phonePlaceholder")}">
        </div>

        <div class="rsvp-form-group">
          <label class="rsvp-form-label">${t("attendingLabel")} *</label>
          <div class="attendance-radio-group">
            <div class="attendance-card-opt is-selected" id="opt-attending-yes" data-val="yes">
              <div class="attendance-radio-circle">✓</div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--charcoal);">${t("attendingYes")}</div>
                <div style="font-size: 11px; color: var(--charcoal-muted);">Akan hadir meraikan di masjid</div>
              </div>
            </div>
            <div class="attendance-card-opt is-regret" id="opt-attending-no" data-val="no">
              <div class="attendance-radio-circle">✗</div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--charcoal);">${t("attendingNo")}</div>
                <div style="font-size: 11px; color: var(--charcoal-muted);">Titipkan doa dari kejauhan</div>
              </div>
            </div>
          </div>
        </div>

        <div class="rsvp-form-group" id="headcount-section">
          <label class="rsvp-form-label">${t("totalPaxLabel")} (Maksimum 4 Pax / Jemputan) *</label>
          <div class="pax-breakdown-row">
            <div>
              <label style="font-size: 11px; color: var(--charcoal-muted); display: block; margin-bottom: 4px;">${t("adultsLabel")}</label>
              <select class="rsvp-form-select" id="rsvp-adults">
                <option value="1">1 Dewasa</option>
                <option value="2" selected>2 Dewasa</option>
                <option value="3">3 Dewasa</option>
                <option value="4">4 Dewasa</option>
              </select>
            </div>
            <div>
              <label style="font-size: 11px; color: var(--charcoal-muted); display: block; margin-bottom: 4px;">${t("kidsLabel")}</label>
              <select class="rsvp-form-select" id="rsvp-kids">
                <option value="0" selected>0 Kanak-kanak</option>
                <option value="1">1 Kanak-kanak</option>
                <option value="2">2 Kanak-kanak</option>
                <option value="3">3 Kanak-kanak</option>
              </select>
            </div>
          </div>
          <div class="pax-total-banner">
            <span>Jumlah Kerusi &amp; Makanan Diperlukan:</span>
            <strong id="rsvp-total-display">2 Pax</strong>
          </div>
        </div>

        <div class="rsvp-form-group">
          <label class="rsvp-form-label" for="rsvp-msg">${t("messageLabel")}</label>
          <textarea class="rsvp-form-textarea" id="rsvp-msg" rows="3" placeholder="${t("messagePlaceholder")}"></textarea>
        </div>

        <div id="rsvp-status-alert" style="display: none; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 12px; font-weight: 600;"></div>

        <button type="submit" class="rsvp-submit-btn" id="btn-submit-rsvp">
          ${t("submitBtn")}
        </button>
      </form>
    `;

    // Interactive logic
    let currentAttending = "yes";
    const optYes = formCard.querySelector("#opt-attending-yes");
    const optNo = formCard.querySelector("#opt-attending-no");
    const headcountSection = formCard.querySelector("#headcount-section");
    const adultsSelect = formCard.querySelector("#rsvp-adults");
    const kidsSelect = formCard.querySelector("#rsvp-kids");
    const totalDisplay = formCard.querySelector("#rsvp-total-display");

    function updateTotal() {
      const adults = parseInt(adultsSelect.value, 10) || 1;
      const kids = parseInt(kidsSelect.value, 10) || 0;
      const total = adults + kids;
      totalDisplay.textContent = `${total} Pax`;
    }

    optYes?.addEventListener("click", () => {
      currentAttending = "yes";
      optYes.classList.add("is-selected");
      optNo.classList.remove("is-selected");
      headcountSection.style.display = "block";
    });

    optNo?.addEventListener("click", () => {
      currentAttending = "no";
      optNo.classList.add("is-selected");
      optYes.classList.remove("is-selected");
      headcountSection.style.display = "none";
    });

    adultsSelect?.addEventListener("change", updateTotal);
    kidsSelect?.addEventListener("change", updateTotal);

    const form = formCard.querySelector("#nikah-rsvp-form");
    form?.addEventListener("submit", async e => {
      e.preventDefault();
      const submitBtn = formCard.querySelector("#btn-submit-rsvp");
      const alertBox = formCard.querySelector("#rsvp-status-alert");
      const name = formCard.querySelector("#rsvp-name").value.trim();
      const phone = formCard.querySelector("#rsvp-phone").value.trim();
      const message = formCard.querySelector("#rsvp-msg").value.trim();
      const adults = currentAttending === "yes" ? parseInt(adultsSelect.value, 10) : 0;
      const kids = currentAttending === "yes" ? parseInt(kidsSelect.value, 10) : 0;
      const totalPax = adults + kids;

      if (!name || !phone) return;

      submitBtn.disabled = true;
      submitBtn.textContent = t("submitting");

      const payload = {
        name,
        phone,
        event: "Nikah",
        adults,
        kids,
        total_pax: totalPax,
        attending: currentAttending === "yes" ? "Hadir" : "Tidak Hadir",
        message
      };

      try {
        // Post to server if available
        await fetch("/api/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});

        // Save to local storage
        localStorage.setItem("soyarin_nikah_rsvp", JSON.stringify({
          name,
          phone,
          attending: payload.attending,
          pax: totalPax,
          submittedAt: new Date().toISOString()
        }));

        alertBox.style.display = "block";
        alertBox.style.background = "rgba(21, 128, 61, 0.1)";
        alertBox.style.color = "#15803D";
        alertBox.textContent = "✓ " + t("submitSuccess");

        setTimeout(() => {
          rsvpView(parent);
        }, 1200);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = t("submitBtn");
      }
    });
  }
  container.append(formCard);

  // 3. Duit Salam Kaut (Bank QR Card)
  const salamCard = make("div", "salam-kaut-card");
  salamCard.innerHTML = `
    <div class="salam-qr-box">
      <img src="./qr/qr-duitnow.svg" alt="Maybank DuitNow QR" class="salam-qr-img">
      <div style="font-size: 11px; font-weight: 800; color: #15803D; margin-top: 6px;">
        MAYBANK DUITNOW QR
      </div>
    </div>
    <div class="bank-details-box">
      <span class="bank-name-pill">MAYBANK · DUIT SALAM KAUT</span>
      <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--burgundy); margin: 4px 0 0 0;">
        ${t("salamKautTitle")}
      </h3>
      <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0 0 6px 0; line-height: 1.5;">
        ${t("salamKautDesc")}
      </p>
      <div class="acc-num-row">
        <span style="font-size: 12px; color: var(--charcoal-muted);">No. Akaun:</span>
        <span class="acc-num-text" id="acc-num-text">162834241920</span>
        <button type="button" class="btn-copy-acc" id="btn-copy-maybank">📋 Salin Akaun</button>
      </div>
      <div style="font-size: 11px; color: var(--charcoal-muted);">
        Pemegang: <strong>Sayed Arif Hakimi bin Sayed Ahmad</strong>
      </div>
      <a href="https://wa.me/60183767437?text=Salam%20Sayed%20%26%20Shamira%2C%20saya%20telah%20menghantar%20Duit%20Salam%20Kaut%20tanda%20ingatan%20berkat%20perkahwinan." target="_blank" rel="noopener noreferrer" class="btn-wa-salam">
        <span>💬</span> <span>WhatsApp Resit / Notifikasi ke Soya</span>
      </a>
    </div>
  `;
  salamCard.querySelector("#btn-copy-maybank")?.addEventListener("click", () => {
    navigator.clipboard?.writeText("162834241920");
    const btn = salamCard.querySelector("#btn-copy-maybank");
    if (btn) {
      const orig = btn.textContent;
      btn.textContent = "✓ Disalin!";
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  });
  container.append(salamCard);

  // 4. Gift Registry Cards (Hajat & Hadiah)
  const registryCard = make("div", "rsvp-form-card");
  registryCard.innerHTML = `
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 14px;">
      <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 4px 0;">
        🎁 ${t("registryTitle")}
      </h3>
      <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
        ${t("registryDesc")}
      </p>
    </div>
    <div class="registry-grid" id="registry-grid-mount"></div>

    <!-- Custom Gift Gesture Box -->
    <div class="custom-gift-box">
      <h4 style="font-size: 13px; font-weight: 700; color: var(--charcoal); margin: 0 0 6px 0;">
        ✨ ${t("customGiftTitle")}
      </h4>
      <p style="font-size: 11px; color: var(--charcoal-muted); margin: 0 0 10px 0;">
        Sebarang hadiah atau barangan di luar senarai amat kami hargai dengan penuh kesyukuran.
      </p>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <input type="text" class="rsvp-form-input" id="custom-gift-input" placeholder="${t("customGiftPlaceholder")}" style="flex: 1; min-width: 200px;">
        <button type="button" class="btn-select-gift" id="btn-submit-custom-gift" style="width: auto; padding: 10px 18px;">
          ${t("customGiftBtn")}
        </button>
      </div>
      <div id="custom-gift-status" style="display: none; font-size: 11px; font-weight: 700; color: #15803D; margin-top: 6px;"></div>
    </div>
  `;

  const defaultGifts = [
    { id: "gift-1", name: "Air Fryer / Smart Oven", category: "Kitchenware" },
    { id: "gift-2", name: "Espresso Barista Coffee Machine", category: "Kitchenware" },
    { id: "gift-3", name: "Robot Vacuum Cleaner / Cordless Vacuum", category: "Home Essentials" },
    { id: "gift-4", name: "Luxury Cotton Bedding & King Comforter Set", category: "Bedroom" },
    { id: "gift-5", name: "Porcelain Dining Plate & Cutlery Set (16-pcs)", category: "Dining" },
    { id: "gift-6", name: "Premium Sejadah & Telekung Set for Couple", category: "Spiritual" }
  ];

  const gridMount = registryCard.querySelector("#registry-grid-mount");
  gridMount.innerHTML = defaultGifts.map(g => {
    const giftCount = parseInt(localStorage.getItem(`gift_count_${g.id}`) || "0", 10);
    return `
      <div class="registry-card" data-id="${g.id}">
        <div>
          <span class="registry-card-cat">${g.category}</span>
          <h4 class="registry-card-title">${g.name}</h4>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 8px;">
          <span class="registry-card-count" id="count-${g.id}">${giftCount > 0 ? giftCount + ' Dihadiahkan' : 'Boleh Dipilih'}</span>
          <button type="button" class="btn-select-gift btn-gift-action" data-id="${g.id}" data-name="${g.name}">
            Hadiahkan 🎁
          </button>
        </div>
      </div>
    `;
  }).join("");

  registryCard.querySelectorAll(".btn-gift-action").forEach(btn => {
    btn.addEventListener("click", () => {
      const gid = btn.dataset.id;
      const gname = btn.dataset.name;
      openDetailModal(`Pilih Hadiah: ${gname}`, `
        <div style="font-size: 13px; color: var(--charcoal); margin-bottom: 12px;">
          Terima kasih atas kebaikan hati anda memilih untuk menghadiahkan <strong>${gname}</strong>. Sila masukkan nama anda untuk rekod ingatan kami:
        </div>
        <div style="margin-bottom: 12px;">
          <input type="text" class="rsvp-form-input" id="modal-giver-name" placeholder="Nama anda / keluarga" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn-select-gift" id="modal-confirm-gift" style="width: auto; background: var(--burgundy); color: #fff;">
            Sahkan Hadiah Ini 🎁
          </button>
        </div>
      `);
      document.getElementById("modal-confirm-gift")?.addEventListener("click", async () => {
        const giver = document.getElementById("modal-giver-name")?.value.trim() || "Hamba Allah";
        const cur = parseInt(localStorage.getItem(`gift_count_${gid}`) || "0", 10) + 1;
        localStorage.setItem(`gift_count_${gid}`, String(cur));
        fetch("/api/registry/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ giftId: gid, name: giver })
        }).catch(() => {});
        closeDetailModal();
        const badge = registryCard.querySelector(`#count-${gid}`);
        if (badge) badge.textContent = `${cur} Dihadiahkan`;
      });
    });
  });

  registryCard.querySelector("#btn-submit-custom-gift")?.addEventListener("click", () => {
    const input = registryCard.querySelector("#custom-gift-input");
    const status = registryCard.querySelector("#custom-gift-status");
    const val = input.value.trim();
    if (!val) return;
    fetch("/api/registry/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customName: val, name: "Tetamu Jemputan" })
    }).catch(() => {});
    input.value = "";
    status.style.display = "block";
    status.textContent = `✓ Cadangan '${val}' telah berjaya dihantar. Terima kasih!`;
  });

  container.append(registryCard);

  // 5. Public Wishes Wall (Titipan Doa)
  const wishesCard = make("div", "rsvp-form-card");
  wishesCard.innerHTML = `
    <div style="border-bottom: 1px solid var(--border); padding-bottom: 12px; margin-bottom: 14px;">
      <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 4px 0;">
        💬 ${t("wishesTitle")}
      </h3>
      <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
        Koleksi ucapan manis dan doa restu daripada keluarga serta sahabat handai.
      </p>
    </div>
    <div class="wishes-wall-grid" id="wishes-wall-mount"></div>
  `;

  const initialWishes = [
    { name: "Achin (Bapa Saudara)", msg: "Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fi khair. Moga ikatan pernikahan kekal hingga ke jannah.", date: "10 Nov 2026" },
    { name: "Cik Jah & Keluarga", msg: "Tahniah Soya & Ira! Selamat menempuh alam rumahtangga yang penuh barakah.", date: "09 Nov 2026" },
    { name: "Angah & Along", msg: "Semoga dipermudahkan segala urusan akad nikah & kenduri nanti. Tahniah adik berdua!", date: "08 Nov 2026" }
  ];

  const wishesMount = wishesCard.querySelector("#wishes-wall-mount");
  wishesMount.innerHTML = initialWishes.map(w => `
    <div class="wish-bubble">
      <div>
        <div class="wish-bubble-author">${w.name}</div>
        <div class="wish-bubble-text">"${w.msg}"</div>
      </div>
      <div class="wish-bubble-date">📅 ${w.date}</div>
    </div>
  `).join("");

  container.append(wishesCard);
  parent.replaceChildren(container);
}

/* ========================================================================= */
/* 8. CONTACTS & VENDOR DIRECTORY VIEW (TAB 4)                               */
/* ========================================================================= */
function contactsView(parent, isStandaloneTab = true) {
  const container = make("div", "contacts-directory-wrap");

  const header = make("div", "tentative-header-bar");
  header.innerHTML = `
    <div>
      <h2 style="font-family: var(--font-serif); font-size: 20px; color: var(--burgundy); margin: 0 0 4px 0;">
        📞 Wedding Key Contacts &amp; Vendor Directory
      </h2>
      <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
        Official phone numbers, WhatsApp links and location coordinates for family leads, venues and creative vendors.
      </p>
    </div>
  `;
  container.append(header);

  const groups = [
    { key: "family", label: "Family Principals &amp; Couple (4)" },
    { key: "venue", label: "Venues &amp; Officials (3)" },
    { key: "vendor", label: "Media &amp; Creative Vendors (3)" }
  ];

  for (const g of groups) {
    const groupCard = make("div", "coordinator-card");
    groupCard.style.marginTop = "16px";

    const titleEl = make("h3", "", "");
    titleEl.style.fontSize = "14px";
    titleEl.style.fontWeight = "800";
    titleEl.style.color = "var(--charcoal)";
    titleEl.style.margin = "0 0 12px 0";
    titleEl.innerHTML = g.label;
    groupCard.append(titleEl);

    const grid = make("div", "coordinators-grid");
    const list = APPROVED_COORDINATORS.filter(c => c.category === g.key);

    for (const c of list) {
      const card = make("div", "coord-item-card");
      let actionButtons = "";
      if (c.phoneB64) {
        actionButtons += `
          <button type="button" onclick="callB64('${c.phoneB64}')" class="contact-btn btn-call" title="Call ${c.name}">
            📞 Call
          </button>
          <button type="button" onclick="openWaB64('${c.phoneB64}')" class="contact-btn btn-wa" title="WhatsApp ${c.name}">
            💬 WhatsApp
          </button>
        `;
      }
      if (c.mapsUrl) {
        actionButtons += `<a href="${c.mapsUrl}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>`;
      }
      if (c.wazeUrl) {
        actionButtons += `<a href="${c.wazeUrl}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>`;
      }
      if (c.socialUrl) {
        actionButtons += `<a href="${c.socialUrl}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-social" style="background: rgba(196,69,105,0.08); color: var(--burgundy);">📸 ${c.socialHandle || 'Instagram'}</a>`;
      }

      card.innerHTML = `
        <div class="coord-card-head">
          <span class="coord-avatar">${c.avatar}</span>
          <div>
            <div class="coord-role-tag">${c.role}</div>
            <h4 class="coord-name-text">${c.name}</h4>
          </div>
        </div>
        <p class="coord-desc-text">${c.desc}</p>
        <div class="coord-actions-wrap">
          ${actionButtons}
        </div>
      `;
      grid.append(card);
    }

    groupCard.append(grid);
    container.append(groupCard);
  }

  parent.append(container);
}

/* ========================================================================= */
/* 9. ROUTING & RENDER ENGINE                                                */
/* ========================================================================= */
function render() {
  const content = $("content");
  if (!content) return;
  content.replaceChildren();

  let target = location.hash.slice(1);
  if (!target || !GUEST_TABS[target]) target = "guest";

  renderNav();

  if (target === "tentative") {
    tentativeView(content);
  } else if (target === "contacts") {
    contactsView(content, true);
  } else if (target === "rsvp") {
    rsvpView(content);
  } else {
    guestView(content);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bindGuestFeatures() {
  // Floating WhatsApp Drawer
  const waBtn = $("btn-floating-wa");
  const waDrawer = $("floating-wa-drawer");
  if (waBtn && waDrawer) {
    waBtn.addEventListener("click", e => {
      e.stopPropagation();
      waDrawer.classList.toggle("is-open");
    });
    document.addEventListener("click", e => {
      if (!waDrawer.contains(e.target) && !waBtn.contains(e.target)) {
        waDrawer.classList.remove("is-open");
      }
    });
  }

  // Floating Music Player
  const musicBtn = $("btn-floating-music");
  const audioEl = $("ambient-audio");
  const musicIcon = $("music-icon");
  if (musicBtn && audioEl) {
    musicBtn.addEventListener("click", () => {
      if (audioEl.paused) {
        audioEl.play().then(() => {
          musicBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        }).catch(() => {
          // Audio autoplay block or file missing fallback
          musicBtn.classList.add("is-playing");
          if (musicIcon) musicIcon.textContent = "🔊";
        });
      } else {
        audioEl.pause();
        musicBtn.classList.remove("is-playing");
        if (musicIcon) musicIcon.textContent = "🎵";
      }
    });
  }

  // Language Toggle Button
  const langBtn = $("btn-lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      const cur = getActiveLanguage();
      const next = cur === "ms" ? "en" : "ms";
      setLanguage(next);
    });
  }
}

window.addEventListener("hashchange", render);
document.addEventListener("DOMContentLoaded", () => {
  render();
  applyTheme(getActiveThemePreference());
  bindThemeSwitcherEvents(document);
  bindThemeDropdown(document);
  bindGuestFeatures();
});
