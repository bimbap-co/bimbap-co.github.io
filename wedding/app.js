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

  // Update theme dropdown button icon and active menu item
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
        toggleBtn.focus();
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

if (window.matchMedia) {
  try {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (getActiveThemePreference() === "system") {
        applyTheme("system");
      }
    });
  } catch (e) {}
}

function createThemeSwitcherHtml(idPrefix = "nav") {
  const current = getActiveThemePreference();
  return `
    <div class="theme-switcher-group" role="group" aria-label="Theme mode switcher" id="${idPrefix}-theme-switcher">
      <button type="button" class="theme-switcher-btn ${current === 'light' ? 'is-active' : ''}" data-theme-val="light" title="Light theme" aria-label="Light mode" aria-pressed="${current === 'light'}">
        <span class="theme-icon">☀️</span>
        <span class="theme-label">Light</span>
      </button>
      <button type="button" class="theme-switcher-btn ${current === 'dark' ? 'is-active' : ''}" data-theme-val="dark" title="Dark theme" aria-label="Dark mode" aria-pressed="${current === 'dark'}">
        <span class="theme-icon">🌙</span>
        <span class="theme-label">Dark</span>
      </button>
      <button type="button" class="theme-switcher-btn ${current === 'system' ? 'is-active' : ''}" data-theme-val="system" title="Follow system theme" aria-label="System mode" aria-pressed="${current === 'system'}">
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
      if (val) setThemePreference(val);
    };
  });
}

// Anti-scraping telephone & WhatsApp handlers (decodes base64 on explicit click)
function openWaB64(enc) {
  try {
    const raw = atob(enc);
    window.open(`https://wa.me/${raw}`, "_blank", "noopener,noreferrer");
  } catch (e) {
    console.error("Failed to decode WhatsApp number", e);
  }
}

function callB64(enc) {
  try {
    const raw = atob(enc);
    window.location.href = `tel:${raw}`;
  } catch (e) {
    console.error("Failed to decode phone number", e);
  }
}

/* ========================================================================= */
/* 1. APPROVED PUBLIC EVENTS (ALLOWLISTED FIELDS ONLY)                       */
/* ========================================================================= */
const APPROVED_EVENTS = [
  {
    id: "tunang",
    phaseNum: "1. Tunang",
    date: "2026-12-27",
    dateFormatted: "Sunday, 27/12/2026",
    time: "10:00 AM – 1:00 PM",
    location: "Gastrohub, Nilai",
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
/* 2. APPROVED PUBLIC COORDINATORS & PIC DIRECTORY                           */
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
/* 3. POSTER DETAIL MODAL                                                    */
/* ========================================================================= */
const detailModal = $("detail-modal");
const detailTitle = $("detail-modal-title");
const detailBody = $("detail-modal-body");

function openDetailModal(title, htmlContent) {
  if (!detailModal) return;
  if (detailTitle) detailTitle.textContent = title;
  if (detailBody) detailBody.innerHTML = htmlContent;
  if (typeof detailModal.showModal === "function") {
    try {
      detailModal.showModal();
    } catch {
      detailModal.setAttribute("open", "");
    }
  } else {
    detailModal.setAttribute("open", "");
  }
}

function closeDetailModal() {
  if (!detailModal) return;
  if (typeof detailModal.close === "function") {
    try {
      detailModal.close();
    } catch {
      detailModal.removeAttribute("open");
    }
  } else {
    detailModal.removeAttribute("open");
  }
}

function openPosterModal(phaseName, posterSrc) {
  let cleanSrc = posterSrc;
  if (cleanSrc && cleanSrc.startsWith("/")) cleanSrc = "." + cleanSrc;
  openDetailModal(`${phaseName} · Official Tentative Programme Poster`, `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 12px; color: var(--charcoal-muted);">Approved official programme poster · #SAHdenganIra</span>
        <div style="display: flex; gap: 8px;">
          <a href="${cleanSrc}" target="_blank" rel="noopener noreferrer" class="quick-action-btn">Open in New Tab ↗</a>
          <a href="${cleanSrc}" download class="quick-action-btn" style="background: var(--burgundy); color: #fff;">⬇ Download</a>
        </div>
      </div>
      <div style="text-align: center; background: var(--bg-soft); border-radius: 12px; padding: 12px; border: 1px solid var(--border);">
        <img src="${cleanSrc}" alt="${phaseName} Tentative Programme" style="max-width: 100%; max-height: 70vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: inline-block;">
      </div>
    </div>
  `);
}

$("close-detail-modal")?.addEventListener("click", closeDetailModal);
detailModal?.addEventListener("click", event => {
  if (event.target === detailModal) closeDetailModal();
});

function openTunangSeatingModal() {
  openDetailModal("1. Tunang · Official Seating Plan & Floor Layout (30 Pax)", `
    <div class="seating-plan-wrapper">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>
          <div style="font-weight: 800; font-size: 15px; color: #881337;">Shamira Sayed Engagement Floor Plan</div>
          <div style="font-size: 12px; color: var(--charcoal-muted);">Sunday, 27/12/2026 · Gastrohub Restaurant and Event Space, Nilai · 30 Pax Capacity</div>
        </div>
        <div style="display: flex; gap: 8px;">
          <a href="./posters/tunang-seating-layout.jpg" target="_blank" rel="noopener noreferrer" class="quick-action-btn">Open Original Image ↗</a>
          <a href="./posters/tunang-seating-layout.jpg" download class="quick-action-btn" style="background: #166534; color: #fff;">⬇ Download Layout</a>
        </div>
      </div>

      <!-- Quick Metrics Ribbon -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px;">
        <div style="background: #FAFDF8; border: 1px solid #D1E7DD; border-left: 3px solid #166534; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 10px; font-weight: 800; color: #166534; letter-spacing: 0.5px;">TABLE 1: MAIN / VIP TABLE</div>
          <div style="font-size: 18px; font-weight: 800; color: #166534; margin: 2px 0;">14 Seats Total</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">7 Groom · 7 Bride · 6 Spokespersons (3G / 3B)</div>
        </div>
        <div style="background: #FDF4F8; border: 1px solid #FBCFE8; border-left: 3px solid #BE185D; border-radius: 8px; padding: 10px 12px;">
          <div style="font-size: 10px; font-weight: 800; color: #9D174D; letter-spacing: 0.5px;">TABLE 2: FAMILY &amp; ENTOURAGE</div>
          <div style="font-size: 18px; font-weight: 800; color: #BE185D; margin: 2px 0;">16 Seats Total</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">8 Groom (Siblings) · 8 Bride (Siblings &amp; Circle)</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">TOTAL CONFIRMED PAX</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--charcoal); margin: 2px 0;">30 Pax</div>
          <div style="font-size: 11px; color: #15803D; font-weight: 600;">✓ 15 Groom + 15 Bride (100% Balanced)</div>
        </div>
      </div>

      <!-- Two-Column Display: Schematic Diagram + Original Layout Image -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-bottom: 18px;">
        <!-- Left: Interactive CSS Architectural Schematic -->
        <div class="seating-hall-schematic" style="margin: 0; max-width: 100%;">
          <div class="schematic-header">
            <h4 class="schematic-title">Shamira Sayed Engagement Layout</h4>
            <div class="schematic-subtitle">Gastrohub Event House · Level 1 Hall Layout</div>
          </div>

          <!-- Top Perimeter: Buah Tangan, Pelamin, Speaker -->
          <div class="schematic-perimeter-top">
            <div class="schematic-buah-tangan" title="Exchange Gifts / Hantaran Trays Table">🎁 Buah Tangan</div>
            <div class="schematic-pelamin" title="Mini Dais / Pentas Pertunangan">🌸 Pelamin</div>
            <div class="schematic-speaker" title="Audio Sound & Emcee PA Station">🔊 Speaker</div>
          </div>

          <!-- Body: Left Wall, Tables in Center, Right Wall -->
          <div class="schematic-body-row">
            <!-- Left Wall with 2 AC units -->
            <div class="schematic-wall-left">
              <span class="schematic-ac-badge" title="Air Conditioner 1">❄️ AC</span>
              <span class="schematic-ac-badge" title="Air Conditioner 2">❄️ AC</span>
            </div>

            <!-- Center Tables Area -->
            <div class="schematic-tables-center">
              <!-- Table 1 (Main VIP: 14 seats, 7G vs 7B) -->
              <div class="schematic-table-card">
                <div class="schematic-table-title">Table 1 · VIP (14 Pax)</div>
                <div class="schematic-table-assembly">
                  <!-- Groom Side (7 chairs, middle 3 are G) -->
                  <div class="schematic-chair-column">
                    <span class="schematic-seat groom" title="Groom VIP: Mama (Mother of the Groom)">1</span>
                    <span class="schematic-seat groom" title="Groom VIP: Immediate Family">2</span>
                    <span class="schematic-seat groom spokesperson" title="Spokesperson G: Abah (Father of the Groom)">G</span>
                    <span class="schematic-seat groom spokesperson" title="Spokesperson G: Achin (Groom's Senior Spokesperson)">G</span>
                    <span class="schematic-seat groom spokesperson" title="Spokesperson G: Abang Shahrom (Groom's Family Lead)">G</span>
                    <span class="schematic-seat groom" title="Groom VIP: Pakcik (Uncle)">6</span>
                    <span class="schematic-seat groom" title="Groom VIP: Immediate Family">7</span>
                  </div>
                  <!-- Table Surface -->
                  <div class="schematic-table-plank" style="min-height: 230px;">
                    MEJA VIP
                  </div>
                  <!-- Bride Side (7 chairs, middle 3 are B) -->
                  <div class="schematic-chair-column">
                    <span class="schematic-seat bride" title="Bride VIP: Ibu (Mother of the Bride)">1</span>
                    <span class="schematic-seat bride" title="Bride VIP: Immediate Family">2</span>
                    <span class="schematic-seat bride spokesperson" title="Spokesperson B: Ayah (Father of the Bride)">B</span>
                    <span class="schematic-seat bride spokesperson" title="Spokesperson B: Uncle (Bride's Senior Spokesperson)">B</span>
                    <span class="schematic-seat bride spokesperson" title="Spokesperson B: Pak Ngah (Bride's Senior Spokesperson)">B</span>
                    <span class="schematic-seat bride" title="Bride VIP: Mak Ngah (Aunt)">6</span>
                    <span class="schematic-seat bride" title="Bride VIP: Immediate Family">7</span>
                  </div>
                </div>
              </div>

              <!-- Table 2 (Family & Extended: 16 seats, 8G vs 8B) -->
              <div class="schematic-table-card">
                <div class="schematic-table-title">Table 2 · Family (16 Pax)</div>
                <div class="schematic-table-assembly">
                  <!-- Groom Side (8 chairs) -->
                  <div class="schematic-chair-column">
                    <span class="schematic-seat groom" title="Groom Siblings: Along">1</span>
                    <span class="schematic-seat groom" title="Groom Siblings: Angah">2</span>
                    <span class="schematic-seat groom" title="Groom Siblings: Acik">3</span>
                    <span class="schematic-seat groom" title="Groom Siblings: 4th Sibling">4</span>
                    <span class="schematic-seat groom" title="Groom Siblings: 5th Sibling">5</span>
                    <span class="schematic-seat groom" title="Groom Family: Aunty Amy">6</span>
                    <span class="schematic-seat groom" title="Groom Family: Makcik">7</span>
                    <span class="schematic-seat groom" title="Groom Extended: Raisya & Rizqi">8</span>
                  </div>
                  <!-- Table Surface -->
                  <div class="schematic-table-plank" style="min-height: 260px;">
                    MEJA KELUARGA
                  </div>
                  <!-- Bride Side (8 chairs) -->
                  <div class="schematic-chair-column">
                    <span class="schematic-seat bride" title="Bride Siblings: 1st Sibling">1</span>
                    <span class="schematic-seat bride" title="Bride Siblings: 2nd Sibling">2</span>
                    <span class="schematic-seat bride" title="Bride Siblings: 3rd Sibling">3</span>
                    <span class="schematic-seat bride" title="Bride Circle: Kak Elaine">4</span>
                    <span class="schematic-seat bride" title="Bride Circle: Sherly">5</span>
                    <span class="schematic-seat bride" title="Bride Circle: Syasya">6</span>
                    <span class="schematic-seat bride" title="Bride Circle: Kak Mija">7</span>
                    <span class="schematic-seat bride" title="Bride Family: Abang Lukman (Marsya/Farisya/Wahida)">8</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Wall with Kain Rentang, AC, and Entrance Door -->
            <div class="schematic-wall-right">
              <span class="schematic-kain-rentang" title="Engagement Banner Backdrop">KAIN RENTANG</span>
              <span class="schematic-ac-badge" style="margin: 8px 0;" title="Air Conditioner 3">❄️ AC</span>
              <div class="schematic-entrance-door" title="Main Entrance Doorway">🚪 Pintu Masuk</div>
              <span class="schematic-ac-badge" style="margin-top: 8px;" title="Air Conditioner 4">❄️ AC</span>
            </div>
          </div>

          <!-- Bottom: Buffet Line -->
          <div class="schematic-buffet" title="Full catering lunch station spanning rear wall">
            🍽️ Buffet Line (Lunch Catering Station)
          </div>

          <!-- Legend Strip -->
          <div class="schematic-legend-strip">
            <span class="schematic-legend-item">
              <span class="schematic-seat groom spokesperson" style="width: 22px; height: 22px; font-size: 10px;">G</span>
              <span>G: Groom Spokespersons (3)</span>
            </span>
            <span class="schematic-legend-item">
              <span class="schematic-seat bride spokesperson" style="width: 22px; height: 22px; font-size: 10px;">B</span>
              <span>B: Bride Spokespersons (3)</span>
            </span>
            <span class="schematic-legend-item">
              <span class="schematic-seat groom" style="width: 20px; height: 20px; font-size: 9px;">●</span>
              <span>Groom Entourage (15 Total)</span>
            </span>
            <span class="schematic-legend-item">
              <span class="schematic-seat bride" style="width: 20px; height: 20px; font-size: 9px;">●</span>
              <span>Bride Entourage (15 Total)</span>
            </span>
          </div>
        </div>

        <!-- Right: Official Hand-Drawn Schematic Visual -->
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-radius: 14px; padding: 14px; text-align: center; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="font-weight: 700; font-size: 13px; color: var(--charcoal); margin-bottom: 6px;">Official Floor Plan Reference</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-bottom: 12px;">Submitted blueprint diagram for Gastrohub Event House</div>
            <a href="./posters/tunang-seating-layout.jpg" target="_blank" rel="noopener noreferrer">
              <img src="./posters/tunang-seating-layout.jpg" alt="Official Tunang Seating Layout Blueprint" style="max-width: 100%; max-height: 480px; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.12); cursor: pointer;" title="Click to view full image in high resolution">
            </a>
          </div>
          <div style="margin-top: 12px; font-size: 11px; color: var(--charcoal-muted);">
            Tip: Click the image to view or inspect the original high-resolution blueprint in a new browser tab.
          </div>
        </div>
      </div>

      <!-- Detailed Table-by-Table Attendee Breakdown -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
        <!-- Table 1 Detail Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid #166534; border-radius: 10px; padding: 14px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #166534;">Table 1 · Main / VIP Table (14 Pax)</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Front Long Table · Closer to Pelamin &amp; Buah Tangan</div>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: #166534; background: #DCFCE7; padding: 2px 8px; border-radius: 4px;">6 Spokespersons</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <!-- Groom Side (7 Pax) -->
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #166534; margin-bottom: 6px; border-bottom: 1px solid #DCFCE7; padding-bottom: 3px;">
                👨‍💼 Groom VIPs (7 Seats)
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 11.5px; line-height: 1.6; color: #14532D;">
                <li>Seat 1: Mama (Mother of Groom)</li>
                <li>Seat 2: Immediate Family</li>
                <li><strong style="color: #047857; background: #D1FAE5; padding: 1px 4px; border-radius: 3px;">[G] Seat 3: Abah</strong> (Father)</li>
                <li><strong style="color: #047857; background: #D1FAE5; padding: 1px 4px; border-radius: 3px;">[G] Seat 4: Achin</strong> (Spokesperson)</li>
                <li><strong style="color: #047857; background: #D1FAE5; padding: 1px 4px; border-radius: 3px;">[G] Seat 5: Abang Shahrom</strong> (Lead)</li>
                <li>Seat 6: Pakcik (Uncle)</li>
                <li>Seat 7: Immediate Family</li>
              </ul>
            </div>

            <!-- Bride Side (7 Pax) -->
            <div style="background: #FDF2F8; border: 1px solid #FBCFE8; border-radius: 6px; padding: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #9D174D; margin-bottom: 6px; border-bottom: 1px solid #FCE7F3; padding-bottom: 3px;">
                👰‍♀️ Bride VIPs (7 Seats)
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 11.5px; line-height: 1.6; color: #831843;">
                <li>Seat 1: Ibu (Mother of Bride)</li>
                <li>Seat 2: Immediate Family</li>
                <li><strong style="color: #BE185D; background: #FCE7F3; padding: 1px 4px; border-radius: 3px;">[B] Seat 3: Ayah</strong> (Father)</li>
                <li><strong style="color: #BE185D; background: #FCE7F3; padding: 1px 4px; border-radius: 3px;">[B] Seat 4: Uncle</strong> (Spokesperson)</li>
                <li><strong style="color: #BE185D; background: #FCE7F3; padding: 1px 4px; border-radius: 3px;">[B] Seat 5: Pak Ngah</strong> (Spokesperson)</li>
                <li>Seat 6: Mak Ngah (Aunt)</li>
                <li>Seat 7: Immediate Family</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Table 2 Detail Card -->
        <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid #BE185D; border-radius: 10px; padding: 14px; box-shadow: var(--shadow-sm);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">
            <div>
              <div style="font-weight: 800; font-size: 14px; color: #BE185D;">Table 2 · Family &amp; Entourage Table (16 Pax)</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Side Long Table · Closer to Kain Rentang &amp; Entrance</div>
            </div>
            <span style="font-size: 11px; font-weight: 700; color: #BE185D; background: #FCE7F3; padding: 2px 8px; border-radius: 4px;">16 Seats</span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <!-- Groom Side (8 Pax) -->
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #166534; margin-bottom: 6px; border-bottom: 1px solid #DCFCE7; padding-bottom: 3px;">
                👨‍💼 Groom Family (8 Seats)
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 11.5px; line-height: 1.6; color: #14532D;">
                <li>Seat 1: Sibling Along</li>
                <li>Seat 2: Sibling Angah</li>
                <li>Seat 3: Sibling Acik</li>
                <li>Seat 4: Sibling (4th)</li>
                <li>Seat 5: Sibling (5th)</li>
                <li>Seat 6: Aunty Amy</li>
                <li>Seat 7: Makcik</li>
                <li>Seat 8: Raisya &amp; Rizqi</li>
              </ul>
            </div>

            <!-- Bride Side (8 Pax) -->
            <div style="background: #FDF2F8; border: 1px solid #FBCFE8; border-radius: 6px; padding: 8px;">
              <div style="font-size: 11px; font-weight: 800; color: #9D174D; margin-bottom: 6px; border-bottom: 1px solid #FCE7F3; padding-bottom: 3px;">
                👰‍♀️ Bride Family &amp; Friends (8 Seats)
              </div>
              <ul style="margin: 0; padding-left: 14px; font-size: 11.5px; line-height: 1.6; color: #831843;">
                <li>Seat 1: Sibling (1st)</li>
                <li>Seat 2: Sibling (2nd)</li>
                <li>Seat 3: Sibling (3rd)</li>
                <li>Seat 4: Kak Elaine</li>
                <li>Seat 5: Sherly</li>
                <li>Seat 6: Syasya</li>
                <li>Seat 7: Kak Mija</li>
                <li>Seat 8: Abang Lukman (Marsya/Farisya/Wahida)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `);
}


/* ========================================================================= */
/* 4. NAVIGATION TABS                                                        */
/* ========================================================================= */
const GUEST_TABS = {
  guest: ["Guest Menu", "🌸", "Official Wedding Guide"],
  tentative: ["Tentative", "📅", "Day Programmes & Posters"],
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
    const labelSpan = make("span", "label", label);
    a.append(iconSpan, labelSpan);
    centerTabs.append(a);
  }

  const rightAction = make("div", "nav-side-action");

  tabsInner.append(leftSpacer, centerTabs, rightAction);
  navBar.append(tabsInner);
  bindThemeSwitcherEvents(navBar);
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
        Dengan penuh kesyukuran dan kasih sayang, kami mengalu-alukan kehadiran keluarga serta para tetamu yang dirahmati ke lembaran bahagia kami.
      </p>
    </div>
  `;
  container.append(hero);

  // The Three Wedding Phases Grid
  const eventsGrid = make("div", "guest-event-grid");

  for (const ev of APPROVED_EVENTS) {
    const card = make("article", "guest-event-card");
    const chipClass = `phase-chip-${ev.id}`;
    card.innerHTML = `
      <div class="guest-event-eyebrow">
        <span class="${chipClass}">${ev.phaseNum}</span>
        <span>${ev.dateFormatted}</span>
      </div>
      <div>
        <div class="guest-countdown-badge">
          <span>${daysUntil(ev.date)}</span>
          <span class="guest-countdown-label">Days to go</span>
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
        <a href="${ev.mapsUrl}" target="_blank" rel="noopener noreferrer" class="guest-btn">📍 Google Maps</a>
        <a href="${ev.wazeUrl}" target="_blank" rel="noopener noreferrer" class="guest-btn">🧭 Waze</a>
        <button type="button" class="guest-btn guest-btn-primary" data-poster="${ev.id}">🖼️ View Poster</button>
      </div>
    `;
    eventsGrid.append(card);
  }
  container.append(eventsGrid);

  // Wire poster click events
  eventsGrid.querySelectorAll("button[data-poster]").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = btn.getAttribute("data-poster");
      const ev = APPROVED_EVENTS.find(e => e.id === pid);
      if (ev) openPosterModal(ev.phaseNum, ev.posterUrl);
    });
  });

  // Interactive Dress Code Palette (Colours Only)
  const dressSection = make("div", "coordinator-card");
  dressSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
      <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0;">
        🎨 Wedding Dress Code Guide
      </h3>
    </div>
    <div class="dress-code-grid">
      <div class="dress-card" style="border-left: 3px solid #588157;">
        <div class="dress-card-title">
          <span>1. Tunang</span>
          <span class="phase-chip-tunang">27/12/2026</span>
        </div>
        <div class="dress-swatch-row">
          <div class="dress-swatch" style="background: #F7FEE7; color: #3F6212;">
            <span class="swatch-circle" style="background: #588157;"></span>
            <span>Matcha</span>
          </div>
          <div class="dress-swatch" style="background: #FFF1F2; color: #9F1239;">
            <span class="swatch-circle" style="background: #F43F5E;"></span>
            <span>Strawberry</span>
          </div>
        </div>
      </div>

      <div class="dress-card" style="border-left: 3px solid #0EA5E9;">
        <div class="dress-card-title">
          <span>2. Nikah</span>
          <span class="phase-chip-nikah">27/03/2027</span>
        </div>
        <div class="dress-swatch-row">
          <div class="dress-swatch" style="background: #EFF6FF; color: #1E40AF;">
            <span class="swatch-circle" style="background: #1E3A8A;"></span>
            <span>Navy</span>
          </div>
          <div class="dress-swatch" style="background: #EFF6FF; color: #1E40AF;">
            <span class="swatch-circle" style="background: #3B82F6;"></span>
            <span>Royal Blue</span>
          </div>
          <div class="dress-swatch" style="background: #EFF6FF; color: #1E40AF;">
            <span class="swatch-circle" style="background: #93C5FD;"></span>
            <span>Sky Blue</span>
          </div>
        </div>
      </div>

      <div class="dress-card" style="border-left: 3px solid #9333EA;">
        <div class="dress-card-title">
          <span>3. Sanding</span>
          <span class="phase-chip-sanding">27/11/2027</span>
        </div>
        <div class="dress-swatch-row">
          <div class="dress-swatch" style="background: #FAF5FF; color: #6B21A8;">
            <span class="swatch-circle" style="background: #581C87;"></span>
            <span>Deep Purple</span>
          </div>
          <div class="dress-swatch" style="background: #FAF5FF; color: #6B21A8;">
            <span class="swatch-circle" style="background: #8B5CF6;"></span>
            <span>Lilac</span>
          </div>
          <div class="dress-swatch" style="background: #FAF5FF; color: #6B21A8;">
            <span class="swatch-circle" style="background: #E9D5FF;"></span>
            <span>Lavender</span>
          </div>
        </div>
      </div>
    </div>
  `;
  container.append(dressSection);

  parent.append(container);
}

/* ========================================================================= */
/* 6. TENTATIVES VIEW (TAB 2)                                                */
/* ========================================================================= */
function tentativeView(parent) {
  const container = make("div", "tentative-wrap");

  container.innerHTML = `
    <div class="tentative-header-bar">
      <div>
        <h2 class="section-title">Tentative Event Schedules &amp; Facts</h2>
        <p class="section-caption">Approved working programmes, official posters, venue locations, dress codes, and vendor contacts for all 3 phases.</p>
      </div>
      <div style="display: flex; gap: 8px;">
        <button type="button" class="quick-action-btn" id="btn-open-contacts-top">📞 Contacts Directory</button>
        <button type="button" class="quick-action-btn" id="toggle-all-accordions-btn">▾ Expand All Phases</button>
      </div>
    </div>

    <!-- PHASE 1: TUNANG -->
    <div class="phase-accordion is-open" id="accordion-phase-1">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="true">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: #588157;">P1</span>
          <div>
            <h3 class="phase-accordion-heading">1. Tunang</h3>
            <div class="phase-accordion-sub">Sunday, 27/12/2026 · 10:00 AM–1:00 PM · Gastrohub, Nilai</div>
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
            <div class="tentative-info-val">Gastrohub Restaurant and Event Space</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Persiaran Korporat, Bandar Baru Nilai, 71800 Nilai, Negeri Sembilan</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag matcha"><span class="dot"></span> Matcha (Groom)</span>
              <span class="dresscode-tag strawberry"><span class="dot"></span> Strawberry (Bride)</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Baju Melayu &amp; Baju Kurung Moden</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE PIC &amp; CONTACT</div>
            <div class="tentative-info-val">En. Izz (Gastrohub)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <button type="button" onclick="callB64('NjAxMzU1OTkwMzI=')" class="contact-btn btn-call" style="cursor: pointer;">📞 013-5599032</button>
              <button type="button" onclick="openWaB64('NjAxMzU1OTkwMzI=')" class="contact-btn btn-wa" style="cursor: pointer;">💬 WhatsApp</button>
            </div>
          </div>
        </div>

        <!-- Dual Visual Showcase: Both Official Poster & Seating Blueprint Displayed Directly -->
        <div class="tunang-visual-showcase" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 16px; margin: 18px 0 16px;">
          
          <!-- 1. Official Programme Poster Card -->
          <div class="visual-panel-card" style="background: var(--bg-soft); border: 1px solid var(--border); border-top: 3px solid var(--burgundy); border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px; color: var(--burgundy); font-family: var(--font-serif);">🖼️ Official Programme Poster</div>
                  <div style="font-size: 11.5px; color: var(--charcoal-muted); margin-top: 2px;">1. Tunang · Sunday, 27/12/2026 · Gastrohub, Nilai</div>
                </div>
                <span class="phase-chip-tunang" style="font-size: 10.5px; padding: 3px 8px;">Aturcara</span>
              </div>
              <div style="text-align: center; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px; border: 1px solid var(--border);">
                <img src="./posters/poster-tunang.jpg" alt="1. Tunang Official Programme Poster" id="thumb-poster-tunang-tab" style="width: 100%; max-height: 520px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.2s;" title="Click to zoom full-screen" loading="lazy">
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              <button type="button" class="quick-action-btn" id="btn-poster-tunang" style="flex: 1; justify-content: center; min-width: 130px;">🔍 View / Zoom Poster</button>
              <a href="./posters/poster-tunang.jpg" target="_blank" download class="quick-action-btn" style="flex: 1; justify-content: center; min-width: 130px;">⬇️ Download Poster</a>
            </div>
          </div>

          <!-- 2. Official Floor Plan & Seating Layout Card -->
          <div class="visual-panel-card" style="background: var(--bg-soft); border: 1px solid var(--border); border-top: 3px solid #16a34a; border-radius: 12px; padding: 14px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 10px;">
                <div>
                  <div style="font-weight: 700; font-size: 14px; color: var(--charcoal); font-family: var(--font-serif);"><span style="color: #16a34a;">🪑</span> Floor Plan &amp; Seating Layout</div>
                  <div style="font-size: 11.5px; color: var(--charcoal-muted); margin-top: 2px;">30 Pax · Table 1 (VIP 14-pax) &amp; Table 2 (Family 16-pax)</div>
                </div>
                <span style="background: rgba(22, 163, 74, 0.15); color: #16a34a; font-size: 10.5px; font-weight: 700; padding: 3px 8px; border-radius: 999px; border: 1px solid rgba(22, 163, 74, 0.25);">Level 1 Hall</span>
              </div>
              <div style="text-align: center; background: rgba(0,0,0,0.02); padding: 8px; border-radius: 8px; border: 1px solid var(--border);">
                <img src="./posters/tunang-seating-layout.jpg" alt="Tunang Seating Layout & Floor Plan" id="thumb-seating-tunang-tab" style="width: 100%; max-height: 520px; object-fit: contain; border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); cursor: pointer; transition: transform 0.2s;" title="Click to view interactive blueprint" loading="lazy">
              </div>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
              <button type="button" class="quick-action-btn" id="btn-seating-tunang" style="flex: 1; justify-content: center; min-width: 130px; background: #166534; color: #fff;">🪑 View Seating Blueprint</button>
              <a href="./posters/tunang-seating-layout.jpg" target="_blank" download class="quick-action-btn" style="flex: 1; justify-content: center; min-width: 130px;">⬇️ Download Layout</a>
            </div>
          </div>

        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
        </div>
      </div>
    </div>

    <!-- PHASE 2: AKAD NIKAH -->
    <div class="phase-accordion" id="accordion-phase-2" style="margin-top: 18px;">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: #0284C7;">P2</span>
          <div>
            <h3 class="phase-accordion-heading">2. Nikah</h3>
            <div class="phase-accordion-sub">Saturday, 27/03/2027 · 9:00 AM–1:00 PM · Masjid Raja Haji Fi Sabilillah, Cyberjaya</div>
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
              <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag blue"><span class="dot"></span> Shades of Blue (Both Families)</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Unified harmonious blue tones</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">MASJID PIC &amp; CONTACT</div>
            <div class="tentative-info-val">Ustaz Syahir (Masjid Raja Haji)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <button type="button" onclick="callB64('NjAxMzQ3Njc1MzU=')" class="contact-btn btn-call" style="cursor: pointer;">📞 +60 13-476 7535</button>
              <button type="button" onclick="openWaB64('NjAxMzQ3Njc1MzU=')" class="contact-btn btn-wa" style="cursor: pointer;">💬 WhatsApp</button>
            </div>
          </div>
        </div>

        <!-- Inline Poster Preview Card -->
        <div class="poster-preview-card" style="margin: 16px 0 10px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="./posters/poster-nikah.jpg" alt="2. Nikah Programme Poster" id="thumb-poster-nikah-tab" style="width: 58px; height: 78px; object-fit: cover; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); cursor: pointer;" title="Click to view full poster">
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--charcoal);">Official Programme Poster · 2. Nikah</div>
              <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Saturday, 27/03/2027 · Masjid Raja Haji Fi Sabilillah</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="quick-action-btn" id="btn-poster-nikah">🖼️ View / Zoom Poster</button>
            <a href="./posters/poster-nikah.jpg" target="_blank" download class="quick-action-btn">⬇️ Download Poster</a>
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

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
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
              <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
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

        <!-- Inline Poster Preview Card -->
        <div class="poster-preview-card" style="margin: 16px 0 10px; background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <img src="./posters/poster-sanding.jpg" alt="3. Sanding Programme Poster" id="thumb-poster-sanding-tab" style="width: 58px; height: 78px; object-fit: cover; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.12); cursor: pointer;" title="Click to view full poster">
            <div>
              <div style="font-weight: 700; font-size: 13px; color: var(--charcoal);">Official Programme Poster · 3. Sanding</div>
              <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Saturday, 27/11/2027 · Royale Palace Grand Ballroom</div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button type="button" class="quick-action-btn" id="btn-poster-sanding">🖼️ View / Zoom Poster</button>
            <a href="./posters/poster-sanding.jpg" target="_blank" download class="quick-action-btn">⬇️ Download Poster</a>
          </div>
        </div>

        <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin: 16px 0 8px 0;">Approved Itinerary (11:00 AM – 4:00 PM)</h4>
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
              <tr><td><span class="tentative-time-badge">11:00 AM</span></td><td><strong>Pembukaan Pintu Dewan &amp; Ketibaan Tetamu</strong></td><td>Urus Setia &amp; Sambutan</td><td>Foyer &amp; Ruang Legar Utama</td></tr>
              <tr style="background: rgba(107, 29, 47, 0.03);"><td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFF;">12:00 PM</span></td><td><strong style="color: var(--burgundy);">Pembukaan Buffet Jamuan Makan</strong></td><td>Katering Royale Palace</td><td>Bufet Sajian Hidangan Diraja</td></tr>
              <tr style="background: rgba(107, 29, 47, 0.03);"><td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFF;">12:30 PM</span></td><td><strong style="color: var(--burgundy);">Perarakan Masuk Pengantin (Grand Entrance)</strong></td><td>Pengantin &amp; Pengapit</td><td>Laluan Permaidani Merah ke Pelamin</td></tr>
              <tr><td><span class="tentative-time-badge">01:00 PM</span></td><td><strong>Upacara Makan Beradab &amp; Memotong Kek</strong></td><td>Pasangan &amp; Emcee</td><td>Meja Makan Beradab Diraja</td></tr>
              <tr><td><span class="tentative-time-badge">01:30 PM</span></td><td><strong>Sesi Salam Restu &amp; Fotografi</strong></td><td>Semua Tetamu Jemputan</td><td>Pentas Pelamin Utama</td></tr>
              <tr><td><span class="tentative-time-badge">04:00 PM</span></td><td><strong>Majlis Bersurai &amp; Pengedaran Goodies</strong></td><td>Keluarga &amp; Urus Setia</td><td>Pintu Keluar Utama Ballroom</td></tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
        </div>
      </div>
    </div>
  `;

  // Accordion Toggle Interactions (Always start collapsed on load / tab switch)
  const accordions = container.querySelectorAll(".phase-accordion");
  accordions.forEach(acc => {
    const head = acc.querySelector(".phase-accordion-header");
    head?.addEventListener("click", () => {
      acc.classList.toggle("is-open");
      const isOpen = acc.classList.contains("is-open");
      head.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });

  const toggleAllBtn = container.querySelector("#toggle-all-accordions-btn");
  if (toggleAllBtn) {
    let allExpanded = false;
    toggleAllBtn.addEventListener("click", () => {
      allExpanded = !allExpanded;
      accordions.forEach(acc => {
        if (allExpanded) {
          acc.classList.add("is-open");
          acc.querySelector(".phase-accordion-header")?.setAttribute("aria-expanded", "true");
        } else {
          acc.classList.remove("is-open");
          acc.querySelector(".phase-accordion-header")?.setAttribute("aria-expanded", "false");
        }
      });
      toggleAllBtn.textContent = allExpanded ? "▴ Collapse All Phases" : "▾ Expand All Phases";
    });
  }

  container.querySelector("#btn-open-contacts-top")?.addEventListener("click", () => {
    location.hash = "#contacts";
  });

  // Wire poster click events in Tentative tab
  container.querySelector("#btn-seating-tunang")?.addEventListener("click", openTunangSeatingModal);
  container.querySelector("#thumb-seating-tunang-tab")?.addEventListener("click", openTunangSeatingModal);
  container.querySelector("#btn-poster-tunang")?.addEventListener("click", () => {
    openPosterModal("1. Tunang", "./posters/poster-tunang.jpg");
  });
  container.querySelector("#thumb-poster-tunang-tab")?.addEventListener("click", () => {
    openPosterModal("1. Tunang", "./posters/poster-tunang.jpg");
  });
  container.querySelector("#btn-poster-nikah")?.addEventListener("click", () => {
    openPosterModal("2. Nikah", "./posters/poster-nikah.jpg");
  });
  container.querySelector("#thumb-poster-nikah-tab")?.addEventListener("click", () => {
    openPosterModal("2. Nikah", "./posters/poster-nikah.jpg");
  });
  container.querySelector("#btn-poster-sanding")?.addEventListener("click", () => {
    openPosterModal("3. Sanding", "./posters/poster-sanding.jpg");
  });
  container.querySelector("#thumb-poster-sanding-tab")?.addEventListener("click", () => {
    openPosterModal("3. Sanding", "./posters/poster-sanding.jpg");
  });

  parent.append(container);
}

/* ========================================================================= */
/* 7. CONTACTS DIRECTORY VIEW (TAB 3)                                        */
/* ========================================================================= */
function contactsView(parent, isStandaloneTab = true) {
  const container = make("div", isStandaloneTab ? "contacts-standalone-wrap" : "guest-contacts-section");

  if (isStandaloneTab) {
    const head = make("div", "section-head");
    head.style.marginBottom = "20px";
    head.innerHTML = `
      <div>
        <h2 style="font-family: var(--font-serif); font-size: 22px; color: var(--burgundy); margin: 0 0 4px 0;">
          📞 Official Wedding Coordinators &amp; PIC Directory
        </h2>
        <p style="font-size: 13px; color: var(--charcoal-muted); margin: 0;">
          Direct contact directory for family liaisons, venue operations, and ceremony logistics.
        </p>
      </div>
    `;
    container.append(head);
  } else {
    const divider = make("div");
    divider.style.marginTop = "24px";
    divider.style.marginBottom = "14px";
    divider.innerHTML = `
      <h3 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 4px 0;">
        📞 Event Coordinators &amp; Family Contacts
      </h3>
      <p style="font-size: 12px; color: var(--charcoal-muted); margin: 0;">
        Feel free to reach out to our event coordinators if you have any questions on the day.
      </p>
    `;
    container.append(divider);
  }

  const groups = {};
  for (const c of APPROVED_COORDINATORS) {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  }

  for (const [catName, members] of Object.entries(groups)) {
    const groupCard = make("div", "coordinator-card");
    groupCard.style.marginBottom = "16px";
    groupCard.innerHTML = `
      <div class="coordinator-category-title" style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--burgundy); letter-spacing: 0.5px; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">
        ${catName}
      </div>
      <div class="coordinator-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        ${members.map(m => `
          <div style="background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: baseline;">
                <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted);">${m.role}</span>
                <span>${m.icon || '👤'}</span>
              </div>
              <div style="font-size: 14px; font-weight: 700; color: var(--charcoal); margin: 4px 0 2px 0;">${m.name}</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">${m.note}</div>
            </div>
            <div style="display: flex; gap: 6px; margin-top: 10px;">
              <button type="button" onclick="callB64(btoa('${m.rawPhone}'))" class="contact-btn btn-call" style="flex: 1; text-align: center; padding: 6px 10px; font-size: 11px; cursor: pointer;">📞 Call</button>
              <button type="button" onclick="openWaB64(btoa('${m.rawPhone}'))" class="contact-btn btn-wa" style="flex: 1; text-align: center; padding: 6px 10px; font-size: 11px; cursor: pointer;">💬 WhatsApp</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;
    container.append(groupCard);
  }

  parent.append(container);
}

/* ========================================================================= */
/* 8. ROUTING & RENDER ENGINE                                                */
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
  } else {
    guestView(content);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("hashchange", render);
document.addEventListener("DOMContentLoaded", () => {
  render();
  applyTheme(getActiveThemePreference());
  bindThemeSwitcherEvents(document);
  bindThemeDropdown(document);
});
