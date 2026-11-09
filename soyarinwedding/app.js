const tabs = {
  overview: ["Overview", "❖", "Executive Cockpit", ""],
  checklist: ["Checklist", "☑", "Tasks & Deadlines", "34"],
  expenses: ["Expenses", "💰", "Reconciled Ledger & Split", "16"],
  tentative: ["Tentative", "📅", "Day Programmes & Timelines", "3"],
  directory: ["Directory", "👥", "Guests · Vendors · Sponsors", "20"],
  records: ["Records & Audit", "📁", "Documents & Sync Trail", "19"]
};

const $ = id => document.getElementById(id);
const make = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

const money = value => value == null ? "—" : new Intl.NumberFormat("en-MY", {
  style: "currency", currency: "MYR", minimumFractionDigits: 2
}).format(value);

// Format dates strictly as DD/MM/YYYY (Dashboard Point 2)
const date = value => {
  if (!value) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-");
    return `${d}/${m}/${y}`;
  }
  const dt = new Date(value);
  if (!isNaN(dt.getTime())) {
    const day = String(dt.getUTCDate()).padStart(2, "0");
    const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const year = dt.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }
  return value;
};

const captured = value => new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Singapore"
}).format(new Date(value));

// Person icons with strict color coding: Joint = black, Soya = blue, Rin = pink
function renderPersonChip(owner) {
  const o = (owner || "Joint").trim();
  const lower = o.toLowerCase();
  if (lower.includes("soya") || lower.includes("sayed") || lower.includes("groom")) {
    return `<span class="person-chip person-soya" title="Assigned to Soya (Sayed)"><span class="person-icon">👤</span> Soya</span>`;
  }
  if (lower.includes("rin") || lower.includes("shamira") || lower.includes("bride")) {
    return `<span class="person-chip person-rin" title="Assigned to Rin (Shamira)"><span class="person-icon">👤</span> Rin</span>`;
  }
  return `<span class="person-chip person-joint" title="Assigned to Joint (Soya & Rin)"><span class="person-icon">👤</span> Joint</span>`;
}

// Light Phase Pills: Yellow = Tunang, Green = Nikah, Purple = Sanding, Light Grey = Shared
function renderPhaseChip(phase) {
  const p = (phase || "Shared").trim();
  const lower = p.toLowerCase();
  if (lower.includes("tunang")) {
    return `<span class="phase-chip-tunang">Tunang</span>`;
  }
  if (lower.includes("nikah")) {
    return `<span class="phase-chip-nikah">Nikah</span>`;
  }
  if (lower.includes("sanding")) {
    return `<span class="phase-chip-sanding">Sanding</span>`;
  }
  return `<span class="phase-chip-shared">Shared</span>`;
}

let snapshot;
let ledger = "Notion";
let checklistFilter = "all";
let isAuthenticated = true;
let pendingExpenseFilter = "";

function showToast(msg) {
  let toast = $("toast");
  if (!toast) {
    toast = make("div", "toast-notification");
    toast.id = "toast";
    document.body.append(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

let cachedVault = undefined;
async function loadStaticVault() {
  if (cachedVault !== undefined) return cachedVault;
  try {
    const res = await fetch("./vault.json");
    if (res.ok) {
      cachedVault = await res.json();
      return cachedVault;
    }
  } catch (e) {}
  cachedVault = null;
  return null;
}

async function decryptMasterVault(passcode, vault) {
  if (!vault || !vault.salt || !vault.iv || !vault.ct) throw new Error("Encrypted vault not found");
  const enc = new TextEncoder();
  const salt = hexToBytes(vault.salt);
  const iv = hexToBytes(vault.iv);
  const ct = hexToBytes(vault.ct);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(decrypted));
}

async function checkAuthStatus() {
  // 1. If explicit guest mode requested for current session
  if (sessionStorage.getItem("soyarin_guest_mode") === "1" || location.hash === "#guest") {
    isAuthenticated = false;
    updateAuthUI();
    return;
  }

  // 2. Check if static encrypted vault is present (e.g. GitHub Pages route /soyarinwedding/)
  const vault = await loadStaticVault();
  if (vault) {
    const savedPasscode = sessionStorage.getItem("soyarin_admin_passcode") || localStorage.getItem("soyarin_admin_passcode");
    if (savedPasscode) {
      try {
        snapshot = await decryptMasterVault(savedPasscode, vault);
        isAuthenticated = true;
        updateAuthUI();
        return;
      } catch (e) {
        sessionStorage.removeItem("soyarin_admin_passcode");
        localStorage.removeItem("soyarin_admin_passcode");
      }
    }
    isAuthenticated = false;
    updateAuthUI();
    return;
  }

  // 3. Pure server-side session check (HTTPOnly cookie)
  try {
    const res = await fetch("/api/auth/status");
    if (res.ok) {
      const data = await res.json();
      if (data.authenticated) {
        isAuthenticated = true;
        updateAuthUI();
        return;
      }
    }
  } catch (e) {}

  isAuthenticated = false;
  updateAuthUI();
}

function updateAuthUI() {
  const authBtn = $("btn-portal-auth");
  if (authBtn) {
    if (isAuthenticated) {
      authBtn.textContent = "🔓";
      authBtn.setAttribute("data-prompt", "Soya & Rin Control Center Active (Click to switch to Guest Mode or Sign Out)");
      authBtn.title = "Soya & Rin Control Center Active (Click to switch to Guest Mode or Sign Out)";
      authBtn.classList.add("unlocked");
    } else {
      authBtn.textContent = "🔒";
      authBtn.setAttribute("data-prompt", "Unlock Soya & Rin Control Center");
      authBtn.title = "Unlock Soya & Rin Control Center";
      authBtn.classList.remove("unlocked");
    }
  }
}

function daysUntil(dateString) {
  const target = new Date(dateString + "T00:00:00+08:00").getTime();
  const now = new Date().getTime();
  const diff = target - now;
  return diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
}

function sourceLink(source) {
  const link = make("a", "source-link-chip", source.label + " ↗");
  link.href = source.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}

function card(record) {
  const node = make("article", "card");
  const meta = make("div", "meta");
  meta.append(make("span", "eyebrow", record.event ?? ""));
  
  let pillClass = "status-chip pending";
  if (record.status === "Done" || record.status === "Committed" || record.status === "Invoice on record") {
    pillClass = "status-chip done";
  } else if (record.status === "In progress") {
    pillClass = "status-chip progress";
  }
  meta.append(make("span", pillClass, record.status));
  node.append(meta, make("h3", "", record.title));
  
  const extra = [record.date && date(record.date), record.owner, record.priority].filter(Boolean);
  if (extra.length) node.append(make("p", "key", extra.join("  ·  ")));
  if (record.amount != null) node.append(make("p", "key", money(record.amount)));
  if (record.detail) {
    if (record.detail.length > 160) {
      const details = make("details");
      details.append(make("summary", "", "Details"), make("p", "", record.detail));
      node.append(details);
    } else {
      node.append(make("p", "", record.detail));
    }
  }
  
  const links = make("div", "sources");
  links.append(...record.sources.map(sourceLink));
  node.append(links);
  
  if (record.tab === "audit") {
    const history = snapshot.reviews.filter(r => r.record_id === record.id);
    for (const review of history) {
      node.append(make("p", "review",
        review.decision.toUpperCase() + " · " + review.actor + " · " + captured(review.recorded_at) + " — " + review.reason));
    }
  }
  return node;
}

function grid(records, className = "") {
  const list = make("div", "grid " + className);
  if (records.length) list.append(...records.map(card));
  else list.append(make("p", "empty", "No matching records."));
  return list;
}

/* ========================================================================= */
/* 1. MASTER EXECUTIVE DASHBOARD (ALL IN ONE VIEW)                            */
/* ========================================================================= */
/* ========================================================================= */
/* 1. MASTER EXECUTIVE DASHBOARD (SAMPLE 4 + 5 MINIMALIST COMBINATION)       */
/* ========================================================================= */
function openDetailModal(title, htmlContent) {
  const modal = $("detail-modal");
  const modalTitle = $("detail-modal-title");
  const modalBody = $("detail-modal-body");
  const closeBtn = $("close-detail-modal");
  if (!modal || !modalTitle || !modalBody) return;

  modalTitle.textContent = title;
  modalBody.innerHTML = htmlContent;

  const closeHandler = () => {
    modal.close();
    closeBtn?.removeEventListener("click", closeHandler);
  };
  closeBtn?.addEventListener("click", closeHandler);

  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height
      && rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      modal.close();
    }
  }, { once: true });

  modal.showModal();
}

/* ========================================================================= */
/* OFFICIAL WEDDING FACTS, CONTACTS & POSTERS DIRECTORY                      */
/* ========================================================================= */
const WEDDING_CONTACTS = [
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
    role: "Groom Mother",
    name: "Pn. Zaini",
    phone: "012-2839140",
    rawPhone: "60122839140",
    note: "Groom family liaison & sarung cincin lead",
    icon: "🧕"
  },
  {
    category: "Family Principals & Couple",
    role: "Bride Mother",
    name: "Pn. Norzilawati",
    phone: "019-6458300",
    rawPhone: "60196458300",
    note: "Bride family liaison & welcoming lead",
    icon: "🧕"
  },
  {
    category: "Venues & Officials",
    role: "Gastrohub Event House (Tunang)",
    name: "En. Izz",
    phone: "013-5599032",
    rawPhone: "60135599032",
    note: "Venue floor coordinator & catering PIC · Persiaran Korporat, Nilai, N. Sembilan",
    map: "https://maps.app.goo.gl/231k2Gxhw8KxayAr7",
    waze: "https://waze.com/ul/hw22rurtuh",
    icon: "🏡"
  },
  {
    category: "Venues & Officials",
    role: "Masjid Raja Haji Fi Sabilillah (Nikah)",
    name: "Ustaz Syahir",
    phone: "+60 13-476 7535",
    rawPhone: "60134767535",
    note: "Masjid administration & solemnization coordination · Persiaran Semarak Api, Cyberjaya",
    map: "https://maps.app.goo.gl/tEW5DLnAUDDHascHA",
    waze: "https://waze.com/ul/hw2829j9sp",
    icon: "🕌"
  },
  {
    category: "Venues & Officials",
    role: "Royale Palace Grand Ballroom (Sanding)",
    name: "Pn. Elyna",
    phone: "+60 17-937 7965",
    rawPhone: "60179377965",
    note: "Senior sales consultant & grand ballroom manager · 2 Jalan Teknokrat 2, Cyberjaya",
    map: "https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9",
    waze: "https://waze.com/ul/hw2829ntvy",
    icon: "👑"
  },
  {
    category: "Media & Creative Vendors",
    role: "Official Photography (Nikah & Sanding)",
    name: "MSSA Studio — Intan",
    phone: "019-7677917",
    rawPhone: "60197677917",
    note: "Official wedding photographer",
    icon: "📸"
  },
  {
    category: "Media & Creative Vendors",
    role: "Official Videography (Nikah & Sanding)",
    name: "Deloka — Affi",
    phone: "@affi.izzani",
    ig: "https://instagram.com/affi.izzani",
    note: "Official wedding videography & highlight reel",
    icon: "🎥"
  },
  {
    category: "Media & Creative Vendors",
    role: "Cinematic Videography (Nikah)",
    name: "SejedaFilm — Jid",
    phone: "+6011-28446534",
    rawPhone: "601128446534",
    note: "Ceremony cinematic videographer",
    icon: "🎬"
  }
];

function openPosterModal(phaseName, posterSrc) {
  let cleanSrc = posterSrc;
  if (cleanSrc && cleanSrc.startsWith("/")) cleanSrc = "." + cleanSrc;
  openDetailModal(`${phaseName} · Official Tentative Programme Poster`, `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <span style="font-size: 12px; color: var(--charcoal-muted);">Approved official programme poster · #SAHdenganIra</span>
        <a href="${cleanSrc}" target="_blank" download class="quick-action-btn">Download / Full View ↗</a>
      </div>
      <div style="text-align: center; background: var(--bg-soft); border-radius: 12px; padding: 16px; border: 1px solid var(--border);">
        <img src="${cleanSrc}" alt="${phaseName} Tentative Programme" style="max-width: 100%; max-height: 68vh; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: inline-block;">
      </div>
    </div>
  `);
}

function renderContactsDirectoryHtml() {
  const groups = {};
  for (const c of WEDDING_CONTACTS) {
    if (!groups[c.category]) groups[c.category] = [];
    groups[c.category].push(c);
  }

  let html = ``;
  for (const [category, items] of Object.entries(groups)) {
    html += `
      <div class="contacts-category-title">${category} (${items.length})</div>
      <div class="contacts-grid" style="margin-bottom: 16px;">
        ${items.map(c => {
          const callBtn = c.rawPhone ? `<a href="tel:${c.rawPhone}" class="contact-btn btn-call">📞 Call</a>` : "";
          const waBtn = c.rawPhone ? `<a href="https://wa.me/${c.rawPhone}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-wa">💬 WhatsApp</a>` : "";
          const igBtn = c.ig ? `<a href="${c.ig}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-ig">📷 ${c.phone}</a>` : "";
          const mapBtn = c.map ? `<a href="${c.map}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>` : "";
          const wazeBtn = c.waze ? `<a href="${c.waze}" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>` : "";

          return `
            <div class="contact-card">
              <div class="contact-card-top">
                <div class="contact-icon-avatar">${c.icon}</div>
                <div>
                  <div class="contact-role-tag">${c.role}</div>
                  <div class="contact-name">${c.name}</div>
                  <div style="font-size: 12px; font-weight: 700; color: var(--burgundy); margin: 2px 0;">${c.phone}</div>
                  <div class="contact-note">${c.note}</div>
                </div>
              </div>
              <div class="contact-actions">
                ${callBtn}
                ${waBtn}
                ${igBtn}
                ${mapBtn}
                ${wazeBtn}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
  return html;
}

function openContactsModal() {
  openDetailModal("Official Wedding Contacts & VIP Directory", `
    <div style="margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
      <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 0 0 4px 0;">Official Wedding Contacts &amp; VIP Directory</h4>
      <span style="font-size: 12px; color: var(--charcoal-muted);">Direct phone, WhatsApp &amp; location contacts for couple, family leads, venues and creative vendors.</span>
    </div>
    ${renderContactsDirectoryHtml()}
  `);
}

/* ========================================================================= */
/* RECONCILED & CONSOLIDATED EXPENSES ENGINE (ZERO DUPLICATE PROMISE)        */
/* ========================================================================= */
function getReconciledPayments() {
  const records = snapshot?.records || [];
  const findRec = id => records.find(r => r.id === id);

  const getSourceLinks = (driveId, notionId) => {
    const links = [];
    if (driveId) {
      const d = findRec(driveId);
      if (d && d.sources && d.sources[0]) {
        links.push({ label: "Drive Receipt", url: d.sources[0].url });
      }
    }
    if (notionId) {
      const n = findRec(notionId);
      if (n && n.sources && n.sources[0]) {
        links.push({ label: "Notion Record", url: n.sources[0].url });
      }
    }
    return links;
  };

  return [
    // 1. Tunang (4 items = RM 1,300.00)
    {
      id: "recon-tunang-avenys",
      driveId: "sheet-14",
      notionId: "3e4caff3-54e7-81bb-83df-edc933c061db",
      phaseId: "tunang",
      phase: "Tunang",
      event: "Tunang",
      title: "Rin Tunang rings — Avenys order AV-469593",
      detail: "Avenys order AV-469593 for bride Tunang ring. Paid RM600 by Groom on 17 Oct 2026.",
      amount: 600,
      paid: 600,
      outstanding: 0,
      payer: "Soya",
      date: "2026-10-17",
      paidDate: "2026-10-17",
      vendor: "Avenys",
      category: "Gift",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-14", "3e4caff3-54e7-81bb-83df-edc933c061db")
    },
    {
      id: "recon-tunang-gastrohub",
      driveId: "sheet-5",
      notionId: "3c9caff3-54e7-816d-b5b2-fedc924fc999",
      phaseId: "tunang",
      phase: "Tunang",
      event: "Tunang",
      title: "Gastrohub Event House booking deposit",
      detail: "Gastrohub Event House Tunang package (RM1,914 total). RM500 deposit paid by Bride on 5 Sep 2026. Remaining RM1,414 due 27 Nov 2026.",
      amount: 1914,
      paid: 500,
      outstanding: 1414,
      payer: "Rin",
      date: "2026-09-05",
      paidDate: "2026-09-05",
      vendor: "Gastrohub",
      category: "Venue",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-5", "3c9caff3-54e7-816d-b5b2-fedc924fc999")
    },
    {
      id: "recon-tunang-desserts",
      driveId: "sheet-17",
      notionId: "notion-tunang-desserts",
      phaseId: "tunang",
      phase: "Tunang",
      event: "Tunang",
      title: "Tunang — 2 desserts order",
      detail: "Two desserts for Tunang event paid by Groom on 8 Nov 2026.",
      amount: 150,
      paid: 150,
      outstanding: 0,
      payer: "Soya",
      date: "2026-11-08",
      paidDate: "2026-11-08",
      vendor: "Desserts",
      category: "Food",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-17", "notion-tunang-desserts")
    },
    {
      id: "recon-tunang-pelamin",
      driveId: "sheet-11",
      notionId: null,
      phaseId: "tunang",
      phase: "Tunang",
      event: "Tunang",
      title: "Pelamin · Deposit",
      detail: "Mini Pelamin deposit paid by Bride on 8 Sep 2026. Receipt label: Resit Deposit Pelamin.",
      amount: 50,
      paid: 50,
      outstanding: 0,
      payer: "Rin",
      date: "2026-09-08",
      paidDate: "2026-09-08",
      vendor: "Pelamin Vendor",
      category: "Pelamin",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-11", null)
    },

    // 2. Nikah (5 items = RM 1,538.00)
    {
      id: "recon-nikah-elfi",
      driveId: "sheet-16",
      notionId: "3c8caff3-54e7-8168-9dc5-ef1f44430cb4",
      phaseId: "nikah",
      phase: "Nikah",
      event: "Nikah",
      title: "Groom Nikah ring — Elfi Jewellery I-City",
      detail: "Soya's groom/Nikah ring at Elfi Jewellery I-City. Funded via Mama family sponsorship (RM500 gift). Purchase price RM439 on 10 Oct 2026.",
      amount: 439,
      paid: 439,
      outstanding: 0,
      payer: "Soya",
      date: "2026-10-10",
      paidDate: "2026-10-10",
      vendor: "Elfi Jewellery",
      category: "Gift",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-16", "3c8caff3-54e7-8168-9dc5-ef1f44430cb4")
    },
    {
      id: "recon-nikah-pandora",
      driveId: "sheet-15",
      notionId: "3e4caff3-54e7-81ec-ad59-d8e2eb882855",
      phaseId: "nikah",
      phase: "Nikah",
      event: "Nikah",
      title: "Rin Nikah ring — Pandora invoice PDKEM-CS001460",
      detail: "Pandora invoice PDKEM-CS001460 for bride Nikah ring. Paid RM419 by Groom on 7 Nov 2026 at IOI City Mall.",
      amount: 419,
      paid: 419,
      outstanding: 0,
      payer: "Soya",
      date: "2026-11-07",
      paidDate: "2026-11-07",
      vendor: "Pandora",
      category: "Gift",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-15", "3e4caff3-54e7-81ec-ad59-d8e2eb882855")
    },
    {
      id: "recon-nikah-sejeda",
      driveId: "sheet-7",
      notionId: "3dacaff3-54e7-8198-b1ae-d29c2c6d000f",
      phaseId: "nikah",
      phase: "Nikah",
      event: "Nikah",
      title: "SejedaFilm Nikah videography — Basic package deposit",
      detail: "Invoice dated 31 Aug 2026 for Nikah videography on 20 Mar 2027. Full package RM1,870 (Basic package RM1,500 + travel RM370). RM300 deposit paid on 31 Aug 2026.",
      amount: 1870,
      paid: 300,
      outstanding: 1570,
      payer: "Soya",
      date: "2026-08-31",
      paidDate: "2026-08-31",
      vendor: "SejedaFilm",
      category: "Videography",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-7", "3dacaff3-54e7-8198-b1ae-d29c2c6d000f")
    },
    {
      id: "recon-nikah-kursus",
      driveId: "sheet-2",
      notionId: "3c8caff3-54e7-8136-bc85-e24899d961f6",
      phaseId: "nikah",
      phase: "Nikah",
      event: "Nikah",
      title: "Documents · Kursus Kahwin",
      detail: "Marriage course completed and fully paid by Groom on 14 Jun 2026.",
      amount: 230,
      paid: 230,
      outstanding: 0,
      payer: "Soya",
      date: "2026-06-14",
      paidDate: "2026-06-14",
      vendor: "SPPIM",
      category: "Documents",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-2", "3c8caff3-54e7-8136-bc85-e24899d961f6")
    },
    {
      id: "recon-nikah-shoes",
      driveId: "sheet-13",
      notionId: "3f3caff3-54e7-814d-94bb-e054a1bebc5f",
      phaseId: "nikah",
      phase: "Nikah",
      event: "Nikah",
      title: "Bride Nikah shoes rental",
      detail: "Bride Nikah shoes rental. RM150 paid by Groom on 7 Nov 2026.",
      amount: 150,
      paid: 150,
      outstanding: 0,
      payer: "Soya",
      date: "2026-11-07",
      paidDate: "2026-11-07",
      vendor: "Bridal Boutique",
      category: "Bridal",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-13", "3f3caff3-54e7-814d-94bb-e054a1bebc5f")
    },

    // 3. Sanding (2 items = RM 3,500.00)
    {
      id: "recon-sanding-rp-balance",
      driveId: "sheet-8",
      notionId: "3c8caff3-54e7-81bb-8e51-cb64ccf98b14",
      phaseId: "sanding",
      phase: "Sanding",
      event: "Sanding",
      title: "Royale Palace balance deposit (Payment 1)",
      detail: "20% balance deposit of RM2,500 paid by Soya on 29 Aug 2026. Receipt label: Royale Palace 2.",
      amount: 2500,
      paid: 2500,
      outstanding: 0,
      payer: "Soya",
      date: "2026-08-29",
      paidDate: "2026-08-29",
      vendor: "Royale Palace",
      category: "Venue",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-8", "3c8caff3-54e7-81bb-8e51-cb64ccf98b14")
    },
    {
      id: "recon-sanding-rp-booking",
      driveId: "sheet-1",
      notionId: "3c8caff3-54e7-81d3-b6f0-f7fa736a4b05",
      phaseId: "sanding",
      phase: "Sanding",
      event: "Sanding",
      title: "Royale Palace booking deposit",
      detail: "Part of RM17,500 Standard Package for 400 pax at Royale Palace Cyberjaya. Receipt label: Royale Palace 1.",
      amount: 17500,
      paid: 1000,
      outstanding: 14000,
      payer: "Soya",
      date: "2026-07-19",
      paidDate: "2026-07-19",
      vendor: "Royale Palace",
      category: "Venue",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-1", "3c8caff3-54e7-81d3-b6f0-f7fa736a4b05")
    },

    // 4. Photo/Video & Attire (Nikah+Sanding) (3 items = RM 1,150.00)
    {
      id: "recon-shared-busana",
      driveId: "sheet-12",
      notionId: "3f3caff3-54e7-811c-8b89-f5a651a51167",
      phaseId: "shared",
      phase: "Photo/Video",
      event: "Nikah+Sanding",
      title: "Busana couple rental promo (Nikah + Sanding)",
      detail: "Busana couple rental promo for groom Nikah + bride Sanding attire. RM650 paid by Groom on 7 Nov 2026.",
      amount: 650,
      paid: 650,
      outstanding: 0,
      payer: "Soya",
      date: "2026-11-07",
      paidDate: "2026-11-07",
      vendor: "Bridal Boutique",
      category: "Bridal",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-12", "3f3caff3-54e7-811c-8b89-f5a651a51167")
    },
    {
      id: "recon-shared-mssa",
      driveId: "sheet-3",
      notionId: "3c8caff3-54e7-810b-92ff-c2a677f22aa7",
      phaseId: "shared",
      phase: "Photo/Video",
      event: "Nikah+Sanding",
      title: "MSSA combined Nikah & Sanding photography deposit",
      detail: "Deposit paid 30 Jul 2026 for MSSA Studio July Promo 2026 combined Photo (Nikah & Sanding) package. Full package total is RM3,000.",
      amount: 3000,
      paid: 300,
      outstanding: 2700,
      payer: "Soya",
      date: "2026-07-30",
      paidDate: "2026-07-30",
      vendor: "MSSA",
      category: "Photography",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-3", "3c8caff3-54e7-810b-92ff-c2a677f22aa7")
    },
    {
      id: "recon-shared-deloka",
      driveId: "sheet-4",
      notionId: "3c8caff3-54e7-813a-96cd-cd963a2006b9",
      phaseId: "shared",
      phase: "Photo/Video",
      event: "Nikah+Sanding",
      title: "Deloka videography package / deposit",
      detail: "Revised package total is RM1,912. The RM600 post-wedding shoot add-on was CANCELLED and excluded from outstanding. Paid RM200 deposit on 31 Jul 2026.",
      amount: 1912,
      paid: 200,
      outstanding: 1712,
      payer: "Soya",
      date: "2026-07-31",
      paidDate: "2026-07-31",
      vendor: "Deloka",
      category: "Videography",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-4", "3c8caff3-54e7-813a-96cd-cd963a2006b9")
    },

    // 5. Merisik (2 items = RM 510.00)
    {
      id: "recon-merisik-venue",
      driveId: "sheet-9",
      notionId: null,
      phaseId: "merisik",
      phase: "Merisik",
      event: "Merisik",
      title: "Merisik venue booking fee",
      detail: "Merisik venue booking fee paid by Bride.",
      amount: 250,
      paid: 250,
      outstanding: 0,
      payer: "Rin",
      date: "2026-08-01",
      paidDate: "2026-08-01",
      vendor: "Merisik Venue",
      category: "Venue",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-9", null)
    },
    {
      id: "recon-merisik-food",
      driveId: "sheet-10",
      notionId: null,
      phaseId: "merisik",
      phase: "Merisik",
      event: "Merisik",
      title: "Merisik food",
      detail: "Merisik food catering paid by Bride.",
      amount: 260,
      paid: 260,
      outstanding: 0,
      payer: "Rin",
      date: "2026-08-01",
      paidDate: "2026-08-01",
      vendor: "Food Catering",
      category: "Food",
      ledger: "Reconciled",
      status: "Paid",
      sources: getSourceLinks("sheet-10", null)
    }
  ];
}

function getConsolidatedMasterRecords(rawRecords) {
  const reconciled = getReconciledPayments();
  const reconciledDriveIds = new Set(reconciled.map(r => r.driveId).filter(Boolean));
  const reconciledNotionIds = new Set(reconciled.map(r => r.notionId).filter(Boolean));

  // 1. Start with the 16 reconciled payment records
  const list = [...reconciled];

  // 2. Add remaining records from rawRecords that are NOT duplicate payment records
  for (const r of (rawRecords || [])) {
    if (reconciledDriveIds.has(r.id) || reconciledNotionIds.has(r.id)) {
      continue;
    }
    if ((r.paid || 0) > 0 && (r.ledger === "Drive" || r.ledger === "Notion")) {
      continue;
    }
    list.push({
      ...r,
      phaseId: (r.event || "").toLowerCase().includes("tunang") ? "tunang"
             : (r.event || "").toLowerCase().includes("nikah") ? "nikah"
             : (r.event || "").toLowerCase().includes("sanding") ? "sanding"
             : "shared"
    });
  }
  return list;
}

function overview(parent) {
  const targetBudget = 25000;
  const reconciledPaidRecords = getReconciledPayments();
  const reconciledPaid = reconciledPaidRecords.reduce((sum, r) => sum + (r.paid || 0), 0);
  const paidTransactionsCount = reconciledPaidRecords.length;
  const remainingBudget = targetBudget - reconciledPaid;
  const eacForecast = 24500;
  const savingsBuffer = targetBudget - eacForecast; // +500

  const tasks = snapshot.records.filter(r => r.tab === "checklist");
  const doneTasks = tasks.filter(r => r.status === "Done").length;
  const inProgressTasks = tasks.filter(r => r.status === "In progress").length;
  const pendingTasks = tasks.filter(r => r.status === "Not started").length;
  const donePct = ((doneTasks / tasks.length) * 100).toFixed(1);

  // 1. Single Horizon Strip (1 Row - Kids & All-Age Friendly)
  const horizon = make("div", "horizon-strip");
  horizon.innerHTML = `
    <!-- Phase 1: Tunang -->
    <div class="horizon-card">
      <div>
        <div class="horizon-top">
          <span class="horizon-phase">1. Tunang</span>
          <span class="horizon-date">27/12/2026</span>
        </div>
        <div class="horizon-main">
          <span class="horizon-num">${daysUntil("2026-12-27")}</span>
          <span class="horizon-unit">Days to Go</span>
        </div>
        <div class="horizon-sub" title="Gastrohub Event House, Cyberjaya">Gastrohub Cyberjaya</div>
      </div>
      <div class="horizon-footer">
        <span class="event-time-pill">10AM to 1PM</span>
        <button type="button" class="read-more-btn" id="read-more-tunang">Details ↗</button>
      </div>
    </div>

    <!-- Phase 2: Nikah -->
    <div class="horizon-card">
      <div>
        <div class="horizon-top">
          <span class="horizon-phase">2. Nikah</span>
          <span class="horizon-date">27/03/2027</span>
        </div>
        <div class="horizon-main">
          <span class="horizon-num">${daysUntil("2027-03-27")}</span>
          <span class="horizon-unit">Days to Go</span>
        </div>
        <div class="horizon-sub" title="Masjid Raja Haji Fi Sabilillah, Cyberjaya">Masjid Raja Haji Cyberjaya</div>
      </div>
      <div class="horizon-footer">
        <span class="event-time-pill">9AM to 1PM</span>
        <button type="button" class="read-more-btn" id="read-more-nikah">Details ↗</button>
      </div>
    </div>

    <!-- Phase 3: Sanding -->
    <div class="horizon-card">
      <div>
        <div class="horizon-top">
          <span class="horizon-phase">3. Sanding</span>
          <span class="horizon-date">27/11/2027</span>
        </div>
        <div class="horizon-main">
          <span class="horizon-num">${daysUntil("2027-11-27")}</span>
          <span class="horizon-unit">Days to Go</span>
        </div>
        <div class="horizon-sub" title="Royale Palace Cyberjaya">Royale Palace Cyberjaya</div>
      </div>
      <div class="horizon-footer">
        <span class="event-time-pill">11AM to 4PM</span>
        <button type="button" class="read-more-btn" id="read-more-sanding">Details ↗</button>
      </div>
    </div>

    <!-- Wedding Budget -->
    <div class="horizon-card" style="border-left: 3px solid var(--burgundy);">
      <div>
        <div class="horizon-top">
          <span class="horizon-phase">Our Wedding Budget</span>
          <span class="pill-chip" style="font-size: 10px; color: #15803D; background: #DCFCE7;">+RM 500 Savings</span>
        </div>
        <div class="horizon-main">
          <span class="horizon-num" style="font-size: 24px; color: var(--burgundy);">${money(reconciledPaid).replace(".00", "")}</span>
          <span class="horizon-unit" style="color: var(--charcoal-muted); font-size: 13px;">of RM 25,000 Spent</span>
        </div>
        <div class="horizon-sub">${money(remainingBudget).replace(".00", "")} Left to Spend</div>
      </div>
      <div class="horizon-footer">
        <span style="font-size: 11px; font-weight: 700; color: #15803D;">${paidTransactionsCount} Verified Payments</span>
        <button type="button" class="read-more-btn" id="read-more-budget">Details ↗</button>
      </div>
    </div>
  `;

  // Wire up Horizon "Details" Modals
  horizon.querySelector("#read-more-tunang")?.addEventListener("click", () => {
    openDetailModal("1. Tunang (Engagement) Details & Schedule", `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <div>
          <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 0;">Gastrohub Event House Cyberjaya</h4>
          <span style="font-size: 12px; color: var(--charcoal-muted);">Sunday, 27/12/2026 · 10:00 AM–1:00 PM · 30 Family Guests</span>
        </div>
        <span class="pill-chip" style="background: var(--burgundy); color: #fff;">Confirmed Date</span>
      </div>

      <!-- Quick Facts Cards -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">DRESS CODE</div>
          <div class="dresscode-wrap" style="margin-top: 4px;">
            <span class="dresscode-tag matcha"><span class="dot"></span> Matcha (Groom)</span>
            <span class="dresscode-tag strawberry"><span class="dot"></span> Strawberry (Bride)</span>
          </div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">GIFTS &amp; HANTARAN</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--charcoal); margin-top: 4px;">💍 Bride Ring &amp; 2 Desserts</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">TOTAL INVOICE</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--burgundy);">RM 1,914.00</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">ALREADY PAID</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--charcoal);">RM 1,250.00</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">VENUE PIC</div>
          <div style="font-size: 12px; font-weight: 800; color: var(--charcoal);">En. Izz · 013-5599032</div>
        </div>
      </div>

      <div class="poster-preview-card">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="./posters/poster-tunang.jpg" alt="Tunang Poster" class="poster-preview-thumb" id="thumb-poster-tunang">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: var(--charcoal);">Official Tentative Programme Poster</div>
            <div style="font-size: 11px; color: var(--charcoal-muted);">Sunday, 27/12/2026 · Gastrohub Event House</div>
          </div>
        </div>
        <button type="button" class="quick-action-btn" id="btn-modal-poster-tunang">View Poster 🖼️</button>
      </div>

      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 14px; flex-wrap: wrap;">
        <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
        <a href="https://wa.me/60135599032" target="_blank" rel="noopener noreferrer" class="quick-action-btn">💬 WhatsApp En. Izz ↗</a>
        <a href="https://app.notion.com/3c9caff354e7816db5b2fedc924fc999" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Gastrohub Invoice ↗</a>
        <a href="https://drive.google.com/drive/folders/19bDYrC6ZgqYhwCwPR1Y43uQP0ohDba1H" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Engagement Receipts ↗</a>
      </div>
    `);

    $("thumb-poster-tunang")?.addEventListener("click", () => openPosterModal("Tunang", "./posters/poster-tunang.jpg"));
    $("btn-modal-poster-tunang")?.addEventListener("click", () => openPosterModal("Tunang", "./posters/poster-tunang.jpg"));
  });

  horizon.querySelector("#read-more-nikah")?.addEventListener("click", () => {
    openDetailModal("2. Nikah (Wedding Ceremony) Details", `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <div>
          <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 0;">Masjid Raja Haji Fi Sabilillah Cyberjaya</h4>
          <span style="font-size: 12px; color: var(--charcoal-muted);">Saturday, 27/03/2027 · 9:00 AM–1:00 PM (Akad 10:05 AM) · ~200 Guests</span>
        </div>
        <span class="pill-chip" style="background: var(--charcoal); color: #fff;">~200 Guests</span>
      </div>

      <!-- Quick Facts Cards -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">DRESS CODE</div>
          <div class="dresscode-wrap" style="margin-top: 4px;">
            <span class="dresscode-tag blue"><span class="dot"></span> Shade of Blue (Both Families)</span>
          </div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">MAS KAHWIN &amp; GIFTS</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--charcoal); margin-top: 4px;">💍 Groom &amp; Bride Ring · 2 Dinar Gold</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">MAS KAHWIN</div>
          <div style="font-size: 15px; font-weight: 800; color: var(--burgundy);">2 Dinar Gold</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">SPENT SO FAR</div>
          <div style="font-size: 15px; font-weight: 800; color: var(--charcoal);">RM 980.00</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">MASJID PIC</div>
          <div style="font-size: 12px; font-weight: 800; color: var(--charcoal);">Ustaz Syahir · 013-4767535</div>
        </div>
      </div>

      <div class="poster-preview-card">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="./posters/poster-nikah.jpg" alt="Nikah Poster" class="poster-preview-thumb" id="thumb-poster-nikah">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: var(--charcoal);">Official Tentative Programme Poster</div>
            <div style="font-size: 11px; color: var(--charcoal-muted);">Saturday, 27/03/2027 · Masjid Raja Haji Fi Sabilillah</div>
          </div>
        </div>
        <button type="button" class="quick-action-btn" id="btn-modal-poster-nikah">View Poster 🖼️</button>
      </div>

      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 14px; flex-wrap: wrap;">
        <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
        <a href="https://wa.me/60134767535" target="_blank" rel="noopener noreferrer" class="quick-action-btn">💬 WhatsApp Ustaz Syahir ↗</a>
        <a href="https://app.notion.com/3cbcaff354e78133b424ecd2d8e995d3" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Masjid Booking ↗</a>
        <a href="https://drive.google.com/drive/folders/1jjoMAaYn8oipUMiFq0zOkUdCGV-b4HTo" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Nikah Evidence ↗</a>
      </div>
    `);

    $("thumb-poster-nikah")?.addEventListener("click", () => openPosterModal("Nikah", "./posters/poster-nikah.jpg"));
    $("btn-modal-poster-nikah")?.addEventListener("click", () => openPosterModal("Nikah", "./posters/poster-nikah.jpg"));
  });

  horizon.querySelector("#read-more-sanding")?.addEventListener("click", () => {
    openDetailModal("3. Sanding (Big Reception) Details", `
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
        <div>
          <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 0;">Royale Palace Grand Ballroom Cyberjaya</h4>
          <span style="font-size: 12px; color: var(--charcoal-muted);">Saturday, 27/11/2027 · 11:00 AM–4:00 PM · 400 Guests Reception</span>
        </div>
        <span class="pill-chip" style="background: var(--burgundy); color: #fff;">Package RM 17,500</span>
      </div>

      <!-- Quick Facts Cards -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">DRESS CODE</div>
          <div class="dresscode-wrap" style="margin-top: 4px;">
            <span class="dresscode-tag purple"><span class="dot"></span> Shade of Purple (Both Families)</span>
          </div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 800; text-transform: uppercase;">VENUE PIC &amp; MANAGER</div>
          <div style="font-size: 13px; font-weight: 700; color: var(--charcoal); margin-top: 4px;">Pn. Elyna · +60 17-937 7965</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px;">
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">TOTAL PACKAGE</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--burgundy);">RM 17,500.00</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">DEPOSIT PAID</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--charcoal);">RM 3,500.00</div>
        </div>
        <div style="background: var(--bg-soft); padding: 10px; border-radius: 8px;">
          <div style="font-size: 10px; color: var(--charcoal-muted); font-weight: 700;">BALANCE DUE</div>
          <div style="font-size: 16px; font-weight: 800; color: #D97706;">RM 14,000.00</div>
        </div>
      </div>

      <div class="poster-preview-card">
        <div style="display: flex; align-items: center; gap: 12px;">
          <img src="./posters/poster-sanding.jpg" alt="Sanding Poster" class="poster-preview-thumb" id="thumb-poster-sanding">
          <div>
            <div style="font-size: 12px; font-weight: 800; color: var(--charcoal);">Official Tentative Programme Poster</div>
            <div style="font-size: 11px; color: var(--charcoal-muted);">Saturday, 27/11/2027 · Royale Palace Cyberjaya</div>
          </div>
        </div>
        <button type="button" class="quick-action-btn" id="btn-modal-poster-sanding">View Poster 🖼️</button>
      </div>

      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; margin-top: 14px; flex-wrap: wrap;">
        <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
        <a href="https://wa.me/60179377965" target="_blank" rel="noopener noreferrer" class="quick-action-btn">💬 WhatsApp Elyna ↗</a>
        <a href="https://app.notion.com/p/3c8caff354e78133bb29eca4687f6300?pvs=204" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Royale Palace Contract ↗</a>
        <a href="https://drive.google.com/drive/folders/19bDYrC6ZgqYhwCwPR1Y43uQP0ohDba1H" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Reception Receipts ↗</a>
      </div>
    `);

    $("thumb-poster-sanding")?.addEventListener("click", () => openPosterModal("Sanding", "./posters/poster-sanding.jpg"));
    $("btn-modal-poster-sanding")?.addEventListener("click", () => openPosterModal("Sanding", "./posters/poster-sanding.jpg"));
  });

  horizon.querySelector("#read-more-budget")?.addEventListener("click", () => {
    openDetailModal("Our Wedding Budget Summary", `
      <div style="margin-bottom: 16px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
        <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0 0 4px 0;">Total Family Budget: RM 25,000</h4>
        <span style="font-size: 12px; color: var(--charcoal-muted);">100% Zero Debt Guarantee · All payments tracked with receipts</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px;">
        <div style="background: var(--bg-soft); padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">TOTAL BUDGET</div>
          <div style="font-size: 17px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">RM 25,000.00</div>
          <div style="font-size: 10px; color: var(--charcoal-light);">Maximum Limit</div>
        </div>
        <div style="background: var(--burgundy-soft); padding: 12px; border-radius: 8px; text-align: center; border: 1px solid var(--burgundy-border);">
          <div style="font-size: 10px; font-weight: 800; color: var(--burgundy);">SPENT SO FAR</div>
          <div style="font-size: 17px; font-weight: 800; color: var(--burgundy); margin: 4px 0;">${money(reconciledPaid)}</div>
          <div style="font-size: 10px; color: var(--burgundy);">${paidTransactionsCount} Paid Transactions</div>
        </div>
        <div style="background: var(--bg-soft); padding: 12px; border-radius: 8px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">LEFT TO SPEND</div>
          <div style="font-size: 17px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">${money(remainingBudget)}</div>
          <div style="font-size: 10px; color: var(--charcoal-light);">Available Cash</div>
        </div>
        <div style="background: #ECFDF5; padding: 12px; border-radius: 8px; text-align: center; border: 1px solid #A7F3D0;">
          <div style="font-size: 10px; font-weight: 800; color: #15803D;">EXPECTED TOTAL</div>
          <div style="font-size: 17px; font-weight: 800; color: #15803D; margin: 4px 0;">RM 24,500.00</div>
          <div style="font-size: 10px; color: #15803D;">+RM 500 Savings!</div>
        </div>
      </div>
      <div style="background: #FFFFFF; border: 1px solid var(--border); border-radius: 10px; padding: 14px; margin-bottom: 16px;">
        <div style="font-size: 12px; font-weight: 700; color: var(--charcoal); margin-bottom: 8px;">Budget Health Highlights</div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--bg-soft);">
          <span>Budget Status:</span>
          <strong style="color: #15803D;">✓ Under Budget (Saving RM 500.00)</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--bg-soft);">
          <span>Timeline Status:</span>
          <strong style="color: var(--charcoal);">✓ Right on Schedule</strong>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0;">
          <span>Zero Debt Guardrail:</span>
          <strong style="color: #15803D;">✓ 100% Cash Financed (No Loans)</strong>
        </div>
      </div>
      <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px;">
        <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit?usp=sharing" target="_blank" class="quick-action-btn">📊 Open Google Sheets Budget Tracker ↗</a>
      </div>
    `);
  });

  // 2. Minimal Dual-Split Cockpit Grid (Zero Vertical Sprawl)
  const cockpit = make("div", "minimal-cockpit-grid");

  // =========================================================================
  // LEFT PANEL: THINGS TO DO (FRIENDLY CHECKLIST · COMPLETED TASKS HIDDEN)
  // =========================================================================
  const leftCard = make("div", "cockpit-card");

  // Separate active and completed tasks (Points 1 & 6: Put completed away, keep remaining prioritized)
  const doneTasksList = tasks.filter(t => t.status === "Done");
  const activeTasksList = tasks.filter(t => t.status !== "Done");

  // Priority ranking: High -> Medium -> Low, then earliest deadline
  const priorityRank = { High: 1, Medium: 2, Low: 3 };
  const sortedActiveTasks = [...activeTasksList].sort((a, b) => {
    const pA = priorityRank[a.priority] || 4;
    const pB = priorityRank[b.priority] || 4;
    if (pA !== pB) return pA - pB;
    if (a.date && b.date) return new Date(a.date) - new Date(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  const tunangActive = activeTasksList.filter(t => (t.event || "").includes("Tunang")).length;
  const nikahActive = activeTasksList.filter(t => (t.event || "").includes("Nikah")).length;
  const sandingActive = activeTasksList.filter(t => (t.event || "").includes("Sanding")).length;

  leftCard.innerHTML = `
    <div>
      <div class="cockpit-card-head">
        <span class="cockpit-card-title">
          <span>📋</span> Things To Do (${activeTasksList.length} Active Remaining · ${doneTasks} Done)
        </span>
        <div class="chart-tab-group" id="stream-phase-pills">
          <button type="button" class="chart-tab-btn active" data-phase="all">All Active (${activeTasksList.length})</button>
          <button type="button" class="chart-tab-btn" data-phase="Tunang">Tunang (${tunangActive})</button>
          <button type="button" class="chart-tab-btn" data-phase="Nikah">Nikah (${nikahActive})</button>
          <button type="button" class="chart-tab-btn" data-phase="Sanding">Sanding (${sandingActive})</button>
          <button type="button" class="chart-tab-btn" data-phase="completed" title="View 10 completed tasks">📦 Done (${doneTasks})</button>
        </div>
      </div>
      <div id="stream-items-wrap"></div>
    </div>
    <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--bg-soft); display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 11px; color: var(--charcoal-muted);" id="stream-status-hint">
        Showing top priority tasks · ${doneTasks} completed hidden
      </span>
      <button type="button" class="read-more-btn" id="read-more-tasks">See All 34 Tasks ↗</button>
    </div>
  `;

  function renderStreamTable(filterPhase = "all") {
    const wrap = leftCard.querySelector("#stream-items-wrap");
    const hint = leftCard.querySelector("#stream-status-hint");
    if (!wrap) return;

    let itemsToDisplay = [];
    if (filterPhase === "completed") {
      itemsToDisplay = doneTasksList.slice(0, 7);
      if (hint) hint.textContent = `Showing ${itemsToDisplay.length} completed tasks (${doneTasks} total done)`;
    } else {
      let filtered = sortedActiveTasks;
      if (filterPhase !== "all") {
        filtered = sortedActiveTasks.filter(t => (t.event || "").toLowerCase().includes(filterPhase.toLowerCase()));
      }
      itemsToDisplay = filtered.slice(0, 7);
      if (hint) hint.textContent = `Showing top ${itemsToDisplay.length} priority actions · ${doneTasks} completed hidden · ${activeTasksList.length} remaining`;
    }

    if (!itemsToDisplay.length) {
      wrap.innerHTML = `<p class="empty" style="padding: 24px 0; text-align: center;">No active tasks in this phase.</p>`;
      return;
    }

    wrap.innerHTML = `
      <table class="stream-table">
        <thead>
          <tr>
            <th class="col-no">No.</th>
            <th style="width: 28px;"></th>
            <th>Task &amp; Action Item</th>
            <th style="width: 85px;">Phase</th>
            <th style="width: 85px;">Person</th>
            <th style="width: 65px;">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${itemsToDisplay.map((t, idx) => {
            const isDone = t.status === "Done";
            const isProgress = t.status === "In progress";
            const icon = isDone ? "✓" : (isProgress ? "⚡" : "○");
            const iconClass = isDone ? "done" : (isProgress ? "progress" : "pending");
            const hoverText = `${t.title} · Phase: ${t.event || 'General'} · Assigned to: ${t.owner || 'Joint'} · Status: ${t.status}`;
            const dateBadge = t.date ? `<span style="font-size: 10px; color: var(--charcoal-muted); margin-left: 6px; font-weight: normal;">📅 ${date(t.date)}</span>` : "";
            return `
              <tr class="${isDone ? "is-done" : ""}" title="${hoverText}">
                <td class="col-no">${idx + 1}</td>
                <td><span class="checklist-check-btn ${iconClass}">${icon}</span></td>
                <td><strong>${t.title}</strong>${dateBadge}</td>
                <td>${renderPhaseChip(t.event)}</td>
                <td>${renderPersonChip(t.owner)}</td>
                <td><span class="kanban-priority-pill ${t.priority ?? "Normal"}" style="font-size: 9px;">${t.priority ?? "Normal"}</span></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `;
  }

  renderStreamTable("all");

  leftCard.querySelectorAll("#stream-phase-pills .chart-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      leftCard.querySelectorAll("#stream-phase-pills .chart-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderStreamTable(btn.dataset.phase);
    });
  });

  leftCard.querySelector("#read-more-tasks")?.addEventListener("click", () => {
    openDetailModal("All 34 Wedding Tasks & Deliverables", `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <span style="font-size: 12px; color: var(--charcoal-muted);">34 Activities across Tunang, Nikah, Sanding, and Shared</span>
        <button type="button" class="quick-action-btn" onclick="document.getElementById('detail-modal').close(); location.hash = '#checklist';">Open Checklist Tab ↗</button>
      </div>
      <table class="stream-table" style="font-size: 12px;">
        <thead>
          <tr>
            <th class="col-no">No.</th>
            <th style="width: 32px;">Status</th>
            <th>Task Description</th>
            <th style="width: 90px;">Phase</th>
            <th style="width: 75px;">Assigned</th>
            <th style="width: 65px;">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${tasks.map((t, idx) => {
            const isDone = t.status === "Done";
            const isProgress = t.status === "In progress";
            const icon = isDone ? "✓" : (isProgress ? "⚡" : "○");
            const iconClass = isDone ? "done" : (isProgress ? "progress" : "pending");
            return `
              <tr class="${isDone ? "is-done" : ""}">
                <td class="col-no">${idx + 1}</td>
                <td><span class="checklist-check-btn ${iconClass}">${icon}</span></td>
                <td><strong>${t.title}</strong>${t.detail ? `<div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">${t.detail}</div>` : ""}</td>
                <td><span class="pill-chip" style="font-size: 10px;">${t.event ?? "General"}</span></td>
                <td>👤 ${t.owner ?? "Joint"}</td>
                <td><span class="kanban-priority-pill ${t.priority ?? "Normal"}">${t.priority ?? "Normal"}</span></td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    `);
  });

  // =========================================================================
  // RIGHT PANEL: EXPENSES BY PHASE (INTERACTIVE DONUT, BAR & LINE) + SPLIT
  // =========================================================================
  const rightCard = make("div", "cockpit-card");
  rightCard.innerHTML = `
    <div>
      <div class="cockpit-card-head">
        <span class="cockpit-card-title">
          <span>💰</span> Expenses by Wedding Phase
        </span>
        <div class="chart-tab-group" id="chart-view-tabs">
          <button type="button" class="chart-tab-btn active" data-chart="pie">🥧 Pie Chart</button>
          <button type="button" class="chart-tab-btn" data-chart="bar">📊 Bar Chart</button>
          <button type="button" class="chart-tab-btn" data-chart="line">📈 Growth Line</button>
          <button type="button" class="chart-expand-btn" id="btn-chart-expand" title="Expand Expenses Tracking to full view">⛶ Expand</button>
        </div>
      </div>
      <div class="chart-stage">
        <div id="chart-view-pie" class="chart-view active"></div>
        <div id="chart-view-bar" class="chart-view"></div>
        <div id="chart-view-line" class="chart-view"></div>
      </div>
    </div>

    <!-- Contribution Split Card (Dynamically Reacts on Hover) -->
    <div class="contribution-card" id="contribution-split-card" style="cursor: pointer;" title="Click for complete itemized breakdown">
      <div class="contrib-header">
        <span class="contrib-title" id="contrib-title">Contribution Split</span>
        <span class="contrib-badge" id="contrib-badge">100% Zero Debt</span>
      </div>
      <div class="contrib-person-row">
        <span class="contrib-person" id="contrib-sayed-label">👤 Sayed Arif (86.7%)</span>
        <span class="contrib-val" id="contrib-sayed-val">RM 6,938.00</span>
      </div>
      <div class="contrib-bar-track">
        <div class="contrib-bar-fill-sayed" id="contrib-sayed-fill" style="width: 86.7%; transition: width 0.35s ease;"></div>
      </div>
      <div class="contrib-person-row">
        <span class="contrib-person" id="contrib-shamira-label">👤 Nor Shamira (13.3%)</span>
        <span class="contrib-val" id="contrib-shamira-val">RM 1,060.00</span>
      </div>
      <div class="contrib-bar-track">
        <div class="contrib-bar-fill-shamira" id="contrib-shamira-fill" style="width: 13.3%; transition: width 0.35s ease;"></div>
      </div>
      <div class="contrib-hover-tip">
        <span id="contrib-tip-text">Hover charts for event split · <strong>Click for full payment list ↗</strong></span>
        <span style="color: var(--burgundy); font-weight: 700;" id="contrib-count-text">16 Paid Items</span>
      </div>
    </div>
  `;

  const groomPaidTotal = reconciledPaidRecords.filter(r => r.payer === "Soya").reduce((sum, r) => sum + (r.paid || 0), 0);
  const bridePaidTotal = reconciledPaidRecords.filter(r => r.payer === "Rin").reduce((sum, r) => sum + (r.paid || 0), 0);
  const groomPct = reconciledPaid > 0 ? ((groomPaidTotal / reconciledPaid) * 100).toFixed(1) : "0.0";
  const bridePct = reconciledPaid > 0 ? ((bridePaidTotal / reconciledPaid) * 100).toFixed(1) : "0.0";

  // Spending data across all phases
  const phaseData = [
    {
      id: "sanding",
      name: "Sanding (Royale Palace)",
      short: "Sanding",
      amount: 3500,
      pct: ((3500 / reconciledPaid) * 100).toFixed(1),
      color: "#6B1D2F",
      count: 2,
      packageRef: "Package RM 17,500",
      sayedAmount: 3500,
      sayedPct: 100.0,
      shamiraAmount: 0,
      shamiraPct: 0.0,
      notes: "Royale Palace booking RM1,000 + payment RM2,500 (Balance RM14,000)"
    },
    {
      id: "nikah",
      name: "Nikah (Masjid Raja Haji Fisabilillah)",
      short: "Nikah",
      amount: 1538,
      pct: ((1538 / reconciledPaid) * 100).toFixed(1),
      color: "#0EA5E9",
      count: 5,
      packageRef: "Budget RM 2,000",
      sayedAmount: 1538,
      sayedPct: 100.0,
      shamiraAmount: 0,
      shamiraPct: 0.0,
      notes: "Kursus kahwin, attire rental, shoes, Pandora & Elfi rings"
    },
    {
      id: "tunang",
      name: "Tunang (Gastrohub Event House)",
      short: "Tunang",
      amount: 1300,
      pct: ((1300 / reconciledPaid) * 100).toFixed(1),
      color: "#588157",
      count: 4,
      packageRef: "Identified RM 3,549",
      sayedAmount: 750,
      sayedPct: 57.7,
      shamiraAmount: 550,
      shamiraPct: 42.3,
      notes: "Gastrohub RM500, Pelamin RM50, Avenys rings RM600, 2 Desserts RM150"
    },
    {
      id: "shared",
      name: "Photo & Video (Nikah+Sanding)",
      short: "Photo/Video",
      amount: 1150,
      pct: ((1150 / reconciledPaid) * 100).toFixed(1),
      color: "#1B1818",
      count: 3,
      packageRef: "Committed Vendors",
      sayedAmount: 1150,
      sayedPct: 100.0,
      shamiraAmount: 0,
      shamiraPct: 0.0,
      notes: "Nazeem photo RM300, Deloka video RM200 (revised), Sejeda RM300, Bridal rental RM650"
    },
    {
      id: "merisik",
      name: "Merisik (Completed)",
      short: "Merisik",
      amount: 510,
      pct: ((510 / reconciledPaid) * 100).toFixed(1),
      color: "#5C5555",
      count: 2,
      packageRef: "Fully Settled",
      sayedAmount: 0,
      sayedPct: 0.0,
      shamiraAmount: 510,
      shamiraPct: 100.0,
      notes: "Venue booking RM250 + food RM260 paid by Bride"
    }
  ];

  const totalSplit = {
    title: "Contribution Split",
    badge: "100% Zero Debt",
    sayedAmount: groomPaidTotal,
    sayedPct: groomPct,
    shamiraAmount: bridePaidTotal,
    shamiraPct: bridePct,
    tip: "Hover charts for event split · <strong>Click for full payment list ↗</strong>",
    countText: `${paidTransactionsCount} Paid Transactions`
  };

  // Interactive Hover Reaction for Contribution Split (Point 4.a & 4.b)
  function highlightPhase(idx) {
    const p = phaseData[idx];
    const centerLabel = rightCard.querySelector("#donut-center-label");
    const centerVal = rightCard.querySelector("#donut-center-value");
    const centerSub = rightCard.querySelector("#donut-center-sub");
    if (centerLabel && centerVal && centerSub) {
      centerLabel.textContent = p.short.toUpperCase();
      centerVal.textContent = "RM " + p.amount.toLocaleString();
      centerVal.setAttribute("fill", p.color);
      centerSub.textContent = p.pct + "% of Total (" + p.count + " items)";
    }
    rightCard.querySelectorAll(".donut-slice").forEach((s, i) => {
      if (i === idx) {
        s.classList.add("is-hovered");
        s.setAttribute("stroke-width", "32");
        s.style.opacity = "1";
      } else {
        s.classList.remove("is-hovered");
        s.setAttribute("stroke-width", "22");
        s.style.opacity = "0.35";
      }
    });
    rightCard.querySelectorAll(".donut-legend-row").forEach((r, i) => {
      if (i === idx) r.classList.add("is-hovered");
      else r.classList.remove("is-hovered");
    });
    rightCard.querySelectorAll(".bar-card-item").forEach((b, i) => {
      if (i === idx) b.classList.add("is-hovered");
      else b.classList.remove("is-hovered");
    });

    // Animate Contribution Split Card to reflect this phase
    const cTitle = rightCard.querySelector("#contrib-title");
    const cBadge = rightCard.querySelector("#contrib-badge");
    const cSayedLbl = rightCard.querySelector("#contrib-sayed-label");
    const cSayedVal = rightCard.querySelector("#contrib-sayed-val");
    const cSayedFill = rightCard.querySelector("#contrib-sayed-fill");
    const cShamiraLbl = rightCard.querySelector("#contrib-shamira-label");
    const cShamiraVal = rightCard.querySelector("#contrib-shamira-val");
    const cShamiraFill = rightCard.querySelector("#contrib-shamira-fill");
    const cTip = rightCard.querySelector("#contrib-tip-text");
    const cCount = rightCard.querySelector("#contrib-count-text");

    if (cTitle) cTitle.textContent = `Contribution Split · ${p.short} (RM ${p.amount.toLocaleString()})`;
    if (cBadge) {
      cBadge.textContent = `${p.pct}% of Total`;
      cBadge.style.background = p.color;
      cBadge.style.color = "#FFFFFF";
    }
    if (cSayedLbl) cSayedLbl.textContent = `👤 Sayed Arif (${p.sayedPct}%)`;
    if (cSayedVal) cSayedVal.textContent = `RM ${p.sayedAmount.toLocaleString()}.00`;
    if (cSayedFill) cSayedFill.style.width = `${p.sayedPct}%`;
    if (cShamiraLbl) cShamiraLbl.textContent = `👤 Nor Shamira (${p.shamiraPct}%)`;
    if (cShamiraVal) cShamiraVal.textContent = `RM ${p.shamiraAmount.toLocaleString()}.00`;
    if (cShamiraFill) cShamiraFill.style.width = `${p.shamiraPct}%`;
    if (cTip) cTip.innerHTML = `<strong>${p.short} focus:</strong> ${p.notes}`;
    if (cCount) cCount.textContent = `${p.count} Paid Items`;
  }

  function resetPhase() {
    const centerLabel = rightCard.querySelector("#donut-center-label");
    const centerVal = rightCard.querySelector("#donut-center-value");
    const centerSub = rightCard.querySelector("#donut-center-sub");
    if (centerLabel && centerVal && centerSub) {
      centerLabel.textContent = "TOTAL SPENT";
      centerVal.textContent = money(reconciledPaid).replace(".00", "");
      centerVal.setAttribute("fill", "#6B1D2F");
      centerSub.textContent = "by Phase";
    }
    rightCard.querySelectorAll(".donut-slice").forEach(s => {
      s.classList.remove("is-hovered");
      s.setAttribute("stroke-width", "24");
      s.style.opacity = "1";
    });
    rightCard.querySelectorAll(".donut-legend-row").forEach(r => {
      r.classList.remove("is-hovered");
    });
    rightCard.querySelectorAll(".bar-card-item").forEach(b => {
      b.classList.remove("is-hovered");
    });

    // Reset Contribution Split Card to overall total
    const cTitle = rightCard.querySelector("#contrib-title");
    const cBadge = rightCard.querySelector("#contrib-badge");
    const cSayedLbl = rightCard.querySelector("#contrib-sayed-label");
    const cSayedVal = rightCard.querySelector("#contrib-sayed-val");
    const cSayedFill = rightCard.querySelector("#contrib-sayed-fill");
    const cShamiraLbl = rightCard.querySelector("#contrib-shamira-label");
    const cShamiraVal = rightCard.querySelector("#contrib-shamira-val");
    const cShamiraFill = rightCard.querySelector("#contrib-shamira-fill");
    const cTip = rightCard.querySelector("#contrib-tip-text");
    const cCount = rightCard.querySelector("#contrib-count-text");

    if (cTitle) cTitle.textContent = totalSplit.title;
    if (cBadge) {
      cBadge.textContent = totalSplit.badge;
      cBadge.style.background = "#DCFCE7";
      cBadge.style.color = "#15803D";
    }
    if (cSayedLbl) cSayedLbl.textContent = `👤 Sayed Arif (${totalSplit.sayedPct}%)`;
    if (cSayedVal) cSayedVal.textContent = `RM ${totalSplit.sayedAmount.toLocaleString()}.00`;
    if (cSayedFill) cSayedFill.style.width = `${totalSplit.sayedPct}%`;
    if (cShamiraLbl) cShamiraLbl.textContent = `👤 Nor Shamira (${totalSplit.shamiraPct}%)`;
    if (cShamiraVal) cShamiraVal.textContent = `RM ${totalSplit.shamiraAmount.toLocaleString()}.00`;
    if (cShamiraFill) cShamiraFill.style.width = `${totalSplit.shamiraPct}%`;
    if (cTip) cTip.innerHTML = totalSplit.tip;
    if (cCount) cCount.textContent = totalSplit.countText;
  }

  function openPhaseModal(p) {
    const allReconciled = getReconciledPayments();
    const phaseRecords = allReconciled.filter(r =>
      r.phaseId === p.id ||
      r.phase.toLowerCase() === p.short.toLowerCase() ||
      (p.id === "shared" && (r.phaseId === "shared" || r.phase === "Photo/Video" || (r.event || "").includes("Nikah+Sanding")))
    );
    let modalSort = "desc";

    function showModalContent() {
      const sorted = [...phaseRecords].sort((a, b) => {
        const pA = a.paid || 0;
        const pB = b.paid || 0;
        return modalSort === "asc" ? pA - pB : pB - pA;
      });

      openDetailModal(`${p.name} - Expenses Breakdown`, `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <div>
            <h4 style="font-family: var(--font-serif); font-size: 18px; color: ${p.color}; margin: 0;">${p.name}: RM ${p.amount.toLocaleString()}</h4>
            <span style="font-size: 12px; color: var(--charcoal-muted);">${p.pct}% of total spent · ${phaseRecords.length} reconciled payment items · Sayed: RM ${p.sayedAmount.toLocaleString()} (${p.sayedPct}%), Shamira: RM ${p.shamiraAmount.toLocaleString()} (${p.shamiraPct}%)</span>
          </div>
          <button type="button" class="quick-action-btn" onclick="document.getElementById('detail-modal').close(); location.hash = '#expenses';">All Expenses ↗</button>
        </div>
        <div class="table-wrap" style="overflow-x: auto;">
          <table class="stream-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th class="col-no">No.</th>
                <th style="width: 80px;">Date</th>
                <th>Item Description</th>
                <th style="width: 90px;">Payer</th>
                <th class="sortable-th" id="phase-sort-amount" style="width: 120px; text-align: right;" title="Click to sort by Amount (asc/desc)">
                  Amount (RM) <span class="sort-icon">${modalSort === "asc" ? "▲" : "▼"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((e, idx) => `
                <tr>
                  <td class="col-no">${idx + 1}</td>
                  <td style="font-size: 11px; color: var(--charcoal-muted);">${e.date ? date(e.date) : "—"}</td>
                  <td>
                    <strong>${e.title}</strong>
                    ${e.detail ? `<div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">${e.detail}</div>` : ""}
                    ${e.sources && e.sources.length ? `
                      <div style="margin-top: 4px; display: flex; gap: 4px; flex-wrap: wrap;">
                        ${e.sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip" style="font-size: 10px; padding: 1px 6px;">${s.label} ↗</a>`).join("")}
                      </div>
                    ` : ""}
                  </td>
                  <td>${renderPersonChip(e.payer)}</td>
                  <td style="text-align: right; font-weight: 700; color: var(--burgundy);">RM ${(e.paid ?? 0).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `);

      document.getElementById("phase-sort-amount")?.addEventListener("click", () => {
        modalSort = modalSort === "desc" ? "asc" : "desc";
        showModalContent();
      });
    }

    showModalContent();
  }

  // 1. Render Interactive Pie/Donut Chart
  const pieWrap = rightCard.querySelector("#chart-view-pie");
  if (pieWrap) {
    const radius = 68;
    const circumference = 2 * Math.PI * radius; // ~427.26
    let accumulatedOffset = 0;
    
    const slicesSvg = phaseData.map((p, idx) => {
      const sliceLen = (p.pct / 100) * circumference;
      const offset = accumulatedOffset;
      accumulatedOffset += sliceLen;
      return `
        <circle cx="95" cy="95" r="${radius}"
          fill="none"
          stroke="${p.color}"
          stroke-width="24"
          stroke-dasharray="${sliceLen.toFixed(2)} ${(circumference - sliceLen).toFixed(2)}"
          stroke-dashoffset="${(-offset).toFixed(2)}"
          class="donut-slice"
          data-index="${idx}"
        />
      `;
    }).join("");

    pieWrap.innerHTML = `
      <div style="display: flex; gap: 18px; align-items: center;">
        <div style="flex-shrink: 0; width: 190px; height: 190px;">
          <svg viewBox="0 0 190 190" style="width: 100%; height: 100%; transform: rotate(-90deg);">
            <circle cx="95" cy="95" r="${radius}" fill="none" stroke="#F4EFEA" stroke-width="24" />
            ${slicesSvg}
            <g transform="rotate(90 95 95)">
              <text id="donut-center-label" x="95" y="84" text-anchor="middle" font-size="9" font-weight="700" fill="#8A8282" letter-spacing="0.5px">TOTAL SPENT</text>
              <text id="donut-center-value" x="95" y="105" text-anchor="middle" font-size="16" font-weight="800" fill="#6B1D2F">${money(reconciledPaid).replace(".00", "")}</text>
              <text id="donut-center-sub" x="95" y="120" text-anchor="middle" font-size="9" font-weight="600" fill="#5C5555">by Phase</text>
            </g>
          </svg>
        </div>
        <div style="flex: 1; font-size: 11px; display: flex; flex-direction: column; gap: 6px;">
          ${phaseData.map((p, idx) => `
            <div class="donut-legend-row" data-index="${idx}" title="${p.name}: RM ${p.amount.toLocaleString()} (${p.pct}%) · Hover to see split, click for receipts">
              <div style="display: flex; align-items: center; gap: 7px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: ${p.color}; flex-shrink: 0;"></span>
                <span style="font-weight: 600; color: var(--charcoal);">${p.short}</span>
              </div>
              <strong style="color: var(--burgundy); font-size: 12px;">RM ${p.amount.toLocaleString()} <span style="font-size: 10px; color: var(--charcoal-muted); font-weight: normal;">(${p.pct}%)</span></strong>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    pieWrap.querySelectorAll(".donut-slice").forEach((slice, idx) => {
      slice.addEventListener("mouseenter", () => highlightPhase(idx));
      slice.addEventListener("mouseleave", resetPhase);
      slice.addEventListener("click", () => openPhaseModal(phaseData[idx]));
    });

    pieWrap.querySelectorAll(".donut-legend-row").forEach((row, idx) => {
      row.addEventListener("mouseenter", () => highlightPhase(idx));
      row.addEventListener("mouseleave", resetPhase);
      row.addEventListener("click", () => openPhaseModal(phaseData[idx]));
    });
  }

  // 2. Render Expanded Bar Chart (Point 4.b: Fills empty space aesthetically)
  const barWrap = rightCard.querySelector("#chart-view-bar");
  if (barWrap) {
    barWrap.innerHTML = `
      <div class="bar-chart-expanded">
        ${phaseData.map((p, idx) => `
          <div class="bar-card-item" data-index="${idx}" title="${p.name}: RM ${p.amount.toLocaleString()} (${p.pct}%) · Hover to see contribution split, click for receipts">
            <div class="bar-card-header">
              <div class="bar-card-title">
                <span style="width: 9px; height: 9px; border-radius: 50%; background: ${p.color}; flex-shrink: 0;"></span>
                <span>${p.name}</span>
              </div>
              <span class="bar-card-val">RM ${p.amount.toLocaleString()} <span style="font-size: 10px; color: var(--charcoal-muted); font-weight: normal;">(${p.pct}%)</span></span>
            </div>
            <div class="bar-card-track">
              <div class="bar-card-fill" style="width: ${p.pct}%; background: ${p.color};"></div>
            </div>
            <div class="bar-card-footer">
              <span>Payer Split: <strong>Sayed RM ${p.sayedAmount.toLocaleString()} (${p.sayedPct}%) · Shamira RM ${p.shamiraAmount.toLocaleString()} (${p.shamiraPct}%)</strong></span>
              <span style="font-weight: 700; color: var(--burgundy);">${p.packageRef}</span>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    barWrap.querySelectorAll(".bar-card-item").forEach((cardItem, idx) => {
      cardItem.addEventListener("mouseenter", () => highlightPhase(idx));
      cardItem.addEventListener("mouseleave", resetPhase);
      cardItem.addEventListener("click", () => openPhaseModal(phaseData[idx]));
    });
  }

  // 3. Render Growth Line Chart with Dual Subtle Split Gradient (Point 4.c)
  const lineWrap = rightCard.querySelector("#chart-view-line");
  if (lineWrap) {
    lineWrap.innerHTML = `
      <div style="width: 100%; height: 210px;">
        <svg viewBox="0 0 460 200" style="width: 100%; height: 100%;">
          <defs>
            <!-- Sayed Contribution Gradient (Burgundy) -->
            <linearGradient id="lineSayedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#6B1D2F" stop-opacity="0.30"/>
              <stop offset="100%" stop-color="#6B1D2F" stop-opacity="0.02"/>
            </linearGradient>
            <!-- Shamira Contribution Gradient (Rose Subtle) -->
            <linearGradient id="lineShamiraGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#EC4899" stop-opacity="0.22"/>
              <stop offset="100%" stop-color="#EC4899" stop-opacity="0.02"/>
            </linearGradient>
          </defs>

          <!-- Budget Target Line RM 25k -->
          <line x1="50" y1="30" x2="430" y2="30" stroke="#6B1D2F" stroke-width="1.2" stroke-dasharray="4 4" />
          <text x="45" y="33" text-anchor="end" font-size="9" font-weight="700" fill="#6B1D2F">25k</text>
          <text x="425" y="24" text-anchor="end" font-size="9" font-weight="800" fill="#6B1D2F">TOTAL BUDGET RM 25,000</text>

          <!-- Grid Lines -->
          <line x1="50" y1="80" x2="430" y2="80" stroke="#E5DFD7" stroke-width="1" />
          <text x="45" y="83" text-anchor="end" font-size="9" fill="#8A8282">15k</text>

          <line x1="50" y1="130" x2="430" y2="130" stroke="#E5DFD7" stroke-width="1" />
          <text x="45" y="133" text-anchor="end" font-size="9" fill="#8A8282">7k</text>

          <line x1="50" y1="175" x2="430" y2="175" stroke="#D5CCC2" stroke-width="1" />
          <text x="45" y="178" text-anchor="end" font-size="9" fill="#8A8282">0</text>

          <!-- Subtle Contribution Split Legend on Line Chart -->
          <g transform="translate(52, 48)">
            <circle cx="4" cy="4" r="3.5" fill="#6B1D2F"/>
            <text x="11" y="7" font-size="8.5" fill="#6B1D2F" font-weight="700">Sayed (75.2%)</text>
            <circle cx="85" cy="4" r="3.5" fill="#EC4899"/>
            <text x="92" y="7" font-size="8.5" fill="#EC4899" font-weight="700">Shamira (24.8%)</text>
          </g>

          <!-- Shaded Area for Sayed (Burgundy Gradient) -->
          <polygon points="50,175 50,171 140,131 140,175" fill="url(#lineSayedGrad)" />

          <!-- Subtle Shaded Layer for Shamira (Rose Gradient) -->
          <polygon points="50,175 50,173 140,158 140,175" fill="url(#lineShamiraGrad)" />

          <!-- Dotted Forecast Path to Sanding -->
          <path d="M 140 131 L 220 120 L 320 95 L 430 35" fill="none" stroke="#1B1818" stroke-width="2" stroke-dasharray="4 4" />

          <!-- Solid Actual Path to Today -->
          <path d="M 50 171 L 140 131" fill="none" stroke="#6B1D2F" stroke-width="3" stroke-linecap="round" />

          <!-- Today Node -->
          <circle cx="140" cy="131" r="5" fill="#6B1D2F" stroke="#FFFFFF" stroke-width="2" />
          <text x="140" y="121" text-anchor="middle" font-size="10" font-weight="800" fill="#6B1D2F">${money(reconciledPaid).replace(".00", "")}</text>

          <!-- Final Node -->
          <circle cx="430" cy="35" r="4.5" fill="#1B1818" stroke="#FFFFFF" stroke-width="2" />
          <text x="425" y="48" text-anchor="end" font-size="9" font-weight="800" fill="#1B1818">Expected: RM 24,500</text>

          <!-- Phase Labels -->
          <text x="50" y="190" text-anchor="middle" font-size="9" fill="#8A8282">Merisik</text>
          <text x="140" y="190" text-anchor="middle" font-size="9" font-weight="700" fill="#6B1D2F">Today</text>
          <text x="220" y="190" text-anchor="middle" font-size="9" fill="#8A8282">Tunang</text>
          <text x="320" y="190" text-anchor="middle" font-size="9" fill="#8A8282">Nikah</text>
          <text x="430" y="190" text-anchor="middle" font-size="9" fill="#8A8282">Sanding</text>
        </svg>
      </div>
    `;
  }

  // Bind Chart Switcher Tabs
  rightCard.querySelectorAll("#chart-view-tabs .chart-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      rightCard.querySelectorAll("#chart-view-tabs .chart-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.chart;
      rightCard.querySelectorAll(".chart-view").forEach(v => v.classList.remove("active"));
      rightCard.querySelector(`#chart-view-${target}`)?.classList.add("active");
    });
  });

  // 4. Chart Expand / Minimize Pop-Up Modal (Point 4.d)
  function openChartExpandModal() {
    let expandRecords = getReconciledPayments();
    let expandSort = "desc";

    function showExpandModal() {
      const sorted = [...expandRecords].sort((a, b) => {
        const pA = a.paid || 0;
        const pB = b.paid || 0;
        return expandSort === "asc" ? pA - pB : pB - pA;
      });

      openDetailModal("Expenses Tracking & Phase Analytics (Full View)", `
        <div class="chart-large-modal-content">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
            <div>
              <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--burgundy); margin: 0;">Wedding Budget Allocation &amp; Payer Split</h4>
              <span style="font-size: 12px; color: var(--charcoal-muted);">Reconciled ${money(reconciledPaid)} of RM 25,000 Budget · Zero Debt Guarantee</span>
            </div>
            <button type="button" class="quick-action-btn" id="modal-minimize-btn" onclick="document.getElementById('detail-modal').close();">⤓ Minimize (Back to Dashboard)</button>
          </div>

          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px;">
            ${phaseData.map(p => `
              <div style="background: var(--bg-soft); border: 1px solid var(--border); border-top: 3px solid ${p.color}; border-radius: 8px; padding: 10px;">
                <div style="font-size: 11px; font-weight: 700; color: var(--charcoal);">${p.name}</div>
                <div style="font-size: 16px; font-weight: 800; color: ${p.color}; margin: 4px 0;">RM ${p.amount.toLocaleString()}</div>
                <div style="font-size: 10px; color: var(--charcoal-muted);">${p.pct}% of total · ${p.count} payments</div>
                <div style="font-size: 9.5px; color: var(--charcoal); margin-top: 4px; border-top: 1px solid var(--border); padding-top: 4px;">
                  Sayed: RM ${p.sayedAmount.toLocaleString()} · Shamira: RM ${p.shamiraAmount.toLocaleString()}
                </div>
              </div>
            `).join("")}
          </div>

          <div style="background: var(--burgundy-soft); border: 1px solid var(--burgundy-border); border-radius: 10px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; color: var(--burgundy); margin-bottom: 6px;">
              <span>Cumulative Contribution: Sayed (${groomPct}%) vs Shamira (${bridePct}%)</span>
              <span>Zero Debt Verified</span>
            </div>
            <div style="height: 14px; background: #FFFFFF; border-radius: 9999px; overflow: hidden; display: flex; border: 1px solid var(--border);">
              <div style="width: ${groomPct}%; background: #6B1D2F;" title="Sayed: RM ${groomPaidTotal.toLocaleString()} (${groomPct}%)"></div>
              <div style="width: ${bridePct}%; background: #1B1818;" title="Shamira: RM ${bridePaidTotal.toLocaleString()} (${bridePct}%)"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--charcoal); margin-top: 6px;">
              <span><strong>Sayed Arif:</strong> RM ${groomPaidTotal.toLocaleString()}.00 (${groomPct}% · 12 receipts)</span>
              <span><strong>Nor Shamira:</strong> RM ${bridePaidTotal.toLocaleString()}.00 (${bridePct}% · 4 receipts)</span>
            </div>
          </div>

          <h5 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin-bottom: 8px;">Reconciled Transactions by Phase (16 Verified Payments · 0 Duplicates)</h5>
          <div class="table-wrap" style="overflow-x: auto;">
            <table class="stream-table" style="font-size: 12px;">
              <thead>
                <tr>
                  <th class="col-no">No.</th>
                  <th style="width: 80px;">Date</th>
                  <th>Action Item</th>
                  <th style="width: 90px;">Phase</th>
                  <th style="width: 80px;">Payer</th>
                  <th class="sortable-th" id="expand-sort-amount" style="width: 120px; text-align: right;" title="Click to sort by Amount (asc/desc)">
                    Amount (RM) <span class="sort-icon">${expandSort === "asc" ? "▲" : "▼"}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                ${sorted.map((e, idx) => `
                  <tr>
                    <td class="col-no">${idx + 1}</td>
                    <td style="font-size: 11px; color: var(--charcoal-muted);">${e.date ? date(e.date) : "—"}</td>
                    <td><strong>${e.title}</strong></td>
                    <td>${renderPhaseChip(e.event)}</td>
                    <td>${renderPersonChip(e.payer)}</td>
                    <td style="text-align: right; font-weight: 700; color: var(--burgundy);">RM ${(e.paid ?? 0).toLocaleString()}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 14px; display: flex; justify-content: flex-end;">
            <button type="button" class="quick-action-btn" onclick="document.getElementById('detail-modal').close();">⤓ Minimize</button>
          </div>
        </div>
      `);

      document.getElementById("expand-sort-amount")?.addEventListener("click", () => {
        expandSort = expandSort === "desc" ? "asc" : "desc";
        showExpandModal();
      });
    }

    showExpandModal();
  }

  rightCard.querySelector("#btn-chart-expand")?.addEventListener("click", openChartExpandModal);

  // Wire up Detailed Contribution Split Modal (Click Feature)
  rightCard.querySelector("#contribution-split-card")?.addEventListener("click", () => {
    let expenseRecords = getReconciledPayments();
    let splitSort = "desc";

    function showSplitModal() {
      const sorted = [...expenseRecords].sort((a, b) => {
        const pA = a.paid || 0;
        const pB = b.paid || 0;
        return splitSort === "asc" ? pA - pB : pB - pA;
      });

      openDetailModal("Contribution Split Details (Who Paid What)", `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
          <div>
            <h4 style="font-family: var(--font-serif); font-size: 18px; color: var(--charcoal); margin: 0;">Total Reconciled: ${money(reconciledPaid)}</h4>
            <span style="font-size: 12px; color: var(--charcoal-muted);">100% Zero Debt · Tracked with Official Receipts</span>
          </div>
          <button type="button" class="quick-action-btn" onclick="document.getElementById('detail-modal').close(); location.hash = '#expenses';">All Expense Records ↗</button>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px;">
          <div style="background: var(--burgundy-soft); border: 1px solid var(--burgundy-border); border-radius: 10px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: var(--burgundy);">👤 SAYED ARIF HAKIMI (${groomPct}%)</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--burgundy); font-family: var(--font-serif); margin: 4px 0;">${money(groomPaidTotal)}</div>
            <div style="font-size: 11px; color: var(--charcoal-muted);">12 verified receipts: Royale Palace deposits, rings, photography, attire, course</div>
          </div>
          <div style="background: var(--bg-soft); border: 1px solid var(--border); border-radius: 10px; padding: 12px;">
            <div style="font-size: 11px; font-weight: 800; color: var(--charcoal);">👤 NOR SHAMIRA IRWANI (${bridePct}%)</div>
            <div style="font-size: 20px; font-weight: 800; color: var(--charcoal); font-family: var(--font-serif); margin: 4px 0;">${money(bridePaidTotal)}</div>
            <div style="font-size: 11px; color: var(--charcoal-muted);">4 verified receipts: Gastrohub Tunang deposit, Pelamin deposit, Merisik venue &amp; food</div>
          </div>
        </div>

        <h5 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin-bottom: 8px;">All 16 Reconciled Payments (0 Duplicates)</h5>
        <div class="table-wrap" style="overflow-x: auto;">
          <table class="stream-table" style="font-size: 12px;">
            <thead>
              <tr>
                <th class="col-no">No.</th>
                <th style="width: 75px;">Date</th>
                <th>Item Description</th>
                <th style="width: 90px;">Phase</th>
                <th style="width: 80px;">Paid By</th>
                <th class="sortable-th" id="split-sort-amount" style="width: 120px; text-align: right;" title="Click to sort by Amount (asc/desc)">
                  Amount (RM) <span class="sort-icon">${splitSort === "asc" ? "▲" : "▼"}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              ${sorted.map((e, idx) => `
                <tr>
                  <td class="col-no">${idx + 1}</td>
                  <td style="font-size: 11px; color: var(--charcoal-muted);">${e.date ? date(e.date) : "—"}</td>
                  <td><strong>${e.title}</strong></td>
                  <td>${renderPhaseChip(e.event)}</td>
                  <td>${renderPersonChip(e.payer)}</td>
                  <td style="text-align: right; font-weight: 700; color: var(--burgundy);">RM ${(e.paid ?? 0).toLocaleString()}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `);

      document.getElementById("split-sort-amount")?.addEventListener("click", () => {
        splitSort = splitSort === "desc" ? "asc" : "desc";
        showSplitModal();
      });
    }

    showSplitModal();
  });

  cockpit.append(leftCard, rightCard);

  // 3. Clickable Buttons to Change Tabs After the Dashboard Container (Simpler 4-Tab Architecture)
  const bottomTabs = make("div", "bottom-tab-switcher");
  bottomTabs.innerHTML = `
    <div class="bottom-tab-title">
      <span>📂</span> Jump to Other Wedding Sections:
    </div>
    <div class="bottom-tab-buttons">
      <button type="button" class="tab-jump-btn" data-tab="checklist">📋 Checklist (34 Tasks)</button>
      <button type="button" class="tab-jump-btn" data-tab="expenses">💰 Expenses Tracking (40 Records)</button>
      <button type="button" class="tab-jump-btn" data-tab="tentative">📅 Tentative Events (3 Events)</button>
    </div>
  `;

  bottomTabs.querySelectorAll(".tab-jump-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      window.location.hash = `#${tab}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  // Render everything onto parent
  parent.replaceChildren(horizon, cockpit, bottomTabs);
}

/* ========================================================================= */
/* 2. FILTER & TABLE CONTROLS                                                */
/* ========================================================================= */
function filter(parent, records, fields, renderList, initialQuery = "") {
  const controls = make("div", "controls-bar");
  const input = make("input");
  input.placeholder = "Filter records…";
  input.setAttribute("aria-label", "Filter records");
  if (initialQuery) {
    input.value = initialQuery;
  }
  controls.append(input);
  
  const selects = fields.map(([key, title]) => {
    const select = make("select");
    select.setAttribute("aria-label", title);
    select.append(new Option(title, ""));
    for (const item of [...new Set(records.map(r => r[key]).filter(Boolean))].sort()) {
      select.append(new Option(item, item));
    }
    controls.append(select);
    return select;
  });
  
  const output = make("div");
  function update() {
    const q = input.value.toLowerCase().trim();
    const filtered = records.filter(r =>
      (!q || [r.title, r.event, r.detail, r.vendor, r.category, r.owner, r.payer].some(x => x?.toLowerCase().includes(q))) &&
      fields.every(([key], i) => !selects[i].value || selects[i].value === r[key])
    );
    output.replaceChildren(make("p", "section-caption", filtered.length + " matching records"), renderList(filtered));
  }
  input.addEventListener("input", update);
  selects.forEach(select => select.addEventListener("change", update));
  parent.append(controls, output);
  update();
}

function table(records) {
  if (!records.length) return make("p", "empty", "No matching records.");
  const box = make("div", "table-wrap");
  box.tabIndex = 0;
  box.setAttribute("aria-label", "Scrollable payment records");
  const table = make("table");
  const head = table.createTHead().insertRow();
  const labels = ledger === "Buckets"
    ? ["No.", "Planning reference", "Working target", "Confirmed due", "Deadline", "Source"]
    : ["No.", "Payment record", "Amount", "Paid", "Outstanding", "Payer", "Due / paid", "Source"];
  for (const label of labels) {
    const th = make("th", "", label);
    if (label === "No.") th.className = "col-no";
    th.scope = "col";
    head.append(th);
  }
  const body = table.createTBody();
  records.forEach((r, idx) => {
    const row = body.insertRow();
    const cellNo = row.insertCell();
    cellNo.className = "col-no";
    cellNo.textContent = String(idx + 1);

    const item = row.insertCell();
    item.append(make("strong", "", r.title), make("small", "", " · " + [r.event, r.status, r.vendor].filter(Boolean).join(" · ")));
    if (r.detail) {
      const notes = make("details");
      notes.append(make("summary", "", "Details"), make("p", "", r.detail));
      item.append(notes);
    }
    const dates = [r.date && "Due " + date(r.date), r.paidDate && "Paid " + date(r.paidDate)].filter(Boolean).join(" · ");
    const values = ledger === "Buckets" 
      ? [money(r.amount), money(r.outstanding), date(r.date)]
      : [money(r.amount), money(r.paid), money(r.outstanding), r.payer ?? "—", dates || "—"];
    for (const value of values) row.insertCell().textContent = value;
    row.insertCell().append(...r.sources.map(sourceLink));
  });
  box.append(table);
  return box;
}

/* ========================================================================= */
/* 3. EXPENSES VIEW (CENTRALIZED MASTER TRACKING & RECONCILED METRICS)       */
/* ========================================================================= */
function expenses(parent, records) {
  if (!isAuthenticated) {
    const lockedCard = make("div", "gauge-card");
    lockedCard.innerHTML = `
      <div class="gauge-header">
        <span class="gauge-eyebrow">Private Financial Ledgers Locked</span>
        <span class="status-chip pending">🔒 Authentication Required</span>
      </div>
      <p style="font-size: 13px; color: var(--charcoal-muted); line-height: 1.6;">
        Payment ledgers (Notion database records & Google Drive receipt sheets) are private to Soya and Rin. Enter your family passcode to decrypt and browse all 40 transaction records.
      </p>
      <div style="display: flex; gap: 10px; align-items: center; padding-top: 4px;">
        <button type="button" class="auth-action-btn signed-in" onclick="document.getElementById('auth-dialog').showModal()">
          <span>Sign In as Soya &amp; Rin</span>
        </button>
      </div>
    `;
    parent.append(lockedCard);
    return;
  }

  // 1. The 3 Main Cards: Notion, Drive, Reconciled (Expenses Point 1)
  const gauges = make("div", "gauges-grid");

  // Card 1: Notion
  const notionPaid = records.filter(r => r.ledger === "Notion" && r.paid > 0);
  const notionCents = notionPaid.reduce((sum, r) => sum + Math.round((r.paid || 0) * 100), 0);
  const gNotion = make("div", "gauge-card");
  gNotion.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="gauge-eyebrow">1. NOTION DATABASE</span>
      <span class="pill-chip" style="background: #FEF3C7; color: #92400E; font-size: 10px; font-weight: 700;">+RM 198 Variance</span>
    </div>
    <span class="gauge-primary">${money(notionCents / 100)}</span>
    <span class="section-caption">Includes RM 198 Elfi gift ring · ${notionPaid.length} paid entries</span>
  `;

  // Card 2: Drive
  const drivePaid = records.filter(r => r.ledger === "Drive" && r.paid > 0);
  const driveCents = drivePaid.reduce((sum, r) => sum + Math.round((r.paid || 0) * 100), 0);
  const gDrive = make("div", "gauge-card");
  gDrive.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="gauge-eyebrow">2. GOOGLE DRIVE SHEET</span>
      <span class="pill-chip" style="background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700;">✓ Sheet Updated</span>
    </div>
    <span class="gauge-primary">${money(driveCents / 100)}</span>
    <span class="section-caption">Rings updated in Sheet · ${drivePaid.length} paid entries</span>
  `;

  // Card 3: Reconciled
  const gRecon = make("div", "gauge-card");
  const reconciledTotal = driveCents / 100;
  const groomPaidTotal = drivePaid.filter(r => (r.payer || r.owner) === "Groom").reduce((sum, r) => sum + (r.paid || 0), 0);
  const bridePaidTotal = drivePaid.filter(r => (r.payer || r.owner) === "Bride").reduce((sum, r) => sum + (r.paid || 0), 0);
  const groomPct = reconciledTotal > 0 ? ((groomPaidTotal / reconciledTotal) * 100).toFixed(1) : "0.0";
  const bridePct = reconciledTotal > 0 ? ((bridePaidTotal / reconciledTotal) * 100).toFixed(1) : "0.0";

  gRecon.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span class="gauge-eyebrow">3. RECONCILED MASTER TOTAL</span>
      <span class="pill-chip" style="background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700;">✓ 100% Cash Financed</span>
    </div>
    <span class="gauge-primary" style="color: var(--burgundy);">${money(reconciledTotal)}</span>
    <span class="section-caption">Sayed ${money(groomPaidTotal)} (${groomPct}%) · Shamira ${money(bridePaidTotal)} (${bridePct}%) · ${drivePaid.length} Receipts</span>
  `;

  gauges.append(gNotion, gDrive, gRecon);

  // Sync / Variance Reconciliation Explainer Banner
  const banner = make("div", "reconciled-sync-banner");
  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 20px;">⚖️</span>
      <div>
        <strong>Database Reconciliation Status:</strong>
        <span>Google Drive Sheet contains ${drivePaid.length} verified payment transactions totaling <strong>${money(reconciledTotal)}</strong>. Notion records ${money(notionCents / 100)}. Zero Debt Guardrail active — all obligations cash funded.</span>
      </div>
    </div>
    <div style="display: flex; gap: 8px; flex-shrink: 0;">
      <a href="https://app.notion.com/3c8caff354e78133bb29eca4687f6300" target="_blank" rel="noopener noreferrer" class="source-link-chip">Notion ↗</a>
      <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit?usp=sharing" target="_blank" rel="noopener noreferrer" class="source-link-chip">Sheets ↗</a>
    </div>
  `;

  // 2. Centralized Master Expenses Tracking (Expenses Point 2)
  const masterBox = make("div", "master-expenses-container");

  // Determine Payment Schedule & Status for each record:
  // a. Not started = payment not yet started based on date
  // b. In progress = should pay within the current date to end date
  // c. Completed = payment completed
  function computePaymentInfo(r) {
    let startDate = r.paidDate;
    if (!startDate) {
      if (r.date) {
        const d = new Date(r.date);
        d.setDate(d.getDate() - 60);
        startDate = d.toISOString().split("T")[0];
      } else {
        startDate = "2026-08-01";
      }
    }

    let endDate = r.date || r.paidDate || "2027-11-27";
    const now = new Date();
    const startDt = new Date(startDate);
    const endDt = new Date(endDate);

    let statusKey = "Planned";
    let statusBadge = `<span class="status-badge-notstarted">○ Planned</span>`;

    const isCancelled = r.status === "Cancelled" || (r.title && r.title.includes("CANCELLED"));
    const isContribution = r.category === "Contribution" || r.category === "Sponsorship" || (r.title && r.title.toLowerCase().includes("sponsorship"));
    const isFullyPaid = (r.outstanding === 0 && (r.paid > 0 || r.amount > 0)) || r.status === "Paid" || r.status === "Done" || r.status === "Recorded in Sheet";
    const hasOutstanding = (r.outstanding || 0) > 0;

    if (isCancelled) {
      statusKey = "Cancelled";
      statusBadge = `<span class="status-badge-cancelled" style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">✕ Cancelled</span>`;
    } else if (isContribution) {
      statusKey = "Contributions";
      statusBadge = `<span class="status-badge-contrib" style="background:#E0E7FF;color:#3730A3;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">🎁 Contribution</span>`;
    } else if (hasOutstanding) {
      statusKey = "Outstanding";
      statusBadge = `<span class="status-badge-progress" style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;">⚡ Outstanding</span>`;
    } else if (isFullyPaid) {
      statusKey = "Paid";
      statusBadge = `<span class="status-badge-completed">✓ Paid</span>`;
    } else {
      statusKey = "Planned";
      statusBadge = `<span class="status-badge-notstarted">○ Planned</span>`;
    }

    return {
      startDate,
      endDate,
      scheduleText: `${date(startDate)} – ${date(endDate)}`,
      statusKey,
      statusBadge
    };
  }

  // 1. Consolidated Master Records: exactly 1 entry per transaction (zero duplicates)
  const consolidatedMaster = getConsolidatedMasterRecords(records);
  const enrichedConsolidated = consolidatedMaster.map(r => ({
    ...r,
    _info: computePaymentInfo(r)
  }));
  const enrichedRaw = records.map(r => ({
    ...r,
    _info: computePaymentInfo(r)
  }));

  const initialRecords = enrichedConsolidated;
  const tunangCount = initialRecords.filter(r => (r.event || "").includes("Tunang")).length;
  const nikahCount = initialRecords.filter(r => (r.event || "").includes("Nikah")).length;
  const sandingCount = initialRecords.filter(r => (r.event || "").includes("Sanding")).length;
  const sharedCount = initialRecords.filter(r => !(r.event || "").includes("Tunang") && !(r.event || "").includes("Nikah") && !(r.event || "").includes("Sanding")).length;

  const paidCount = initialRecords.filter(r => r._info.statusKey === "Paid").length;
  const outstandingCount = initialRecords.filter(r => r._info.statusKey === "Outstanding").length;
  const plannedCount = initialRecords.filter(r => r._info.statusKey === "Planned").length;
  const cancelledCount = initialRecords.filter(r => r._info.statusKey === "Cancelled").length;

  masterBox.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Centralized Master Expenses Tracking</h2>
          <p class="section-caption">Single unified tracking ledger consolidating Notion, Drive and budget references across all phases.</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span id="expenses-counter-badge">Showing <strong>${initialRecords.length}</strong> of ${initialRecords.length} Records (Consolidated · 0 Duplicates)</span>
        </div>
      </div>

      <!-- Phase Filter -->
      <div class="checklist-phase-tabs" id="exp-phase-tabs">
        <button type="button" class="checklist-phase-btn active" data-phase="all">All Phases (${initialRecords.length})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Tunang">1. Tunang (${tunangCount})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Nikah">2. Nikah (${nikahCount})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Sanding">3. Sanding (${sandingCount})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Shared">Shared &amp; Admin (${sharedCount})</button>
      </div>

      <!-- Status & Search Row -->
      <div class="checklist-headline-row">
        <div class="filter-pills-group" id="exp-status-pills">
          <button type="button" class="filter-pill active" data-status="all">All Statuses (${initialRecords.length})</button>
          <button type="button" class="filter-pill" data-status="Paid">✓ Paid (${paidCount})</button>
          <button type="button" class="filter-pill" data-status="Outstanding">⚡ Outstanding (${outstandingCount})</button>
          <button type="button" class="filter-pill" data-status="Planned">○ Planned (${plannedCount})</button>
          <button type="button" class="filter-pill" data-status="Cancelled">✕ Cancelled (${cancelledCount})</button>
        </div>
        <div class="checklist-filters-row">
          <input type="text" class="checklist-search-input" id="exp-search" placeholder="Type to search wedding expense records…">
          <select class="checklist-filter-select" id="exp-ledger-select" aria-label="Filter by Source">
            <option value="">All Sources (Consolidated Master · 0 Duplicates)</option>
            <option value="Drive">Google Drive Receipts (16 Verified Payments)</option>
            <option value="Notion">Notion Database (Planning &amp; Ledgers)</option>
            <option value="Buckets">Deadline References (Milestone Envelopes)</option>
          </select>
          <select class="checklist-filter-select" id="exp-payer-select" aria-label="Filter by Payer">
            <option value="">All Payers</option>
            <option value="Soya">Sayed (Soya)</option>
            <option value="Rin">Shamira (Rin)</option>
            <option value="Joint">Joint</option>
          </select>
        </div>
      </div>
    </div>
    <div id="master-table-mount"></div>
  `;

  let curPhase = "all";
  let curStatus = "all";
  let curLedger = "";
  let curPayer = "";
  let curQuery = "";
  let sortField = "";
  let sortDir = "desc";

  function renderMasterTable() {
    const mount = masterBox.querySelector("#master-table-mount");
    if (!mount) return;

    let baseDataset = curLedger === "Drive" ? enrichedRaw.filter(r => r.ledger === "Drive")
                    : curLedger === "Notion" ? enrichedRaw.filter(r => r.ledger === "Notion")
                    : curLedger === "Buckets" ? enrichedRaw.filter(r => r.ledger === "Buckets")
                    : enrichedConsolidated;

    let filtered = baseDataset.filter(r => {
      if (curPhase !== "all") {
        if (curPhase === "Shared") {
          if ((r.event || "").includes("Tunang") || (r.event || "").includes("Nikah") || (r.event || "").includes("Sanding")) return false;
        } else {
          if (!(r.event || "").toLowerCase().includes(curPhase.toLowerCase())) return false;
        }
      }
      if (curStatus !== "all" && r._info.statusKey !== curStatus) return false;
      if (curPayer) {
        const p = (r.payer || "").toLowerCase();
        if (curPayer === "Soya" && !p.includes("soya") && !p.includes("groom") && !p.includes("sayed")) return false;
        if (curPayer === "Rin" && !p.includes("rin") && !p.includes("bride") && !p.includes("shamira")) return false;
        if (curPayer === "Joint" && !p.includes("joint")) return false;
      }
      if (curQuery) {
        const text = [r.title, r.event, r.payer, r.vendor, r.category, r.detail, r.ledger].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(curQuery)) return false;
      }
      return true;
    });

    // Amount sorting (ascending and descending)
    if (sortField) {
      filtered.sort((a, b) => {
        const vA = (a[sortField] != null ? Number(a[sortField]) : 0);
        const vB = (b[sortField] != null ? Number(b[sortField]) : 0);
        if (vA !== vB) {
          return sortDir === "asc" ? vA - vB : vB - vA;
        }
        return (a.title || "").localeCompare(b.title || "");
      });
    }

    const badge = masterBox.querySelector("#expenses-counter-badge");
    if (badge) {
      const modeLabel = curLedger === "" ? " (Consolidated · 0 Duplicates)" : ` (${curLedger} Ledger)`;
      badge.innerHTML = `Showing <strong>${filtered.length}</strong> of ${baseDataset.length} Records${modeLabel}`;
    }

    if (!filtered.length) {
      mount.innerHTML = `<p class="empty" style="padding: 30px; text-align: center;">No matching expense records found.</p>`;
      return;
    }

    const tableWrap = make("div", "table-wrap");
    tableWrap.style.overflowX = "auto";
    const tableEl = make("table", "master-ledger-table");
    tableEl.innerHTML = `
      <thead>
        <tr>
          <th class="col-no">No.</th>
          <th>Action Item</th>
          <th style="width: 105px;">Phase</th>
          <th class="sortable-th" data-sort="amount" style="width: 120px; text-align: right;" title="Click to sort by Total Amount (asc/desc)">
            Total Amount <span class="sort-icon">${sortField === "amount" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
          </th>
          <th class="sortable-th" data-sort="paid" style="width: 105px; text-align: right;" title="Click to sort by Paid (asc/desc)">
            Paid <span class="sort-icon">${sortField === "paid" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
          </th>
          <th class="sortable-th" data-sort="outstanding" style="width: 115px; text-align: right;" title="Click to sort by Outstanding (asc/desc)">
            Outstanding <span class="sort-icon">${sortField === "outstanding" ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
          </th>
          <th style="width: 155px;">Payment Schedule</th>
          <th style="width: 105px;">Status</th>
          <th style="width: 90px;">Source</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((r, idx) => {
          const hasDetail = Boolean(r.detail);
          const metaLine = [r.vendor && `🏢 ${r.vendor}`, r.payer && `👤 ${r.payer}`, r.ledger && `📁 ${r.ledger}`].filter(Boolean).join(" · ");
          return `
            <tr>
              <td class="col-no">${idx + 1}</td>
              <td>
                <div style="font-weight: 700; color: var(--charcoal);">${r.title}</div>
                ${metaLine ? `<div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">${metaLine}</div>` : ""}
                ${hasDetail ? `
                  <details style="margin-top: 4px; font-size: 11px; color: var(--charcoal);">
                    <summary style="cursor: pointer; color: var(--burgundy); font-weight: 600;">View Details</summary>
                    <div style="padding: 6px 8px; background: var(--bg-soft); border-radius: 6px; margin-top: 4px; line-height: 1.5;">${r.detail}</div>
                  </details>
                ` : ""}
              </td>
              <td>${renderPhaseChip(r.event)}</td>
              <td style="text-align: right; font-weight: 700; color: var(--charcoal);">${money(r.amount)}</td>
              <td style="text-align: right; font-weight: 700; color: var(--burgundy);">${money(r.paid)}</td>
              <td style="text-align: right; font-weight: 600; color: ${(r.outstanding || 0) > 0 ? "#D97706" : "var(--charcoal-muted);"}">${money(r.outstanding)}</td>
              <td style="font-size: 11px; color: var(--charcoal-muted);">${r._info.scheduleText}</td>
              <td>${r._info.statusBadge}</td>
              <td>${r.sources?.length ? r.sources.map(sourceLink).map(s => s.outerHTML).join(" ") : "—"}</td>
            </tr>
          `;
        }).join("")}
      </tbody>
    `;

    tableEl.querySelectorAll(".sortable-th").forEach(th => {
      th.addEventListener("click", () => {
        const field = th.dataset.sort;
        if (sortField === field) {
          sortDir = sortDir === "desc" ? "asc" : "desc";
        } else {
          sortField = field;
          sortDir = "desc";
        }
        renderMasterTable();
      });
    });

    tableWrap.append(tableEl);
    mount.replaceChildren(tableWrap);
  }

  masterBox.querySelectorAll("#exp-phase-tabs .checklist-phase-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      masterBox.querySelectorAll("#exp-phase-tabs .checklist-phase-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      curPhase = btn.dataset.phase;
      renderMasterTable();
    });
  });

  masterBox.querySelectorAll("#exp-status-pills .filter-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      masterBox.querySelectorAll("#exp-status-pills .filter-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      curStatus = pill.dataset.status;
      renderMasterTable();
    });
  });

  const searchInp = masterBox.querySelector("#exp-search");
  searchInp?.addEventListener("input", e => {
    curQuery = e.target.value.toLowerCase().trim();
    renderMasterTable();
  });

  const ledgerSel = masterBox.querySelector("#exp-ledger-select");
  ledgerSel?.addEventListener("change", e => {
    curLedger = e.target.value;
    renderMasterTable();
  });

  const payerSel = masterBox.querySelector("#exp-payer-select");
  payerSel?.addEventListener("change", e => {
    curPayer = e.target.value;
    renderMasterTable();
  });

  parent.append(gauges, banner, masterBox);
  renderMasterTable();
}

/* ========================================================================= */
/* 3B. SPACE-EFFICIENT NORMAL CHECKLIST CONTROL (CHECKLIST & PLAN TAB)       */
/* ========================================================================= */
function checklistView(parent, tasks) {
  const doneTasks = tasks.filter(r => r.status === "Done").length;
  const inProgressTasks = tasks.filter(r => r.status === "In progress").length;
  const pendingTasks = tasks.filter(r => r.status === "Not started").length;
  const donePct = ((doneTasks / tasks.length) * 100).toFixed(1);

  const tunangTasks = tasks.filter(t => (t.event || "").includes("Tunang")).length;
  const nikahTasks = tasks.filter(t => (t.event || "").includes("Nikah")).length;
  const sandingTasks = tasks.filter(t => (t.event || "").includes("Sanding")).length;
  const sharedTasks = tasks.filter(t => !(t.event || "").includes("Tunang") && !(t.event || "").includes("Nikah") && !(t.event || "").includes("Sanding")).length;

  const container = make("div", "checklist-control-box");
  container.innerHTML = `
    <div class="checklist-control-head">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Checklist &amp; Action Plan</h2>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span id="chk-counter-badge"><strong>${tasks.length}</strong> Tasks (${doneTasks} Done · ${donePct}%)</span>
          <div class="checklist-mini-bar" title="${donePct}% completed">
            <div class="checklist-mini-bar-fill" id="chk-progress-bar-fill" style="width: ${donePct}%;"></div>
          </div>
        </div>
      </div>

      <!-- Phase Tabs (First Main Filter: Self-explanatory Buttons) -->
      <div class="checklist-phase-tabs" id="chk-phase-tabs">
        <button type="button" class="checklist-phase-btn active" data-phase="all">All Phases (${tasks.length})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Tunang">1. Tunang (${tunangTasks})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Nikah">2. Nikah (${nikahTasks})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Sanding">3. Sanding (${sandingTasks})</button>
        <button type="button" class="checklist-phase-btn" data-phase="Shared">Shared &amp; Admin (${sharedTasks})</button>
      </div>

      <!-- Status Filter (Second Main Filter: All Items, Pending, Plan, Completed) -->
      <div class="checklist-headline-row">
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <div class="filter-pills-group" id="chk-status-pills">
            <button type="button" class="filter-pill active" data-status="all">All Items (${tasks.length})</button>
            <button type="button" class="filter-pill" data-status="Pending">📋 Pending (${pendingTasks})</button>
            <button type="button" class="filter-pill" data-status="Plan">⚡ Plan (${inProgressTasks})</button>
            <button type="button" class="filter-pill" data-status="Completed">✅ Completed (${doneTasks})</button>
          </div>
          <button type="button" class="batch-action-btn" id="chk-toggle-notes-btn">▾ Expand All Notes</button>
        </div>
        <div class="checklist-filters-row">
          <input type="text" class="checklist-search-input" id="chk-search" placeholder="Type to search 34 checklist tasks…">
          <select class="checklist-filter-select" id="chk-owner-select" aria-label="Filter by Owner">
            <option value="">All Owners</option>
            ${[...new Set(tasks.map(t => t.owner).filter(Boolean))].sort().map(o => `<option value="${o}">${o}</option>`).join("")}
          </select>
          <select class="checklist-filter-select" id="chk-priority-select" aria-label="Filter by Priority">
            <option value="">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>
    </div>
    <div id="chk-table-mount"></div>
  `;

  let currentPhase = "all";
  let currentStatus = "all";
  let currentQuery = "";
  let currentEvent = "";
  let currentOwner = "";
  let currentPriority = "";
  let allNotesExpanded = false;

  function renderTable() {
    const mount = container.querySelector("#chk-table-mount");
    if (!mount) return;

    const filtered = tasks.filter(t => {
      // Status Filter: Pending = Not started, Plan = In progress, Completed = Done
      if (currentStatus !== "all") {
        if (currentStatus === "Pending" && t.status !== "Not started") return false;
        if (currentStatus === "Plan" && t.status !== "In progress") return false;
        if (currentStatus === "Completed" && t.status !== "Done") return false;
      }
      if (currentPhase !== "all") {
        if (currentPhase === "Shared") {
          if ((t.event || "").includes("Tunang") || (t.event || "").includes("Nikah") || (t.event || "").includes("Sanding")) return false;
        } else {
          if (!(t.event || "").toLowerCase().includes(currentPhase.toLowerCase())) return false;
        }
      }
      if (currentEvent && t.event !== currentEvent) return false;
      if (currentOwner && t.owner !== currentOwner) return false;
      if (currentPriority && t.priority !== currentPriority) return false;
      if (currentQuery) {
        const text = [t.title, t.event, t.owner, t.priority, t.detail].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(currentQuery)) return false;
      }
      return true;
    });

    // Dynamic reflection of action item count (Checklist Point 1)
    const filteredDone = filtered.filter(t => t.status === "Done").length;
    const filteredPct = filtered.length > 0 ? ((filteredDone / filtered.length) * 100).toFixed(1) : "0.0";
    const badge = container.querySelector("#chk-counter-badge");
    const fill = container.querySelector("#chk-progress-bar-fill");
    if (badge) {
      badge.innerHTML = `Showing <strong>${filtered.length}</strong> of ${tasks.length} tasks (${filteredDone} Done · ${filteredPct}%)`;
    }
    if (fill) fill.style.width = `${filteredPct}%`;

    if (!filtered.length) {
      mount.innerHTML = `<p class="empty" style="padding: 30px; text-align: center;">No matching checklist tasks found for selected filters.</p>`;
      return;
    }

    // Sorting rule (Checklist Point 6):
    // 1. Completed tasks ALWAYS placed at bottom
    // 2. Active tasks grouped by phase, then priority (High -> Medium -> Low), then deadline date
    const priorityRank = { High: 1, Medium: 2, Low: 3 };
    function getPhaseRank(event) {
      const ev = (event || "").toLowerCase();
      if (ev.includes("tunang")) return 1;
      if (ev.includes("nikah")) return 2;
      if (ev.includes("sanding")) return 3;
      return 4;
    }

    const sortedFiltered = [...filtered].sort((a, b) => {
      const aDone = a.status === "Done";
      const bDone = b.status === "Done";
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;

      const pA = getPhaseRank(a.event);
      const pB = getPhaseRank(b.event);
      if (pA !== pB) return pA - pB;

      const prA = priorityRank[a.priority] || 4;
      const prB = priorityRank[b.priority] || 4;
      if (prA !== prB) return prA - prB;

      if (a.date && b.date) return new Date(a.date) - new Date(b.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    const tableWrap = make("div", "table-wrap");
    tableWrap.style.overflowX = "auto";
    const tableEl = make("table", "checklist-table");
    tableEl.innerHTML = `
      <thead>
        <tr>
          <th class="col-no">No.</th>
          <th style="width: 36px; text-align: center;">Done</th>
          <th>Task &amp; Action Item</th>
          <th style="width: 110px;">Phase</th>
          <th style="width: 90px;">Owner</th>
          <th style="width: 80px;">Priority</th>
          <th style="width: 110px;">Target Date</th>
          <th style="width: 90px;">Source</th>
        </tr>
      </thead>
      <tbody>
        ${sortedFiltered.map((t, idx) => {
          const isDone = t.status === "Done";
          const isInProgress = t.status === "In progress";
          const statusClass = isDone ? "done" : (isInProgress ? "progress" : "pending");
          const icon = isDone ? "✓" : (isInProgress ? "⚡" : "");
          const source = t.sources?.[0];
          const sourceHtml = source
            ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip">${source.label} ↗</a>`
            : "—";

          const hasDetail = Boolean(t.detail);
          const priorityClass = t.priority === "High" ? "High" : (t.priority === "Medium" ? "Medium" : "Low");

          return `
            <tr class="checklist-row ${isDone ? "is-done" : ""}" data-id="${t.id}">
              <td class="col-no">${idx + 1}</td>
              <td style="text-align: center;">
                <span class="checklist-check-btn ${statusClass}" title="Status: ${t.status}">${icon}</span>
              </td>
              <td>
                <div class="task-title-cell">
                  <span class="task-title-text">${t.title}</span>
                  ${hasDetail ? `<button type="button" class="note-toggle-btn" data-idx="chk-${idx}">note ▾</button>` : ""}
                </div>
              </td>
              <td>${renderPhaseChip(t.event)}</td>
              <td>${renderPersonChip(t.owner)}</td>
              <td><span class="kanban-priority-pill ${priorityClass}">${t.priority ?? "Normal"}</span></td>
              <td style="font-size: 11px; font-weight: 500; color: var(--charcoal-muted);">${t.date ? date(t.date) : "—"}</td>
              <td>${sourceHtml}</td>
            </tr>
            ${hasDetail ? `
              <tr class="task-notes-row" id="chk-note-chk-${idx}" style="display: ${allNotesExpanded ? "table-row" : "none"};">
                <td colspan="8" class="task-notes-expansion">
                  <strong>Notes &amp; Details:</strong> ${t.detail}
                </td>
              </tr>
            ` : ""}
          `;
        }).join("")}
      </tbody>
    `;

    tableEl.querySelectorAll(".checklist-check-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        showToast(`Task Status: ${btn.title}`);
      });
    });

    tableEl.querySelectorAll(".note-toggle-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const noteRow = tableEl.querySelector(`#chk-note-${btn.dataset.idx}`);
        if (!noteRow) return;
        const isHidden = noteRow.style.display === "none";
        noteRow.style.display = isHidden ? "table-row" : "none";
        btn.textContent = isHidden ? "note ▴" : "note ▾";
      });
    });

    tableWrap.append(tableEl);
    mount.replaceChildren(tableWrap);
  }

  const toggleNotesBtn = container.querySelector("#chk-toggle-notes-btn");
  toggleNotesBtn?.addEventListener("click", () => {
    allNotesExpanded = !allNotesExpanded;
    toggleNotesBtn.textContent = allNotesExpanded ? "▴ Collapse Notes" : "▾ Expand All Notes";
    renderTable();
  });

  const statusPills = container.querySelectorAll("#chk-status-pills .filter-pill");
  statusPills.forEach(pill => {
    pill.addEventListener("click", () => {
      statusPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentStatus = pill.dataset.status;
      renderTable();
    });
  });

  const phaseTabs = container.querySelectorAll("#chk-phase-tabs .checklist-phase-btn");
  phaseTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      phaseTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentPhase = btn.dataset.phase;
      renderTable();
    });
  });

  const searchInput = container.querySelector("#chk-search");
  searchInput.addEventListener("input", e => {
    currentQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });

  const ownerSelect = container.querySelector("#chk-owner-select");
  ownerSelect.addEventListener("change", e => {
    currentOwner = e.target.value;
    renderTable();
  });

  const prioritySelect = container.querySelector("#chk-priority-select");
  prioritySelect.addEventListener("change", e => {
    currentPriority = e.target.value;
    renderTable();
  });

  parent.append(container);
  renderTable();
}

/* ========================================================================= */
/* 3C. TENTATIVE EVENTS (COLLAPSIBLE DROPDOWN ACCORDIONS)                    */
/* ========================================================================= */
function tentativeView(parent) {
  const container = make("div", "tentative-container");

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

    <!-- PHASE 1: PERTUNANGAN -->
    <div class="phase-accordion is-open" id="accordion-phase-1">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="true">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag">P1</span>
          <div>
            <h3 class="phase-accordion-heading">1. Tunang</h3>
            <div class="phase-accordion-sub">Sunday, 27/12/2026 · 10:00 AM–1:00 PM · Gastrohub Event House, Cyberjaya</div>
          </div>
        </div>
        <div class="phase-accordion-meta">
          <span class="event-time-pill">10:00 AM – 1:00 PM</span>
          <span class="phase-accordion-chevron">▼</span>
        </div>
      </div>
      <div class="phase-accordion-body">
        <div class="tentative-cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Gastrohub Event House, Nilai</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Persiaran Korporat, Nilai · 30 Pax</div>
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
            <div class="tentative-info-title">GIFTS &amp; HANTARAN</div>
            <div class="tentative-info-val">Bride Ring &amp; 2 Desserts</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Upacara sarung cincin hantaran</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE PIC &amp; CONTACT</div>
            <div class="tentative-info-val">En. Izz (Gastrohub)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <a href="tel:60135599032" class="contact-btn btn-call">📞 013-5599032</a>
              <a href="https://wa.me/60135599032" target="_blank" rel="noopener noreferrer" class="contact-btn btn-wa">💬 WhatsApp</a>
            </div>
          </div>
        </div>

        <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin-bottom: 8px;">Approved Working Programme (10:00 AM – 1:00 PM)</h4>
        <div class="table-wrap" style="overflow-x: auto; margin-bottom: 18px;">
          <table class="tentative-schedule-table">
            <thead>
              <tr>
                <th style="width: 105px;">Time</th>
                <th>Program &amp; Activity</th>
                <th style="width: 150px;">Lead / PIC</th>
                <th style="width: 220px;">Notes &amp; Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="tentative-time-badge">10:00 AM</span></td>
                <td><strong>Families arrive, greet and take their seats</strong></td>
                <td>Both Families</td>
                <td>Gastrohub Event House · Welcoming &amp; Seating Area</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:10 AM</span></td>
                <td><strong>Programme begins</strong></td>
                <td>Emcee / Family Lead</td>
                <td>Main Hall · Opening remarks &amp; introduction</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:15 AM</span></td>
                <td><strong>Family discussion begins</strong></td>
                <td>Family Spokespersons</td>
                <td>Discussion Pelamin Area · Pantun, hantaran review &amp; wedding date confirmation</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:50 AM</span></td>
                <td><strong>Discussion concludes and doa selamat</strong></td>
                <td>Ustaz / Family Spokesperson</td>
                <td>Recitation of doa selamat &amp; formal mutual agreement</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:55 AM</span></td>
                <td><strong>Bride welcomed for upacara sarung cincin</strong></td>
                <td>Mother of Groom &amp; Bride</td>
                <td>Center Stage Mini Pelamin · Ring presentation by Groom's mother to Bride</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">11:10 AM</span></td>
                <td><strong>Couple and family photos</strong></td>
                <td>Official Photographer</td>
                <td>Mini pelamin &amp; hall family portraits</td>
              </tr>
              <tr style="background: rgba(107, 29, 47, 0.03);">
                <td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFFFFF;">11:30 AM</span></td>
                <td><strong style="color: var(--burgundy);">Lunch</strong></td>
                <td>Gastrohub Catering</td>
                <td>Curated 30-pax family lunch buffet</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">01:00 PM</span></td>
                <td><strong>Event ends</strong></td>
                <td>Both Families</td>
                <td>Gift exchange, final farewells and departure</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <button type="button" class="quick-action-btn" id="btn-tentative-poster-tunang">🖼️ View Programme Poster ↗</button>
          <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
          <a href="https://app.notion.com/3c9caff354e7816db5b2fedc924fc999" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Gastrohub Invoice (Notion) ↗</a>
          <a href="https://drive.google.com/drive/folders/19bDYrC6ZgqYhwCwPR1Y43uQP0ohDba1H" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Engagement Receipts (Drive) ↗</a>
        </div>
      </div>
    </div>

    <!-- PHASE 2: AKAD NIKAH -->
    <div class="phase-accordion" id="accordion-phase-2">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: var(--charcoal);">P2</span>
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
        <div class="tentative-cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Masjid Raja Haji Fi Sabilillah</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">Persiaran Semarak Api, Cyberjaya · ~200 Pax</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag blue"><span class="dot"></span> Shade of Blue (Both Families)</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Unified harmonious blue tones</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">MAS KAHWIN &amp; GIFTS</div>
            <div class="tentative-info-val">Groom &amp; Bride Ring · 2 Dinar</div>
            <div style="font-size: 11px; color: #15803D; margin-top: 2px;">Bride ring RM 419 secured · 2 Dinar gold reserved</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">MASJID PIC &amp; CONTACT</div>
            <div class="tentative-info-val">Ustaz Syahir (Masjid Raja Haji)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <a href="tel:60134767535" class="contact-btn btn-call">📞 +60 13-476 7535</a>
              <a href="https://wa.me/60134767535" target="_blank" rel="noopener noreferrer" class="contact-btn btn-wa">💬 WhatsApp</a>
            </div>
          </div>
        </div>

        <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin-bottom: 8px;">Approved Working Programme (9:00 AM – 1:00 PM)</h4>
        <div class="table-wrap" style="overflow-x: auto; margin-bottom: 18px;">
          <table class="tentative-schedule-table">
            <thead>
              <tr>
                <th style="width: 105px;">Time</th>
                <th>Program &amp; Activity</th>
                <th style="width: 150px;">Lead / PIC</th>
                <th style="width: 220px;">Notes &amp; Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="tentative-time-badge">09:00 AM</span></td>
                <td><strong>Jamuan opens and families arrive</strong></td>
                <td>Joint Family Leads</td>
                <td>Masjid Raja Haji · Dining &amp; holding areas</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">09:30 AM</span></td>
                <td><strong>Final akad preparations</strong></td>
                <td>Soya &amp; Rin / Witnesses</td>
                <td>JAIS document check, witness confirmation &amp; readiness</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:00 AM</span></td>
                <td><strong>Enter nikah room, seat guests and begin the emcee’s introduction</strong></td>
                <td>Emcee / Floor Coordinator</td>
                <td>Main prayer hall solemnization room</td>
              </tr>
              <tr style="background: rgba(107, 29, 47, 0.03);">
                <td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFFFFF;">10:05 AM</span></td>
                <td><strong style="color: var(--burgundy);">Akad nikah</strong></td>
                <td>Kadi / Jurunikah &amp; Sayed</td>
                <td>Solemnization table · Lafaz akad nikah</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:30 AM</span></td>
                <td><strong>Ta’lik, signing, mas kahwin handover and ring exchange</strong></td>
                <td>Newlyweds &amp; Kadi</td>
                <td>Official register signoff, 2 Dinar mas kahwin &amp; rings</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:40 AM</span></td>
                <td><strong>Salam restu and family group photos</strong></td>
                <td>Parents &amp; Immediate Family</td>
                <td>Sujud hormat / salam restu &amp; family group photos</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">10:55 AM</span></td>
                <td><strong>Exit the nikah room</strong></td>
                <td>Emcee &amp; Ushers</td>
                <td>Transition to masjid courtyard &amp; jamuan area</td>
              </tr>
              <tr style="background: rgba(107, 29, 47, 0.03);">
                <td><span class="tentative-time-badge" style="background: var(--burgundy); color: #FFFFFF;">11:05 AM</span></td>
                <td><strong style="color: var(--burgundy);">Couple portraits and remaining family photos</strong></td>
                <td>Official Photographer</td>
                <td>Masjid Raja Haji architecture &amp; outdoor photo session</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">12:45 PM</span></td>
                <td><strong>Final farewells and clear the jamuan area</strong></td>
                <td>Family Committee</td>
                <td>Dining area wrap-up and guest send-off</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">01:00 PM</span></td>
                <td><strong>Jamuan closes</strong></td>
                <td>Masjid Management &amp; Caterer</td>
                <td>Event conclusion and facility handover</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <button type="button" class="quick-action-btn" id="btn-tentative-poster-nikah">🖼️ View Programme Poster ↗</button>
          <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
          <a href="https://app.notion.com/3cbcaff354e78133b424ecd2d8e995d3" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Masjid Booking Details (Notion) ↗</a>
          <a href="https://drive.google.com/drive/folders/1jjoMAaYn8oipUMiFq0zOkUdCGV-b4HTo" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Solemnization Records (Drive) ↗</a>
        </div>
      </div>
    </div>

    <!-- PHASE 3: RESEPSI SANDING -->
    <div class="phase-accordion" id="accordion-phase-3">
      <div class="phase-accordion-header" role="button" tabindex="0" aria-expanded="false">
        <div class="phase-accordion-title-wrap">
          <span class="phase-number-tag" style="background: #9A243D;">P3</span>
          <div>
            <h3 class="phase-accordion-heading">3. Sanding</h3>
            <div class="phase-accordion-sub">Saturday, 27/11/2027 · 11:00 AM–4:00 PM · Royale Palace, Cyberjaya</div>
          </div>
        </div>
        <div class="phase-accordion-meta">
          <span class="event-time-pill">11:00 AM – 4:00 PM</span>
          <span class="phase-accordion-chevron">▼</span>
        </div>
      </div>
      <div class="phase-accordion-body">
        <div class="tentative-cards-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));">
          <div class="tentative-info-card">
            <div class="tentative-info-title">VENUE &amp; LOCATION</div>
            <div class="tentative-info-val">Royale Palace Grand Ballroom</div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 2px;">2 Jalan Teknokrat 2, Cyberjaya · 400 Pax</div>
            <div style="display: flex; gap: 6px; margin-top: 6px;">
              <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">📍 Maps ↗</a>
              <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="contact-btn btn-map">🧭 Waze ↗</a>
            </div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">DRESS CODE &amp; THEME</div>
            <div class="dresscode-wrap">
              <span class="dresscode-tag purple"><span class="dot"></span> Shade of Purple (Both Families)</span>
            </div>
            <div style="font-size: 11px; color: var(--charcoal-muted); margin-top: 6px;">Royal lavender &amp; deep purple accents</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">PACKAGE &amp; DEPOSIT</div>
            <div class="tentative-info-val">RM 17,500 (RM 3,500 Paid)</div>
            <div style="font-size: 11px; color: #15803D; margin-top: 2px;">Locked with official receipt · Balance RM 14,000</div>
          </div>
          <div class="tentative-info-card">
            <div class="tentative-info-title">ROYALE PALACE PIC</div>
            <div class="tentative-info-val">Pn. Elyna (Sales Manager)</div>
            <div class="contact-actions" style="margin-top: 6px;">
              <a href="tel:60179377965" class="contact-btn btn-call">📞 +60 17-937 7965</a>
              <a href="https://wa.me/60179377965" target="_blank" rel="noopener noreferrer" class="contact-btn btn-wa">💬 WhatsApp</a>
            </div>
          </div>
        </div>

        <h4 style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: var(--charcoal-muted); margin-bottom: 8px;">Approved Working Programme (11:00 AM – 4:00 PM)</h4>
        <div class="table-wrap" style="overflow-x: auto; margin-bottom: 18px;">
          <table class="tentative-schedule-table">
            <thead>
              <tr>
                <th style="width: 105px;">Time</th>
                <th>Program &amp; Activity</th>
                <th style="width: 150px;">Lead / PIC</th>
                <th style="width: 220px;">Notes &amp; Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="tentative-time-badge">11:00 AM</span></td>
                <td><strong>Doors open, guest arrival and doorgift distribution</strong></td>
                <td>Reception Team &amp; Ushers</td>
                <td>Grand Ballroom foyer &amp; registration counter</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">12:00 PM</span></td>
                <td><strong>Buffet opens</strong></td>
                <td>Royale Palace Culinary Team</td>
                <td>Grand buffet stations (400 guests)</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">12:30 PM</span></td>
                <td><strong>Couple’s entrance and procession to the pelamin</strong></td>
                <td>Emcee &amp; Cultural Troupe</td>
                <td>Arak-arakan kompang &amp; procession to grand pelamin</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">12:45 PM</span></td>
                <td><strong>Naik pelamin and merenjis</strong></td>
                <td>Parents &amp; Family Elders</td>
                <td>Grand Pelamin stage · Merenjis / tepung tawar</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">01:15 PM</span></td>
                <td><strong>Makan beradab</strong></td>
                <td>Newlyweds &amp; Immediate VIPs</td>
                <td>Main Royal Banquet Table</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">01:45 PM</span></td>
                <td><strong>Cake cutting and thank-you remarks</strong></td>
                <td>Sayed &amp; Shamira</td>
                <td>Center stage · Cake cutting &amp; thank-you address</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">02:15 PM</span></td>
                <td><strong>Family and friends’ group photos</strong></td>
                <td>Official Photographer &amp; Emcee</td>
                <td>Pelamin stage group photos</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">03:00 PM</span></td>
                <td><strong>Couple greets guests and visits tables</strong></td>
                <td>Sayed &amp; Shamira</td>
                <td>Ballroom floor · Table rounds &amp; guest interaction</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">03:45 PM</span></td>
                <td><strong>Final photos and farewells</strong></td>
                <td>Newlyweds &amp; Families</td>
                <td>Ballroom exit &amp; photo booth</td>
              </tr>
              <tr>
                <td><span class="tentative-time-badge">04:00 PM</span></td>
                <td><strong>Reception ends</strong></td>
                <td>Floor Manager &amp; Vendors</td>
                <td>Event conclusion, farewell and teardown</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: flex; gap: 8px; border-top: 1px solid var(--border); padding-top: 12px; flex-wrap: wrap;">
          <button type="button" class="quick-action-btn" id="btn-tentative-poster-sanding">🖼️ View Programme Poster ↗</button>
          <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📍 Google Maps ↗</a>
          <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="quick-action-btn">🧭 Waze ↗</a>
          <a href="https://app.notion.com/p/3c8caff354e78133bb29eca4687f6300?pvs=204" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📄 Royale Palace Contract (Notion) ↗</a>
          <a href="https://drive.google.com/drive/folders/19bDYrC6ZgqYhwCwPR1Y43uQP0ohDba1H" target="_blank" rel="noopener noreferrer" class="quick-action-btn">📁 Reception Evidence (Drive) ↗</a>
        </div>
      </div>
    </div>

    <!-- DEDICATED WEDDING KEY CONTACTS & VENDOR DIRECTORY -->
    <div class="contacts-directory-container">
      <div class="contacts-section-head">
        <div>
          <h3 class="section-title" style="margin: 0; font-size: 18px;">📞 Wedding Key Contacts &amp; Vendor Directory</h3>
          <p class="section-caption" style="margin: 2px 0 0 0;">Official phone numbers, WhatsApp links and location coordinates for family leads, venues and creative vendors.</p>
        </div>
        <button type="button" class="quick-action-btn" id="btn-pop-contacts-modal">Open Full Modal ↗</button>
      </div>
      <div id="tentative-contacts-mount">
        ${renderContactsDirectoryHtml()}
      </div>
    </div>
  `;

  // Accordion Toggle Interactions (Point 2.d: Use dropdowns to expand each phase)
  const accordions = container.querySelectorAll(".phase-accordion");
  accordions.forEach(acc => {
    const head = acc.querySelector(".phase-accordion-header");
    head.addEventListener("click", () => {
      acc.classList.toggle("is-open");
      const isOpen = acc.classList.contains("is-open");
      head.setAttribute("aria-expanded", isOpen);
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
          acc.querySelector(".phase-accordion-header").setAttribute("aria-expanded", "true");
        } else {
          acc.classList.remove("is-open");
          acc.querySelector(".phase-accordion-header").setAttribute("aria-expanded", "false");
        }
      });
      toggleAllBtn.textContent = allExpanded ? "▴ Collapse All Phases" : "▾ Expand All Phases";
    });
  }

  // Wire up Poster Modals
  container.querySelector("#btn-tentative-poster-tunang")?.addEventListener("click", () => {
    openPosterModal("Tunang", "./posters/poster-tunang.jpg");
  });
  container.querySelector("#btn-tentative-poster-nikah")?.addEventListener("click", () => {
    openPosterModal("Nikah", "./posters/poster-nikah.jpg");
  });
  container.querySelector("#btn-tentative-poster-sanding")?.addEventListener("click", () => {
    openPosterModal("Sanding", "./posters/poster-sanding.jpg");
  });

  // Wire up Contacts Modal buttons
  container.querySelector("#btn-open-contacts-top")?.addEventListener("click", openContactsModal);
  container.querySelector("#btn-pop-contacts-modal")?.addEventListener("click", openContactsModal);

  parent.append(container);
}

/* ========================================================================= */
/* 3D. GUEST LISTS & RSVP MANAGEMENT (TAB 4)                                 */
/* ========================================================================= */
const TUNANG_GUEST_ROSTER = [
  // Groom Side (13 Pax · 9 entries)
  { id: "tg-1", no: 1, name: "abah", side: "Groom", pax: 1, role: "Bapa Pengantin Lelaki", status: "Confirmed", note: "Bapa Sayed Arif Hakimi" },
  { id: "tg-2", no: 2, name: "mama", side: "Groom", pax: 1, role: "Ibu Pengantin Lelaki", status: "Confirmed", note: "Ibu Sayed Arif Hakimi" },
  { id: "tg-3", no: 3, name: "siblings", side: "Groom", pax: 5, role: "Adik-beradik Groom", status: "Confirmed", note: "5 adik-beradik Groom" },
  { id: "tg-4", no: 4, name: "abang shahrom", side: "Groom", pax: 1, role: "Keluarga Terdekat", status: "Confirmed", note: "Keluarga Groom" },
  { id: "tg-5", no: 5, name: "achin", side: "Groom", pax: 1, role: "Keluarga Terdekat", status: "Confirmed", note: "Keluarga Groom" },
  { id: "tg-6", no: 6, name: "aunty amy", side: "Groom", pax: 1, role: "Ibu Saudara Groom", status: "Confirmed", note: "Ibu Saudara Groom" },
  { id: "tg-7", no: 7, name: "pakcik", side: "Groom", pax: 1, role: "Bapa Saudara Groom", status: "Confirmed", note: "Bapa Saudara Groom" },
  { id: "tg-8", no: 8, name: "makcik", side: "Groom", pax: 1, role: "Ibu Saudara Groom", status: "Confirmed", note: "Ibu Saudara Groom" },
  { id: "tg-9", no: 9, name: "raisya+rizqi", side: "Groom", pax: 1, role: "Keluarga Groom", status: "Confirmed", note: "Keluarga Groom" },

  // Bride Side (16 Pax · 14 entries)
  { id: "tb-1", no: 1, name: "ibu", side: "Bride", pax: 1, role: "Ibu Pengantin Perempuan", status: "Confirmed", note: "Ibu Nor Shamira (Norzilawati)" },
  { id: "tb-2", no: 2, name: "ayah", side: "Bride", pax: 1, role: "Bapa Pengantin Perempuan", status: "Confirmed", note: "Bapa Nor Shamira" },
  { id: "tb-3", no: 3, name: "uncle", side: "Bride", pax: 1, role: "Bapa Saudara Bride", status: "Confirmed", note: "Bapa Saudara Bride" },
  { id: "tb-4", no: 4, name: "siblings", side: "Bride", pax: 3, role: "Adik-beradik Bride", status: "Confirmed", note: "3 adik-beradik Bride" },
  { id: "tb-5", no: 5, name: "kak elaine", side: "Bride", pax: 1, role: "Keluarga / Rakan Rapat", status: "Confirmed", note: "Keluarga / Rakan Bride" },
  { id: "tb-6", no: 6, name: "sherly", side: "Bride", pax: 1, role: "Keluarga / Rakan Rapat", status: "Confirmed", note: "Keluarga / Rakan Bride" },
  { id: "tb-7", no: 7, name: "syasya", side: "Bride", pax: 1, role: "Keluarga / Rakan Rapat", status: "Confirmed", note: "Keluarga / Rakan Bride" },
  { id: "tb-8", no: 8, name: "kak mija", side: "Bride", pax: 1, role: "Keluarga / Rakan Rapat", status: "Confirmed", note: "Keluarga / Rakan Bride" },
  { id: "tb-9", no: 9, name: "abang lukman", side: "Bride", pax: 1, role: "Keluarga Bride", status: "Confirmed", note: "Keluarga Bride" },
  { id: "tb-10", no: 10, name: "pakngah", side: "Bride", pax: 1, role: "Bapa Saudara Bride", status: "Confirmed", note: "Bapa Saudara Bride" },
  { id: "tb-11", no: 11, name: "makngah", side: "Bride", pax: 1, role: "Ibu Saudara Bride", status: "Confirmed", note: "Ibu Saudara Bride" },
  { id: "tb-12", no: 12, name: "marsya", side: "Bride", pax: 1, role: "Keluarga Bride", status: "Confirmed", note: "Keluarga Bride" },
  { id: "tb-13", no: 13, name: "farisya", side: "Bride", pax: 1, role: "Keluarga Bride", status: "Confirmed", note: "Keluarga Bride" },
  { id: "tb-14", no: 14, name: "wahida", side: "Bride", pax: 1, role: "Keluarga Bride", status: "Confirmed", note: "Keluarga Bride" }
];

function guestsView(parent, records = []) {
  const guestRecords = records.length ? records : snapshot.records.filter(r => r.tab === "guests");
  const container = make("div", "master-guests-container");

  // State
  let activeMode = "roster"; // "roster" (Named Guest List) | "categories" (Allocation Quotas)
  let rosterEvent = "Tunang";
  let rosterSide = "all";
  let rosterLayout = "side-by-side"; // "side-by-side" | "unified"
  let rosterQuery = "";

  let catEvent = "all";
  let catSide = "all";
  let catQuery = "";
  const expandedCatRows = new Set(); // Stores record IDs that have expanded guest sub-tables

  container.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Guest Lists &amp; RSVP Management</h2>
          <p class="section-caption">Senarai nama tetamu rasmi &amp; peruntukan kuota majlis Tunang, Nikah, dan Sanding — diselaraskan dengan Google Sheets rasmi.</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span id="guests-counter-badge" class="counter-badge" style="background: var(--burgundy-soft); color: var(--burgundy); font-weight: 700; padding: 4px 12px; border-radius: 9999px; font-size: 12px; border: 1px solid var(--burgundy-border);">
            Tunang: 29 / 30 Pax Sah
          </span>
        </div>
      </div>

      <!-- Quick Metrics Horizon Strip (4 Cards) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin: 16px 0;">
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 4px solid #588157; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">1. TUNANG (GASTROHUB)</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">29 / 30 Pax</div>
          <div style="font-size: 11px; color: #15803D; font-weight: 600;">✓ 100% Sah (13 Groom · 16 Bride · 1 Buffer)</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 4px solid #0EA5E9; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">2. NIKAH (MASJID CYBERJAYA)</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">200 Pax Sasaran</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">~100 Groom · ~100 Bride (Penyusunan Nama)</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 4px solid var(--burgundy); border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">3. SANDING (ROYALE PALACE)</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">400 Pax Sasaran</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">200 Groom · 200 Bride (Penyusunan Nama)</div>
        </div>
        <div style="background: var(--burgundy-soft); border: 1px solid var(--burgundy-border); border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; font-weight: 800; color: var(--burgundy); letter-spacing: 0.5px;">JUMLAH KAPASITI</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--burgundy); margin: 2px 0;">630 Pax</div>
          <div style="font-size: 10px; color: var(--burgundy);">Merentas 3 Majlis</div>
        </div>
      </div>

      <!-- Primary Mode Switcher (Named Guest Roster vs Allocation Categories) -->
      <div style="display: flex; gap: 8px; margin: 16px 0 10px 0; border-bottom: 2px solid var(--border); padding-bottom: 12px; flex-wrap: wrap;" id="guest-mode-switcher">
        <button type="button" class="guest-mode-pill active" data-mode="roster" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 700; cursor: pointer; border: 1px solid var(--burgundy); background: var(--burgundy); color: #fff; transition: all 0.15s ease;">
          📋 Senarai Nama Tetamu (Tunang: 23 Kumpulan · 29 Pax Sah)
        </button>
        <button type="button" class="guest-mode-pill" data-mode="categories" style="padding: 8px 18px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--bg-soft); color: var(--charcoal); transition: all 0.15s ease;">
          📊 Ringkasan Kuota &amp; Kategori (9 Kategori)
        </button>
      </div>
    </div>

    <!-- Mount Container for Active View -->
    <div id="guests-dynamic-mount" style="margin-top: 14px;"></div>
  `;

  // Render Roster Sub-View
  function renderRosterView() {
    const mount = container.querySelector("#guests-dynamic-mount");
    if (!mount) return;

    let filteredRoster = TUNANG_GUEST_ROSTER.filter(g => {
      if (rosterSide === "Groom" && g.side !== "Groom") return false;
      if (rosterSide === "Bride" && g.side !== "Bride") return false;
      if (rosterQuery) {
        const text = [g.name, g.role, g.side, g.note, g.status].join(" ").toLowerCase();
        if (!text.includes(rosterQuery)) return false;
      }
      return true;
    });

    const groomList = filteredRoster.filter(g => g.side === "Groom");
    const brideList = filteredRoster.filter(g => g.side === "Bride");
    const groomPax = groomList.reduce((s, g) => s + g.pax, 0);
    const bridePax = brideList.reduce((s, g) => s + g.pax, 0);
    const totalPax = groomPax + bridePax;

    const badge = container.querySelector("#guests-counter-badge");
    if (badge) {
      if (rosterEvent === "Tunang") {
        badge.innerHTML = `Tunang: <strong>${totalPax}</strong> Pax (${filteredRoster.length} Kumpulan)`;
      } else if (rosterEvent === "Nikah") {
        badge.innerHTML = `Nikah: Sasaran 200 Pax`;
      } else {
        badge.innerHTML = `Sanding: Sasaran 400 Pax`;
      }
    }

    let subHtml = `
      <!-- Event Phase Tabs for Roster -->
      <div class="checklist-phase-tabs" id="roster-event-tabs" style="margin-bottom: 12px;">
        <button type="button" class="checklist-phase-btn ${rosterEvent === "Tunang" ? "active" : ""}" data-event="Tunang">1. Tunang (29 Pax Sah · 23 Nama)</button>
        <button type="button" class="checklist-phase-btn ${rosterEvent === "Nikah" ? "active" : ""}" data-event="Nikah">2. Nikah (Sasaran 200 Pax)</button>
        <button type="button" class="checklist-phase-btn ${rosterEvent === "Sanding" ? "active" : ""}" data-event="Sanding">3. Sanding (Sasaran 400 Pax)</button>
      </div>
    `;

    if (rosterEvent === "Tunang") {
      subHtml += `
        <!-- Tunang Controls & Filters -->
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; background: #FAF8F5; padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border);">
          <div class="filter-pills-group" id="roster-side-pills" style="margin: 0;">
            <button type="button" class="filter-pill ${rosterSide === "all" ? "active" : ""}" data-side="all">Semua Tetamu (29 Pax)</button>
            <button type="button" class="filter-pill ${rosterSide === "Groom" ? "active" : ""}" data-side="Groom">Pihak Lelaki (13 Pax)</button>
            <button type="button" class="filter-pill ${rosterSide === "Bride" ? "active" : ""}" data-side="Bride">Pihak Perempuan (16 Pax)</button>
          </div>

          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <!-- Layout Toggle -->
            <div style="display: inline-flex; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background: #fff;">
              <button type="button" id="toggle-layout-sbs" style="padding: 6px 12px; font-size: 11.5px; font-weight: 600; border: none; cursor: pointer; background: ${rosterLayout === "side-by-side" ? "var(--burgundy)" : "#fff"}; color: ${rosterLayout === "side-by-side" ? "#fff" : "var(--charcoal)"};">
                📑 Bersebelahan
              </button>
              <button type="button" id="toggle-layout-unified" style="padding: 6px 12px; font-size: 11.5px; font-weight: 600; border: none; cursor: pointer; border-left: 1px solid var(--border); background: ${rosterLayout === "unified" ? "var(--burgundy)" : "#fff"}; color: ${rosterLayout === "unified" ? "#fff" : "var(--charcoal)"};">
                📋 Jadual Bersatu
              </button>
            </div>

            <!-- Search input -->
            <input type="text" class="checklist-search-input" id="roster-search" value="${rosterQuery}" placeholder="Cari nama tetamu (cth: abah, aunty amy, makngah, farisya)…" style="min-width: 260px;">

            <!-- Google Sheet Link -->
            <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit#gid=1748384218" target="_blank" rel="noopener noreferrer" class="source-link-chip" style="font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px;">
              Google Sheets Tunang ↗
            </a>
          </div>
        </div>
      `;

      if (rosterLayout === "side-by-side" && rosterSide === "all") {
        // SIDE-BY-SIDE VIEW (Mirroring the user's Google Sheet screenshot)
        subHtml += `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; margin-top: 10px;">
            <!-- GROOM SIDE (13 Pax · 9 Entries) -->
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid #1D4ED8; border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-sm);">
              <div style="padding: 12px 14px; background: #EFF6FF; border-bottom: 1px solid #DBEAFE; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="font-size: 14px; font-weight: 800; color: #1E3A8A; margin: 0; display: flex; align-items: center; gap: 6px;">
                    <span>👨‍💼 Pihak Pengantin Lelaki</span>
                    <span style="font-size: 11px; background: #DBEAFE; color: #1E40AF; padding: 2px 8px; border-radius: 9999px;">${groomPax} Pax (${groomList.length} Kumpulan)</span>
                  </h3>
                  <div style="font-size: 11px; color: #3B82F6; margin-top: 2px;">Keluarga &amp; Rombongan Sayed Arif Hakimi</div>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 8px; border-radius: 4px;">✓ Sah Hadir</span>
              </div>
              <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="checklist-table" style="margin: 0; width: 100%;">
                  <thead>
                    <tr style="background: #F8FAFC;">
                      <th style="width: 38px; text-align: center;">No.</th>
                      <th>Nama Tetamu (Guest Name)</th>
                      <th style="width: 70px; text-align: right;">Pax</th>
                      <th>Peranan / Hubungan</th>
                      <th style="width: 90px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${groomList.map(g => `
                      <tr>
                        <td style="text-align: center; color: var(--charcoal-muted); font-size: 11px;">${g.no}</td>
                        <td style="font-weight: 700; color: var(--charcoal); font-size: 13px;">${g.name}</td>
                        <td style="text-align: right; font-weight: 800; color: #1D4ED8;">${g.pax}</td>
                        <td style="font-size: 11.5px; color: var(--charcoal-muted);">${g.role}</td>
                        <td style="text-align: center;">
                          <span style="font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #DCFCE7; color: #15803D;">✓ Sah</span>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                  <tfoot>
                    <tr style="background: #F1F5F9; font-weight: 800; border-top: 2px solid #CBD5E1;">
                      <td colspan="2" style="padding: 10px 12px; color: #1E293B;">JUMLAH PIHAK LELAKI</td>
                      <td style="text-align: right; padding: 10px 12px; color: #1D4ED8; font-size: 14px;">${groomPax} Pax</td>
                      <td colspan="2" style="font-size: 11px; color: var(--charcoal-muted);">${groomList.length} Kumpulan / Entri</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- BRIDE SIDE (16 Pax · 14 Entries) -->
            <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid #BE185D; border-radius: 8px; overflow: hidden; box-shadow: var(--shadow-sm);">
              <div style="padding: 12px 14px; background: #FDF2F8; border-bottom: 1px solid #FCE7F3; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <h3 style="font-size: 14px; font-weight: 800; color: #831843; margin: 0; display: flex; align-items: center; gap: 6px;">
                    <span>👰‍♀️ Pihak Pengantin Perempuan</span>
                    <span style="font-size: 11px; background: #FCE7F3; color: #9D174D; padding: 2px 8px; border-radius: 9999px;">${bridePax} Pax (${brideList.length} Kumpulan)</span>
                  </h3>
                  <div style="font-size: 11px; color: #EC4899; margin-top: 2px;">Keluarga &amp; Rakan Nor Shamira Irwani</div>
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 2px 8px; border-radius: 4px;">✓ Sah Hadir</span>
              </div>
              <div style="overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table class="checklist-table" style="margin: 0; width: 100%;">
                  <thead>
                    <tr style="background: #FDF2F8;">
                      <th style="width: 38px; text-align: center;">No.</th>
                      <th>Nama Tetamu (Guest Name)</th>
                      <th style="width: 70px; text-align: right;">Pax</th>
                      <th>Peranan / Hubungan</th>
                      <th style="width: 90px; text-align: center;">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${brideList.map(g => `
                      <tr>
                        <td style="text-align: center; color: var(--charcoal-muted); font-size: 11px;">${g.no}</td>
                        <td style="font-weight: 700; color: var(--charcoal); font-size: 13px;">${g.name}</td>
                        <td style="text-align: right; font-weight: 800; color: #BE185D;">${g.pax}</td>
                        <td style="font-size: 11.5px; color: var(--charcoal-muted);">${g.role}</td>
                        <td style="text-align: center;">
                          <span style="font-size: 10.5px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: #DCFCE7; color: #15803D;">✓ Sah</span>
                        </td>
                      </tr>
                    `).join("")}
                  </tbody>
                  <tfoot>
                    <tr style="background: #FFF1F2; font-weight: 800; border-top: 2px solid #FECDD3;">
                      <td colspan="2" style="padding: 10px 12px; color: #881337;">JUMLAH PIHAK PEREMPUAN</td>
                      <td style="text-align: right; padding: 10px 12px; color: #BE185D; font-size: 14px;">${bridePax} Pax</td>
                      <td colspan="2" style="font-size: 11px; color: var(--charcoal-muted);">${brideList.length} Kumpulan / Entri</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Total Summary Callout Strip -->
          <div style="margin-top: 14px; background: var(--bg-soft); border: 1px solid var(--border); border-left: 4px solid #15803D; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
            <div>
              <span style="font-weight: 800; color: var(--charcoal); font-size: 13px;">✓ Rumusan Kehadiran Tunang:</span>
              <span style="color: var(--charcoal); font-size: 13px; margin-left: 4px;"><strong>29 Pax</strong> disahkan hadir (<strong>13</strong> Lelaki + <strong>16</strong> Perempuan) daripada kapasiti <strong>30 Pax</strong> Gastrohub Event House.</span>
            </div>
            <div style="font-size: 12px; font-weight: 700; color: #15803D; background: #DCFCE7; padding: 4px 10px; border-radius: 6px;">
              Baki 1 Kerusi Buffer Sedia Ada
            </div>
          </div>
        `;
      } else {
        // UNIFIED TABLE VIEW (Or single side view)
        if (!filteredRoster.length) {
          subHtml += `<p class="empty" style="padding: 30px; text-align: center;">Tiada nama tetamu yang sepadan dengan carian "${rosterQuery}".</p>`;
        } else {
          subHtml += `
            <div class="table-wrap" style="overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 10px; background: #fff; border: 1px solid var(--border); border-radius: 8px;">
              <table class="checklist-table" style="margin: 0; width: 100%;">
                <thead>
                  <tr>
                    <th class="col-no" style="width: 40px; text-align: center;">No.</th>
                    <th>Nama Tetamu (Guest Name)</th>
                    <th style="width: 130px;">Pihak (Side)</th>
                    <th style="width: 90px; text-align: right;">Bil. Pax</th>
                    <th>Peranan / Hubungan Rasmi</th>
                    <th style="width: 120px; text-align: center;">Status RSVP</th>
                    <th style="width: 120px; text-align: center;">Pautan Sheet</th>
                  </tr>
                </thead>
                <tbody>
                  ${filteredRoster.map((g, idx) => {
                    const isGroom = g.side === "Groom";
                    const sidePill = isGroom
                      ? `<span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: #DBEAFE; color: #1E40AF;">👨‍💼 Lelaki (Groom)</span>`
                      : `<span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 9999px; background: #FCE7F3; color: #9D174D;">👰‍♀️ Perempuan (Bride)</span>`;

                    return `
                      <tr>
                        <td class="col-no" style="text-align: center; color: var(--charcoal-muted);">${idx + 1}</td>
                        <td>
                          <div style="font-weight: 700; color: var(--charcoal); font-size: 13.5px;">${g.name}</div>
                          <div style="font-size: 11px; color: var(--charcoal-muted);">${g.note || ""}</div>
                        </td>
                        <td>${sidePill}</td>
                        <td style="text-align: right; font-weight: 800; font-size: 14px; color: ${isGroom ? "#1D4ED8" : "#BE185D"};">${g.pax} Pax</td>
                        <td style="font-size: 12px; color: var(--charcoal);">${g.role}</td>
                        <td style="text-align: center;">
                          <span style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: #DCFCE7; color: #15803D;">✓ Sah Hadir</span>
                        </td>
                        <td style="text-align: center;">
                          <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit#gid=1748384218" target="_blank" rel="noopener noreferrer" class="source-link-chip" style="font-size: 11px;">Sheet ↗</a>
                        </td>
                      </tr>
                    `;
                  }).join("")}
                </tbody>
                <tfoot>
                  <tr style="background: #FAF8F5; font-weight: 800; border-top: 2px solid var(--border);">
                    <td colspan="3" style="padding: 10px 14px;">JUMLAH KESELURUHAN (PAPARAN INI)</td>
                    <td style="text-align: right; padding: 10px 14px; color: var(--burgundy); font-size: 15px;">${totalPax} Pax</td>
                    <td colspan="3" style="font-size: 11.5px; color: var(--charcoal-muted);">${filteredRoster.length} Kumpulan / Entri</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          `;
        }
      }
    } else if (rosterEvent === "Nikah") {
      // NIKAH INFO CARD
      subHtml += `
        <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid #0EA5E9; border-radius: 8px; padding: 24px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: #0284C7; margin: 0 0 6px 0;">2. Nikah (Masjid Raja Haji Fi Sabilillah, Cyberjaya) — Sasaran 200 Pax</h3>
              <p style="font-size: 12.5px; color: var(--charcoal-muted); margin: 0; line-height: 1.5; max-width: 650px;">
                Peruntukan tetamu majlis akad nikah adalah sebanyak <strong>200 orang</strong> (anggaran 100 pihak lelaki &amp; 100 pihak perempuan). Senarai nama tetamu jemputan individu sedang dikemaskini dalam Google Sheets rasmi.
              </p>
            </div>
            <span style="font-size: 11.5px; font-weight: 700; color: #0369A1; background: #E0F2FE; padding: 4px 12px; border-radius: 9999px;">Penyusunan Nama</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 20px 0;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">KUOTA PIHAK LELAKI</div>
              <div style="font-size: 18px; font-weight: 800; color: #1D4ED8; margin: 4px 0;">100 Pax Sasaran</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Keluarga terdekat &amp; sahabat Sayed</div>
            </div>
            <div style="background: #FDF2F8; border: 1px solid #FCE7F3; border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">KUOTA PIHAK PEREMPUAN</div>
              <div style="font-size: 18px; font-weight: 800; color: #BE185D; margin: 4px 0;">100 Pax Sasaran</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Keluarga terdekat &amp; sahabat Shamira</div>
            </div>
            <div style="background: #FAF8F5; border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">LOKASI &amp; WAKTU</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">9:00 AM - 1:00 PM</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Masjid Cyberjaya · 27 Mac 2027</div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit#gid=712613532" target="_blank" rel="noopener noreferrer" class="cta-button" style="text-decoration: none; padding: 8px 16px; font-size: 12.5px; font-weight: 700; background: #0284C7; color: #fff; border-radius: 6px;">
              Buka Google Sheets Nikah (gid=712613532) ↗
            </a>
            <button type="button" class="btn-switch-to-categories" style="padding: 8px 16px; font-size: 12.5px; font-weight: 600; background: var(--bg-soft); color: var(--charcoal); border: 1px solid var(--border); border-radius: 6px; cursor: pointer;">
              Lihat Ringkasan Kuota Kategori
            </button>
          </div>
        </div>
      `;
    } else {
      // SANDING INFO CARD
      subHtml += `
        <div style="background: #FFFFFF; border: 1px solid var(--border); border-top: 4px solid var(--burgundy); border-radius: 8px; padding: 24px; margin-top: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--burgundy); margin: 0 0 6px 0;">3. Sanding (Royale Palace, Cyberjaya) — Sasaran 400 Pax</h3>
              <p style="font-size: 12.5px; color: var(--charcoal-muted); margin: 0; line-height: 1.5; max-width: 650px;">
                Majlis resepsi perdana menampung <strong>400 tetamu</strong> (200 pihak lelaki &amp; 200 pihak perempuan) di Royale Palace Cyberjaya. Senarai jemputan keluarga besar dan kenalan sedang dikompilasikan dalam Google Sheets rasmi.
              </p>
            </div>
            <span style="font-size: 11.5px; font-weight: 700; color: var(--burgundy); background: var(--burgundy-soft); padding: 4px 12px; border-radius: 9999px;">Penyusunan Nama</span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin: 20px 0;">
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">KUOTA PIHAK LELAKI</div>
              <div style="font-size: 18px; font-weight: 800; color: #1D4ED8; margin: 4px 0;">200 Pax Sasaran</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Keluarga besar &amp; rakan Groom</div>
            </div>
            <div style="background: #FDF2F8; border: 1px solid #FCE7F3; border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">KUOTA PIHAK PEREMPUAN</div>
              <div style="font-size: 18px; font-weight: 800; color: #BE185D; margin: 4px 0;">200 Pax Sasaran</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Keluarga besar &amp; rakan Bride</div>
            </div>
            <div style="background: #FAF8F5; border: 1px solid var(--border); border-radius: 6px; padding: 12px;">
              <div style="font-size: 11px; font-weight: 700; color: var(--charcoal-muted);">LOKASI &amp; WAKTU</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--charcoal); margin: 4px 0;">11:00 AM - 4:00 PM</div>
              <div style="font-size: 11px; color: var(--charcoal-muted);">Royale Palace · 27 Nov 2027</div>
            </div>
          </div>

          <div style="display: gap: 10px; flex-wrap: wrap;">
            <a href="https://docs.google.com/spreadsheets/d/1kXieqBHblrcWIHF8hE_r0WmYeiwfbILi2NPW2-zOLFY/edit#gid=1983050853" target="_blank" rel="noopener noreferrer" class="cta-button" style="text-decoration: none; padding: 8px 16px; font-size: 12.5px; font-weight: 700; background: var(--burgundy); color: #fff; border-radius: 6px;">
              Buka Google Sheets Sanding (gid=1983050853) ↗
            </a>
            <button type="button" class="btn-switch-to-categories" style="padding: 8px 16px; font-size: 12.5px; font-weight: 600; background: var(--bg-soft); color: var(--charcoal); border: 1px solid var(--border); border-radius: 6px; cursor: pointer; margin-left: 10px;">
              Lihat Ringkasan Kuota Kategori
            </button>
          </div>
        </div>
      `;
    }

    mount.innerHTML = subHtml;

    // Attach listeners for Roster sub-view
    mount.querySelectorAll("#roster-event-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        rosterEvent = btn.dataset.event;
        renderRosterView();
      });
    });

    mount.querySelectorAll("#roster-side-pills button").forEach(btn => {
      btn.addEventListener("click", () => {
        rosterSide = btn.dataset.side;
        renderRosterView();
      });
    });

    const sbsBtn = mount.querySelector("#toggle-layout-sbs");
    const unifiedBtn = mount.querySelector("#toggle-layout-unified");
    if (sbsBtn) {
      sbsBtn.addEventListener("click", () => {
        rosterLayout = "side-by-side";
        renderRosterView();
      });
    }
    if (unifiedBtn) {
      unifiedBtn.addEventListener("click", () => {
        rosterLayout = "unified";
        renderRosterView();
      });
    }

    const searchInput = mount.querySelector("#roster-search");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        rosterQuery = e.target.value.toLowerCase().trim();
        renderRosterView();
        const freshInput = mount.querySelector("#roster-search");
        if (freshInput) {
          freshInput.focus();
          freshInput.selectionStart = freshInput.selectionEnd = freshInput.value.length;
        }
      });
    }

    mount.querySelectorAll(".btn-switch-to-categories").forEach(btn => {
      btn.addEventListener("click", () => {
        activeMode = "categories";
        updateActiveModePill();
        renderCategoriesView();
      });
    });
  }

  // Render Categories Sub-View (Original 9 Categories with expandable guest name accordions)
  function renderCategoriesView() {
    const mount = container.querySelector("#guests-dynamic-mount");
    if (!mount) return;

    let filtered = guestRecords.filter(r => {
      if (catEvent !== "all" && r.event !== catEvent) return false;
      if (catSide === "summary" && !r.id.includes("summary")) return false;
      if (catSide === "Groom" && r.owner !== "Groom") return false;
      if (catSide === "Bride" && r.owner !== "Bride") return false;
      if (catQuery) {
        const text = [r.title, r.event, r.owner, r.detail, r.status].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(catQuery)) return false;
      }
      return true;
    });

    const badge = container.querySelector("#guests-counter-badge");
    if (badge) badge.innerHTML = `Showing <strong>${filtered.length}</strong> of ${guestRecords.length} Categories`;

    let html = `
      <div class="checklist-phase-tabs" id="cat-event-tabs">
        <button type="button" class="checklist-phase-btn ${catEvent === "all" ? "active" : ""}" data-event="all">All Events (${guestRecords.length})</button>
        <button type="button" class="checklist-phase-btn ${catEvent === "Tunang" ? "active" : ""}" data-event="Tunang">1. Tunang (${guestRecords.filter(r => r.event === "Tunang").length})</button>
        <button type="button" class="checklist-phase-btn ${catEvent === "Nikah" ? "active" : ""}" data-event="Nikah">2. Nikah (${guestRecords.filter(r => r.event === "Nikah").length})</button>
        <button type="button" class="checklist-phase-btn ${catEvent === "Sanding" ? "active" : ""}" data-event="Sanding">3. Sanding (${guestRecords.filter(r => r.event === "Sanding").length})</button>
      </div>

      <div class="checklist-headline-row" style="margin-top: 10px;">
        <div class="filter-pills-group" id="cat-side-pills">
          <button type="button" class="filter-pill ${catSide === "all" ? "active" : ""}" data-side="all">All Sides</button>
          <button type="button" class="filter-pill ${catSide === "summary" ? "active" : ""}" data-side="summary">Summary Allocations</button>
          <button type="button" class="filter-pill ${catSide === "Groom" ? "active" : ""}" data-side="Groom">Groom Family &amp; Friends</button>
          <button type="button" class="filter-pill ${catSide === "Bride" ? "active" : ""}" data-side="Bride">Bride Family &amp; Friends</button>
        </div>
        <div class="checklist-filters-row">
          <input type="text" class="checklist-search-input" id="cat-search" value="${catQuery}" placeholder="Type to search guest allocations…">
        </div>
      </div>
    `;

    if (!filtered.length) {
      html += `<p class="empty" style="padding: 30px; text-align: center;">No matching guest allocation records found.</p>`;
      mount.innerHTML = html;
      attachCatListeners(mount);
      return;
    }

    const tableWrap = make("div", "table-wrap");
    tableWrap.style.overflowX = "auto";
    tableWrap.style.marginTop = "14px";
    const tableEl = make("table", "checklist-table");
    tableEl.innerHTML = `
      <thead>
        <tr>
          <th class="col-no">No.</th>
          <th>Event Phase</th>
          <th>Allocation Category</th>
          <th style="width: 110px;">Side / Owner</th>
          <th style="width: 100px; text-align: right;">Target Pax</th>
          <th style="width: 110px; text-align: right;">Confirmed Pax</th>
          <th style="width: 120px;">RSVP Status</th>
          <th style="width: 110px;">Live Sheet</th>
        </tr>
      </thead>
      <tbody>
        ${filtered.map((r, idx) => {
          const isSummary = r.id.includes("summary");
          const isGroomTunang = r.id === "guest-tunang-groom";
          const isBrideTunang = r.id === "guest-tunang-bride";
          const hasInlineNames = isGroomTunang || isBrideTunang;
          const isExpanded = expandedCatRows.has(r.id);

          const sideLabel = isSummary ? "Joint (50/50)" : (r.owner || "Shared");
          const sideClass = r.owner === "Groom" ? "color:#1D4ED8;background:#DBEAFE;" : (r.owner === "Bride" ? "color:#BE185D;background:#FCE7F3;" : "color:var(--burgundy);background:var(--burgundy-soft);");
          const statusClass = r.status === "Confirmed" ? "done" : "progress";
          const source = r.sources?.[0];
          const sourceHtml = source
            ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip">${source.label} ↗</a>`
            : "—";

          let inlineExpandBtn = "";
          if (isGroomTunang) {
            inlineExpandBtn = `<button type="button" class="btn-toggle-cat-roster" data-id="${r.id}" style="margin-top: 6px; font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid #93C5FD; background: #EFF6FF; color: #1E40AF; cursor: pointer; font-weight: 700;">${isExpanded ? "▲ Tutup 9 Nama Tetamu" : "▼ Lihat 9 Nama Tetamu Pihak Lelaki"}</button>`;
          } else if (isBrideTunang) {
            inlineExpandBtn = `<button type="button" class="btn-toggle-cat-roster" data-id="${r.id}" style="margin-top: 6px; font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid #F9A8D4; background: #FDF2F8; color: #9D174D; cursor: pointer; font-weight: 700;">${isExpanded ? "▲ Tutup 14 Nama Tetamu" : "▼ Lihat 14 Nama Tetamu Pihak Perempuan"}</button>`;
          }

          let expandedRowHtml = "";
          if (isExpanded) {
            const rosterItems = isGroomTunang
              ? TUNANG_GUEST_ROSTER.filter(g => g.side === "Groom")
              : TUNANG_GUEST_ROSTER.filter(g => g.side === "Bride");

            expandedRowHtml = `
              <tr style="background: ${isGroomTunang ? "#F0F7FF" : "#FFF5F7"};">
                <td colspan="8" style="padding: 12px 16px;">
                  <div style="font-weight: 800; font-size: 12px; color: ${isGroomTunang ? "#1E3A8A" : "#831843"}; margin-bottom: 8px;">
                    📋 Senarai Nama Rasmi (${rosterItems.reduce((s, g) => s + g.pax, 0)} Pax · ${rosterItems.length} Kumpulan):
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px;">
                    ${rosterItems.map(g => `
                      <div style="background: #fff; border: 1px solid ${isGroomTunang ? "#BFDBFE" : "#FBCFE8"}; border-radius: 6px; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                          <div style="font-weight: 700; font-size: 12px; color: var(--charcoal);">${g.no}. ${g.name}</div>
                          <div style="font-size: 10.5px; color: var(--charcoal-muted);">${g.role}</div>
                        </div>
                        <span style="font-size: 11px; font-weight: 800; color: ${isGroomTunang ? "#1D4ED8" : "#BE185D"}; background: ${isGroomTunang ? "#EFF6FF" : "#FDF2F8"}; padding: 2px 6px; border-radius: 4px;">${g.pax} Pax</span>
                      </div>
                    `).join("")}
                  </div>
                </td>
              </tr>
            `;
          }

          return `
            <tr style="${isSummary ? "background: #FAF8F5; font-weight: 600;" : ""}">
              <td class="col-no">${idx + 1}</td>
              <td>${renderPhaseChip(r.event)}</td>
              <td>
                <div style="font-weight: 700; color: var(--charcoal);">${r.title}</div>
                <div style="font-size: 11.5px; color: var(--charcoal-muted); margin-top: 3px; line-height: 1.4;">${r.detail || ""}</div>
                ${inlineExpandBtn}
              </td>
              <td>
                <span style="font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; ${sideClass}">${sideLabel}</span>
              </td>
              <td style="text-align: right; font-weight: 700; color: var(--charcoal);">${r.targetPax ?? "—"}</td>
              <td style="text-align: right; font-weight: 700; color: var(--burgundy);">${r.confirmedPax ?? "—"}</td>
              <td>
                <span class="status-chip ${statusClass}">${r.status}</span>
              </td>
              <td>${sourceHtml}</td>
            </tr>
            ${expandedRowHtml}
          `;
        }).join("")}
      </tbody>
    `;

    mount.innerHTML = html;
    tableWrap.append(tableEl);
    mount.append(tableWrap);
    attachCatListeners(mount);
  }

  function attachCatListeners(mount) {
    mount.querySelectorAll("#cat-event-tabs button").forEach(btn => {
      btn.addEventListener("click", () => {
        catEvent = btn.dataset.event;
        renderCategoriesView();
      });
    });

    mount.querySelectorAll("#cat-side-pills button").forEach(btn => {
      btn.addEventListener("click", () => {
        catSide = btn.dataset.side;
        renderCategoriesView();
      });
    });

    const searchInput = mount.querySelector("#cat-search");
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        catQuery = e.target.value.toLowerCase().trim();
        renderCategoriesView();
        const freshInput = mount.querySelector("#cat-search");
        if (freshInput) {
          freshInput.focus();
          freshInput.selectionStart = freshInput.selectionEnd = freshInput.value.length;
        }
      });
    }

    mount.querySelectorAll(".btn-toggle-cat-roster").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (expandedCatRows.has(id)) {
          expandedCatRows.delete(id);
        } else {
          expandedCatRows.add(id);
        }
        renderCategoriesView();
      });
    });
  }

  function updateActiveModePill() {
    container.querySelectorAll("#guest-mode-switcher .guest-mode-pill").forEach(btn => {
      const isCur = btn.dataset.mode === activeMode;
      btn.classList.toggle("active", isCur);
      if (isCur) {
        btn.style.background = "var(--burgundy)";
        btn.style.color = "#fff";
        btn.style.borderColor = "var(--burgundy)";
        btn.style.fontWeight = "700";
      } else {
        btn.style.background = "var(--bg-soft)";
        btn.style.color = "var(--charcoal)";
        btn.style.borderColor = "var(--border)";
        btn.style.fontWeight = "600";
      }
    });
  }

  // Handle Mode Switcher
  container.querySelectorAll("#guest-mode-switcher .guest-mode-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      activeMode = btn.dataset.mode;
      updateActiveModePill();
      if (activeMode === "roster") {
        renderRosterView();
      } else {
        renderCategoriesView();
      }
    });
  });

  // Initial render
  if (activeMode === "roster") {
    renderRosterView();
  } else {
    renderCategoriesView();
  }

  parent.append(container);
}


/* ========================================================================= */
/* 3E. VENDORS & CONTRACT COMMITMENTS (TAB 5)                                */
/* ========================================================================= */
function vendorsView(parent, records = []) {
  const vendorRecords = records.length ? records : snapshot.records.filter(r => r.tab === "vendors");
  const container = make("div", "master-vendors-container");

  let curEvent = "all";
  let curQuery = "";

  container.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Vendors, Venues &amp; Creative Partners</h2>
          <p class="section-caption">Contracted venues, catering, bridal, photo &amp; videography packages with verified payment schedules and outstanding commitments.</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span id="vendors-counter-badge">Showing <strong>${vendorRecords.length}</strong> of ${vendorRecords.length} Partners</span>
        </div>
      </div>

      <!-- Critical Deadlines & Revision Highlights Banner -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
        <div style="background: #FFFFFF; border: 1px solid var(--border); border-left: 4px solid var(--burgundy); border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: var(--burgundy); font-size: 14px;">Royale Palace (Grand Reception Venue)</strong>
            <span class="pill-chip" style="background: #DCFCE7; color: #166534; font-size: 10px; font-weight: 700;">Package RM 17,500</span>
          </div>
          <div style="font-size: 12px; color: var(--charcoal); line-height: 1.5;">
            RM 3,500 paid (19 Jul RM1,000 + 29 Aug RM2,500). Remaining balance: <strong>RM 14,000.00</strong>.<br>
            <span style="color: #92400E; font-weight: 600;">📅 Written Deadlines:</span> 2nd payment RM 5,250 due <strong>31 Jul 2027</strong> · Final payment RM 8,750 due <strong>31 Oct 2027</strong>.
          </div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid var(--border); border-left: 4px solid #2563EB; border-radius: 8px; padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #2563EB; font-size: 14px;">Deloka Videography (Critical Revision)</strong>
            <span class="pill-chip" style="background: #FEE2E2; color: #991B1B; font-size: 10px; font-weight: 700;">Add-on CANCELLED</span>
          </div>
          <div style="font-size: 12px; color: var(--charcoal); line-height: 1.5;">
            RM 600 post-wedding shoot add-on is <strong>CANCELLED</strong>. Package revised to <strong>RM 1,912.00</strong>.<br>
            RM 200 deposit paid (31 Jul 2026). Remaining balance: <strong>RM 1,712.00</strong> (RM 1,369.60 due 12 Mar 2027 · RM 342.40 due 28 Nov 2027).
          </div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="checklist-headline-row">
        <div class="checklist-phase-tabs" id="vendor-event-tabs">
          <button type="button" class="checklist-phase-btn active" data-event="all">All Vendors (${vendorRecords.length})</button>
          <button type="button" class="checklist-phase-btn" data-event="Tunang">Tunang (${vendorRecords.filter(r => r.event === "Tunang").length})</button>
          <button type="button" class="checklist-phase-btn" data-event="Nikah">Nikah (${vendorRecords.filter(r => r.event === "Nikah").length})</button>
          <button type="button" class="checklist-phase-btn" data-event="Sanding">Sanding (${vendorRecords.filter(r => r.event === "Sanding").length})</button>
          <button type="button" class="checklist-phase-btn" data-event="Nikah+Sanding">Creative Both (${vendorRecords.filter(r => r.event === "Nikah+Sanding").length})</button>
        </div>
        <div class="checklist-filters-row">
          <input type="text" class="checklist-search-input" id="vendor-search" placeholder="Search vendors by name or service…">
        </div>
      </div>
    </div>

    <div id="vendors-grid-mount" style="margin-top: 16px;"></div>
  `;

  function renderVendorGrid() {
    const mount = container.querySelector("#vendors-grid-mount");
    if (!mount) return;

    let filtered = vendorRecords.filter(r => {
      if (curEvent !== "all" && r.event !== curEvent) return false;
      if (curQuery) {
        const text = [r.title, r.event, r.status, r.detail].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(curQuery)) return false;
      }
      return true;
    });

    const badge = container.querySelector("#vendors-counter-badge");
    if (badge) badge.innerHTML = `Showing <strong>${filtered.length}</strong> of ${vendorRecords.length} Partners`;

    if (!filtered.length) {
      mount.innerHTML = `<p class="empty" style="padding: 30px; text-align: center;">No matching vendor records found.</p>`;
      return;
    }

    const gridEl = make("div", "grid");
    gridEl.innerHTML = filtered.map(v => {
      const isDeloka = v.title.toLowerCase().includes("deloka");
      const isRoyale = v.title.toLowerCase().includes("royale") || v.title.toLowerCase().includes("gokahwin");
      const source = v.sources?.[0];
      const sourceHtml = source
        ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip">${source.label} ↗</a>`
        : "";

      return `
        <article class="card" style="${isRoyale ? "border-top: 3px solid var(--burgundy);" : (isDeloka ? "border-top: 3px solid #2563EB;" : "")}">
          <div class="meta">
            <span class="eyebrow">${renderPhaseChip(v.event)}</span>
            <span class="status-chip ${v.status === "Cancellation pending" ? "pending" : "done"}">${v.status}</span>
          </div>
          <h3 style="margin: 8px 0 4px 0; font-family: var(--font-serif); font-size: 17px; color: var(--charcoal);">${v.title}</h3>
          <p style="font-size: 12px; color: var(--charcoal-muted); line-height: 1.5; margin: 6px 0 12px 0;">${v.detail}</p>
          <div class="sources" style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border);">
            ${sourceHtml}
          </div>
        </article>
      `;
    }).join("");

    mount.replaceChildren(gridEl);
  }

  container.querySelectorAll("#vendor-event-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("#vendor-event-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      curEvent = btn.dataset.event;
      renderVendorGrid();
    });
  });

  container.querySelector("#vendor-search")?.addEventListener("input", e => {
    curQuery = e.target.value.toLowerCase().trim();
    renderVendorGrid();
  });

  renderVendorGrid();
  parent.append(container);
}

/* ========================================================================= */
/* 3F. SPONSORS, GIFTS & LIVE RECEPTION KIOSKS (TAB 6)                       */
/* ========================================================================= */
function sponsorsView(parent, records = []) {
  const sponsorRecords = records.length ? records : snapshot.records.filter(r => r.tab === "sponsors");
  const container = make("div", "master-sponsors-container");

  let curCategory = "all";
  let curQuery = "";

  container.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Sponsors, Contributions &amp; Live Kiosks</h2>
          <p class="section-caption">Family contributions, ring sponsorships, and reception live food kiosks (strictly distinguished from direct out-of-pocket expenses).</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span id="sponsors-counter-badge">Showing <strong>${sponsorRecords.length}</strong> of ${sponsorRecords.length} Contributions</span>
        </div>
      </div>

      <!-- Quick Metrics Strip -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0;">
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid #15803D; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">ACHIN CASH GIFT</div>
          <div style="font-size: 20px; font-weight: 800; color: #15803D; margin: 4px 0;">RM 1,000.00</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">Cash contribution received &amp; paid into Nikah pool</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid var(--burgundy); border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">MAMA RING SPONSORSHIP</div>
          <div style="font-size: 20px; font-weight: 800; color: var(--burgundy); margin: 4px 0;">RM 500.00</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">Funded Groom Elfi Nikah ring (RM 439) with RM 61 buffer</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid #2563EB; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted); letter-spacing: 0.5px;">LIVE FOOD KIOSKS</div>
          <div style="font-size: 20px; font-weight: 800; color: #2563EB; margin: 4px 0;">7 In-Kind Kiosks</div>
          <div style="font-size: 11px; color: var(--charcoal-muted);">Sanding live stalls (Apam balik, ice cream, laksa, coffee, etc.)</div>
        </div>
      </div>

      <!-- Filters & Search -->
      <div class="checklist-headline-row">
        <div class="filter-pills-group" id="sponsor-cat-pills">
          <button type="button" class="filter-pill active" data-cat="all">All Items (${sponsorRecords.length})</button>
          <button type="button" class="filter-pill" data-cat="Cash">💰 Cash Gifts</button>
          <button type="button" class="filter-pill" data-cat="Kiosk">🍧 Live Reception Kiosks</button>
          <button type="button" class="filter-pill" data-cat="Ring">💍 Ring Sponsorship</button>
        </div>
        <div class="checklist-filters-row">
          <input type="text" class="checklist-search-input" id="sponsor-search" placeholder="Type to search sponsorships &amp; kiosks…">
        </div>
      </div>
    </div>

    <div id="sponsors-grid-mount" style="margin-top: 16px;"></div>
  `;

  function renderSponsorsGrid() {
    const mount = container.querySelector("#sponsors-grid-mount");
    if (!mount) return;

    let filtered = sponsorRecords.filter(r => {
      const isCash = (r.amount || 0) > 0 || r.id.includes("3c8caff3") || r.id === "sponsor-ring";
      const isRing = r.id === "sponsor-ring" || (r.title && r.title.toLowerCase().includes("ring"));
      const isKiosk = !isCash && !isRing;

      if (curCategory === "Cash" && !isCash) return false;
      if (curCategory === "Ring" && !isRing) return false;
      if (curCategory === "Kiosk" && !isKiosk) return false;

      if (curQuery) {
        const text = [r.title, r.event, r.status, r.detail, r.owner].filter(Boolean).join(" ").toLowerCase();
        if (!text.includes(curQuery)) return false;
      }
      return true;
    });

    const badge = container.querySelector("#sponsors-counter-badge");
    if (badge) badge.innerHTML = `Showing <strong>${filtered.length}</strong> of ${sponsorRecords.length} Contributions`;

    if (!filtered.length) {
      mount.innerHTML = `<p class="empty" style="padding: 30px; text-align: center;">No matching contribution records found.</p>`;
      return;
    }

    const gridEl = make("div", "grid");
    gridEl.innerHTML = filtered.map(s => {
      const isCash = (s.amount || 0) > 0 || s.id.includes("3c8caff3");
      const source = s.sources?.[0];
      const sourceHtml = source
        ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip">${source.label} ↗</a>`
        : "";

      return `
        <article class="card">
          <div class="meta">
            <span class="eyebrow">${renderPhaseChip(s.event)}</span>
            <span class="status-chip ${s.status === "Paid" ? "done" : "progress"}">${s.status}</span>
          </div>
          <h3 style="margin: 8px 0 4px 0; font-family: var(--font-serif); font-size: 17px; color: var(--charcoal);">${s.title}</h3>
          ${isCash ? `<p class="key" style="font-size: 16px; font-weight: 800; color: #15803D; margin: 4px 0;">${money(s.amount)}</p>` : ""}
          <p style="font-size: 12px; color: var(--charcoal-muted); line-height: 1.5; margin: 6px 0 12px 0;">${s.detail || ""}</p>
          <div class="sources" style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border);">
            ${sourceHtml}
          </div>
        </article>
      `;
    }).join("");

    mount.replaceChildren(gridEl);
  }

  container.querySelectorAll("#sponsor-cat-pills button").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("#sponsor-cat-pills button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      curCategory = btn.dataset.cat;
      renderSponsorsGrid();
    });
  });

  container.querySelector("#sponsor-search")?.addEventListener("input", e => {
    curQuery = e.target.value.toLowerCase().trim();
    renderSponsorsGrid();
  });

  renderSponsorsGrid();
  parent.append(container);
}

/* ========================================================================= */
/* 3G. DOCUMENTS, RECEIPTS & SOURCE EVIDENCE REPOSITORY (TAB 7)              */
/* ========================================================================= */
function documentsView(parent, records = []) {
  const fileRecords = records.length ? records : snapshot.records.filter(r => r.tab === "files");
  const driveFiles = fileRecords.filter(r => r.status === "Google Drive" || (r.sources?.[0]?.url || "").includes("drive.google.com"));
  const notionFiles = fileRecords.filter(r => r.status === "Notion" || (r.sources?.[0]?.url || "").includes("notion.com") || (r.sources?.[0]?.url || "").includes("notion.so"));

  const container = make("div", "master-documents-container");
  container.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Documents, Invoices &amp; Source Evidence</h2>
          <p class="section-caption">Direct access to verified Google Drive receipt vaults, payment invoices, vendor agreements, and Notion AI Hub databases.</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span class="pill-chip" style="background: #DCFCE7; color: #166534; font-weight: 700;">✓ 10 Verified Data Repositories</span>
        </div>
      </div>
    </div>

    <!-- Section A: Google Drive Storage Vaults -->
    <div style="margin-top: 20px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 18px;">📁</span>
        <h3 style="font-family: var(--font-serif); font-size: 17px; color: var(--charcoal); margin: 0;">Google Drive Storage &amp; Receipt Vaults</h3>
      </div>
      <div class="grid">
        ${driveFiles.map(f => {
          const source = f.sources?.[0];
          return `
            <article class="card" style="border-left: 3px solid #15803D;">
              <div class="meta">
                <span class="eyebrow">${renderPhaseChip(f.event)}</span>
                <span class="status-chip done">Google Drive</span>
              </div>
              <h3 style="margin: 8px 0 4px 0; font-family: var(--font-serif); font-size: 16px; color: var(--charcoal);">${f.title}</h3>
              <p style="font-size: 12px; color: var(--charcoal-muted); line-height: 1.5; margin: 4px 0 12px 0;">${f.detail}</p>
              <div class="sources" style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border);">
                ${source ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip" style="font-weight: 700;">Open Folder in Google Drive ↗</a>` : ""}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>

    <!-- Section B: Notion AI Hub Official Databases -->
    <div style="margin-top: 28px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 18px;">📝</span>
        <h3 style="font-family: var(--font-serif); font-size: 17px; color: var(--charcoal); margin: 0;">Notion Official AI Hub Databases</h3>
      </div>
      <div class="grid">
        ${notionFiles.map(f => {
          const source = f.sources?.[0];
          return `
            <article class="card" style="border-left: 3px solid var(--burgundy);">
              <div class="meta">
                <span class="eyebrow">${renderPhaseChip(f.event)}</span>
                <span class="status-chip progress" style="background: var(--burgundy-soft); color: var(--burgundy);">Notion Database</span>
              </div>
              <h3 style="margin: 8px 0 4px 0; font-family: var(--font-serif); font-size: 16px; color: var(--charcoal);">${f.title}</h3>
              <p style="font-size: 12px; color: var(--charcoal-muted); line-height: 1.5; margin: 4px 0 12px 0;">${f.detail}</p>
              <div class="sources" style="margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border);">
                ${source ? `<a href="${source.url}" target="_blank" rel="noopener noreferrer" class="source-link-chip" style="font-weight: 700;">Open in Notion ↗</a>` : ""}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </div>
  `;

  parent.append(container);
}

/* ========================================================================= */
/* 3H. SYNC & AUDIT TRAIL RECONCILIATION (TAB 8)                             */
/* ========================================================================= */
function auditView(parent, records = []) {
  const auditRecords = records.length ? records : snapshot.records.filter(r => r.tab === "audit");
  const container = make("div", "master-audit-container");

  container.innerHTML = `
    <div class="checklist-control-head" style="margin-top: 10px;">
      <div class="checklist-headline-row">
        <div>
          <h2 class="section-title">Sync, Reconciliation &amp; Audit Trail</h2>
          <p class="section-caption">Immutable cross-source verification between Google Sheets, Notion and Drive receipts, tracking verified decisions and historical corrections.</p>
        </div>
        <div class="checklist-progress-bar-wrap">
          <span class="pill-chip" style="background: #DCFCE7; color: #166534; font-weight: 700;">✓ ${auditRecords.filter(r => r.status === "Reconciled").length} Reconciled Items</span>
        </div>
      </div>

      <!-- Audit Baseline Highlights Strip -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0;">
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid #15803D; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">PAID BASELINE</div>
          <div style="font-size: 18px; font-weight: 800; color: #15803D; margin: 4px 0;">RM 7,998.00</div>
          <div style="font-size: 10.5px; color: var(--charcoal-muted);">16 Transactions Verified</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid #DC2626; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">DELOKA CORRECTION</div>
          <div style="font-size: 18px; font-weight: 800; color: #DC2626; margin: 4px 0;">-RM 600 Cancelled</div>
          <div style="font-size: 10.5px; color: var(--charcoal-muted);">Package revised to RM 1,912</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid #2563EB; border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">NIKAH VENUE</div>
          <div style="font-size: 18px; font-weight: 800; color: #2563EB; margin: 4px 0;">Masjid Cyberjaya</div>
          <div style="font-size: 10.5px; color: var(--charcoal-muted);">Masjid Besi obsolete note</div>
        </div>
        <div style="background: var(--bg-soft); border: 1px solid var(--border); border-left: 3px solid var(--burgundy); border-radius: 8px; padding: 12px;">
          <div style="font-size: 10px; font-weight: 800; color: var(--charcoal-muted);">ROYALE PALACE</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--burgundy); margin: 4px 0;">RM 14,000 Due</div>
          <div style="font-size: 10.5px; color: var(--charcoal-muted);">Deadlines: 31 Jul &amp; 31 Oct 2027</div>
        </div>
      </div>
    </div>

    <!-- Audit Records Table -->
    <div class="table-wrap" style="overflow-x: auto; margin-top: 14px;">
      <table class="checklist-table">
        <thead>
          <tr>
            <th class="col-no">No.</th>
            <th style="width: 110px;">Scope</th>
            <th>Verification Item &amp; Audit Finding</th>
            <th style="width: 120px;">Decision Status</th>
            <th style="width: 140px;">Sources</th>
          </tr>
        </thead>
        <tbody>
          ${auditRecords.map((r, idx) => {
            const isReconciled = r.status === "Reconciled";
            const statusClass = isReconciled ? "done" : "progress";
            const sourcesHtml = (r.sources || []).map(sourceLink).map(s => s.outerHTML).join(" ");

            return `
              <tr>
                <td class="col-no">${idx + 1}</td>
                <td>${renderPhaseChip(r.event)}</td>
                <td>
                  <div style="font-weight: 700; color: var(--charcoal);">${r.title}</div>
                  <div style="font-size: 12px; color: var(--charcoal-muted); margin-top: 3px; line-height: 1.45;">${r.detail}</div>
                </td>
                <td>
                  <span class="status-chip ${statusClass}">${r.status}</span>
                </td>
                <td>${sourcesHtml || "—"}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;

  parent.append(container);
}

/* ========================================================================= */
/* 3I. CONSOLIDATED DIRECTORY HUB (GUESTS · VENDORS · SPONSORS)              */
/* ========================================================================= */
function directoryHubView(parent, activeSub = "guests") {
  const container = make("div", "directory-hub-wrap");
  
  if (!["guests", "vendors", "sponsors"].includes(activeSub)) {
    activeSub = "guests";
  }

  const navBar = make("div", "subnav-segmented-bar");
  navBar.innerHTML = `
    <button type="button" class="subnav-pill ${activeSub === 'guests' ? 'is-active' : ''}" data-sub="guests">
      👥 Guest Lists <span class="tab-badge">3</span>
    </button>
    <button type="button" class="subnav-pill ${activeSub === 'vendors' ? 'is-active' : ''}" data-sub="vendors">
      🤝 Vendors &amp; Venues <span class="tab-badge">8</span>
    </button>
    <button type="button" class="subnav-pill ${activeSub === 'sponsors' ? 'is-active' : ''}" data-sub="sponsors">
      🎁 Sponsors &amp; Kiosks <span class="tab-badge">9</span>
    </button>
  `;

  const contentMount = make("div", "hub-content-mount");
  container.append(navBar, contentMount);

  function renderSub(sub) {
    activeSub = sub;
    contentMount.replaceChildren();
    navBar.querySelectorAll(".subnav-pill").forEach(btn => {
      btn.classList.toggle("is-active", btn.getAttribute("data-sub") === sub);
    });

    if (sub === "vendors") {
      vendorsView(contentMount, snapshot.records.filter(r => r.tab === "vendors"));
    } else if (sub === "sponsors") {
      sponsorsView(contentMount, snapshot.records.filter(r => r.tab === "sponsors"));
    } else {
      guestsView(contentMount, snapshot.records.filter(r => r.tab === "guests"));
    }
  }

  navBar.querySelectorAll(".subnav-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const sub = btn.getAttribute("data-sub");
      location.hash = "#" + sub;
      renderSub(sub);
    });
  });

  renderSub(activeSub);
  parent.append(container);
}

/* ========================================================================= */
/* 3J. CONSOLIDATED RECORDS & AUDIT HUB (DOCUMENTS & RECONCILIATION LOG)     */
/* ========================================================================= */
function recordsHubView(parent, activeSub = "documents") {
  const container = make("div", "records-hub-wrap");

  if (!["documents", "files", "audit"].includes(activeSub)) {
    activeSub = "documents";
  }

  const navBar = make("div", "subnav-segmented-bar");
  navBar.innerHTML = `
    <button type="button" class="subnav-pill ${activeSub !== 'audit' ? 'is-active' : ''}" data-sub="documents">
      📁 Documents &amp; Invoices <span class="tab-badge">10</span>
    </button>
    <button type="button" class="subnav-pill ${activeSub === 'audit' ? 'is-active' : ''}" data-sub="audit">
      ⚖ Sync &amp; Audit Trail <span class="tab-badge">9</span>
    </button>
  `;

  const contentMount = make("div", "hub-content-mount");
  container.append(navBar, contentMount);

  function renderSub(sub) {
    activeSub = sub;
    contentMount.replaceChildren();
    navBar.querySelectorAll(".subnav-pill").forEach(btn => {
      const targetSub = btn.getAttribute("data-sub");
      btn.classList.toggle("is-active", (targetSub === "documents" && sub !== "audit") || (targetSub === "audit" && sub === "audit"));
    });

    if (sub === "audit") {
      auditView(contentMount, snapshot.records.filter(r => r.tab === "audit"));
    } else {
      documentsView(contentMount, snapshot.records.filter(r => r.tab === "files"));
    }
  }

  navBar.querySelectorAll(".subnav-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      const sub = btn.getAttribute("data-sub");
      location.hash = "#" + sub;
      renderSub(sub);
    });
  });

  renderSub(activeSub);
  parent.append(container);
}

/* ========================================================================= */
/* 4. MASTER TAB ROUTER & DUAL-ROLE VIEWS (SOYA & RIN vs GUEST & VENDOR)    */
/* ========================================================================= */
function getActiveTabs() {
  if (isAuthenticated) {
    return {
      overview: ["Overview", "❖", "Executive Cockpit", ""],
      checklist: ["Checklist", "☑", "Tasks & Deadlines", "34"],
      expenses: ["Expenses", "💰", "Reconciled Ledger & Split", "16"],
      tentative: ["Tentative", "📅", "Day Programmes & Timelines", "3"],
      directory: ["Directory", "👥", "Guests · Vendors · Sponsors", "20"],
      records: ["Records & Audit", "📁", "Documents & Sync Trail", "19"]
    };
  } else {
    return {
      guest: ["Guest Menu", "🌸", "Official Wedding Guide", ""],
      tentative: ["Tentatives", "📅", "Day Programmes & Posters", ""],
      contacts: ["Contacts", "📞", "Key PIC Directory", ""]
    };
  }
}

function renderNav() {
  const navBar = $("nav");
  if (!navBar) return;
  navBar.replaceChildren();
  const tabsInner = make("div", "tabs-bar-inner");
  const currentTabs = getActiveTabs();

  let requested = location.hash.slice(1);
  if (!requested || requested === "dashboard") requested = isAuthenticated ? "overview" : "guest";
  if (requested === "events") requested = "tentative";
  let activeTabId = requested;
  if (["guests", "vendors", "sponsors"].includes(requested)) {
    activeTabId = "directory";
  } else if (["files", "documents", "audit"].includes(requested)) {
    activeTabId = "records";
  }

  for (const [id, [title, icon, , count]] of Object.entries(currentTabs)) {
    const link = make("a");
    link.href = "#" + id;
    if (activeTabId === id) link.setAttribute("aria-current", "page");
    const glyph = make("span", "icon", icon);
    glyph.setAttribute("aria-hidden", "true");
    link.append(glyph, make("span", "", title));
    if (count) {
      link.append(make("span", "tab-badge", count));
    }
    tabsInner.append(link);
  }

  // Admin access button when signed out; no Guest View button when signed in
  if (!isAuthenticated) {
    const adminLink = make("a", "nav-admin-btn");
    adminLink.href = "#admin";
    adminLink.title = "Soya & Rin Admin Access (Unlock Control Center)";
    const glyph = make("span", "icon", "🔒");
    adminLink.append(glyph, make("span", "", "Admin Sign-In"));
    adminLink.addEventListener("click", e => {
      e.preventDefault();
      openAuthModal();
    });
    tabsInner.append(adminLink);
  }

  navBar.append(tabsInner);
}

function guestContactsView(parent) {
  const container = make("div", "guest-guide-wrap");
  const picSection = make("div", "coordinator-card");
  picSection.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
      <div>
        <h3 style="font-family: var(--font-serif); font-size: 20px; color: var(--burgundy); margin: 0 0 4px 0;">
          📞 Event Day Coordinators &amp; PIC Directory
        </h3>
        <p style="font-size: 13px; color: var(--charcoal-muted); margin: 0;">
          Direct contacts for event logistics, venue coordination, photo/video, and couple emergencies.
        </p>
      </div>
    </div>
    <div style="overflow-x: auto;">
      <table class="coordinator-table">
        <thead>
          <tr>
            <th style="width: 40px;">No.</th>
            <th>Role / Responsibility</th>
            <th>Contact Person / Venue</th>
            <th>Event Phase</th>
            <th>Contact Number</th>
            <th>Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td>
            <td><strong>Tunang Venue Manager</strong></td>
            <td>En. Izz · Gastrohub Event House (Nilai)</td>
            <td><span class="phase-chip-tunang">Tunang</span></td>
            <td><code>013-5599032</code></td>
            <td>
              <a href="tel:0135599032" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60135599032" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
              <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #FEF3C7; color: #B45309;">🧭 Waze</a>
            </td>
          </tr>
          <tr>
            <td>2</td>
            <td><strong>Nikah Venue Officer</strong></td>
            <td>Ustaz Syahir · Masjid Raja Haji Fi Sabilillah</td>
            <td><span class="phase-chip-nikah">Nikah</span></td>
            <td><code>+60 13-476 7535</code></td>
            <td>
              <a href="tel:+60134767535" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60134767535" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
              <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #FEF3C7; color: #B45309;">🧭 Waze</a>
            </td>
          </tr>
          <tr>
            <td>3</td>
            <td><strong>Sanding Venue Coordinator</strong></td>
            <td>Elyna · Royale Palace Cyberjaya</td>
            <td><span class="phase-chip-sanding">Sanding</span></td>
            <td><code>+60 17-937 7965</code></td>
            <td>
              <a href="tel:+60179377965" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60179377965" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
              <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #FEF3C7; color: #B45309;">🧭 Waze</a>
            </td>
          </tr>
          <tr>
            <td>4</td>
            <td><strong>Official Photographer (MSSA)</strong></td>
            <td>Intan · MSSA Photography</td>
            <td><span class="phase-chip-nikah">Nikah</span> <span class="phase-chip-sanding">Sanding</span></td>
            <td><code>019-7677917</code></td>
            <td>
              <a href="tel:0197677917" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60197677917" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td>5</td>
            <td><strong>Official Videographer (Deloka)</strong></td>
            <td>Affi · Deloka Films</td>
            <td><span class="phase-chip-nikah">Nikah</span> <span class="phase-chip-sanding">Sanding</span></td>
            <td><code>@affi.izzani</code></td>
            <td>
              <a href="https://instagram.com/affi.izzani" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #FCE7F3; color: #9D174D;">📸 IG Direct</a>
            </td>
          </tr>
          <tr>
            <td>6</td>
            <td><strong>Official Videographer (Sejeda)</strong></td>
            <td>Jid · SejedaFilms</td>
            <td><span class="phase-chip-nikah">Nikah</span></td>
            <td><code>+6011-28446534</code></td>
            <td>
              <a href="tel:+601128446534" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/601128446534" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td>7</td>
            <td><strong>Groom Emergency PIC</strong></td>
            <td>Sayed Arif Hakimi (Groom)</td>
            <td><span class="phase-chip-shared">All Events</span></td>
            <td><code>018-3767437</code></td>
            <td>
              <a href="tel:0183767437" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60183767437" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
            </td>
          </tr>
          <tr>
            <td>8</td>
            <td><strong>Bride Emergency PIC</strong></td>
            <td>Nor Shamira Irwani (Bride)</td>
            <td><span class="phase-chip-shared">All Events</span></td>
            <td><code>018-9559415</code></td>
            <td>
              <a href="tel:0189559415" class="coord-call-btn">📞 Call</a>
              <a href="https://wa.me/60189559415" target="_blank" rel="noopener noreferrer" class="coord-call-btn" style="background: #E0F2FE; color: #0369A1;">💬 WhatsApp</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  container.append(picSection);
  parent.append(container);
}

function guestView(parent) {
  const container = make("div", "guest-guide-wrap");

  // 1. Hero Card (Minimal, balanced, full-width)
  const hero = make("div", "guest-hero-card");
  hero.innerHTML = `
    <div style="width: 100%;">
      <div class="guest-hero-title">
        <span>Sayed &amp; Shamira Wedding</span>
        <span class="hashtag-badge" id="guest-secret-auth" title="#SAHdenganIra" style="cursor: pointer; user-select: none;">#SAHdenganIra</span>
        <span class="year-badge">2026 – 2027</span>
      </div>
      <p class="guest-hero-sub" style="font-style: italic;">
        Dengan penuh kesyukuran dan kasih sayang, kami mengalu-alukan kehadiran keluarga serta para tetamu yang dirahmati ke lembaran bahagia kami.
      </p>
    </div>
  `;
  container.append(hero);

  // Secret shortcut: 2 quick taps or double-click on hashtag badge triggers passcode modal for Soya & Rin
  let secretClicks = 0;
  let secretTimer = null;
  hero.querySelector("#guest-secret-auth")?.addEventListener("click", () => {
    secretClicks++;
    if (secretClicks >= 2) {
      secretClicks = 0;
      clearTimeout(secretTimer);
      openAuthModal();
    } else {
      clearTimeout(secretTimer);
      secretTimer = setTimeout(() => { secretClicks = 0; }, 600);
    }
  });

  // 2. The Three Wedding Phases (Event Cards Grid)
  const eventsGrid = make("div", "guest-event-grid");

  // Phase 1: Tunang
  const tunangCard = make("article", "guest-event-card");
  tunangCard.innerHTML = `
    <div class="guest-event-eyebrow">
      <span class="phase-chip-tunang">1. Tunang</span>
      <span>Sunday, 27/12/2026</span>
    </div>
    <div>
      <div class="guest-countdown-badge">
        <span>${daysUntil("2026-12-27")}</span>
        <span class="guest-countdown-label">Days to go</span>
      </div>
    </div>
    <div class="guest-event-meta-list">
      <div class="guest-meta-item">
        <span><strong>Time:</strong> 10:00 AM – 1:00 PM</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Location:</strong> Gastrohub Event House, Cyberjaya</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Dress Code:</strong> Matcha &amp; Strawberry</span>
      </div>
    </div>
    <div class="guest-actions-bar">
      <a href="https://maps.app.goo.gl/231k2Gxhw8KxayAr7" target="_blank" rel="noopener noreferrer" class="guest-btn">📍 Google Maps</a>
      <a href="https://waze.com/ul/hw22rurtuh" target="_blank" rel="noopener noreferrer" class="guest-btn">🧭 Waze</a>
      <button type="button" class="guest-btn guest-btn-primary" data-poster="Tunang">🖼️ View Poster</button>
    </div>
  `;

  // Phase 2: Nikah
  const nikahCard = make("article", "guest-event-card");
  nikahCard.innerHTML = `
    <div class="guest-event-eyebrow">
      <span class="phase-chip-nikah">2. Nikah</span>
      <span>Saturday, 27/03/2027</span>
    </div>
    <div>
      <div class="guest-countdown-badge">
        <span>${daysUntil("2027-03-27")}</span>
        <span class="guest-countdown-label">Days to go</span>
      </div>
    </div>
    <div class="guest-event-meta-list">
      <div class="guest-meta-item">
        <span><strong>Time:</strong> 9:00 AM – 1:00 PM</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Location:</strong> Masjid Raja Haji Fi Sabilillah, Cyberjaya</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Dress Code:</strong> Shades of Blue</span>
      </div>
    </div>
    <div class="guest-actions-bar">
      <a href="https://maps.app.goo.gl/tEW5DLnAUDDHascHA" target="_blank" rel="noopener noreferrer" class="guest-btn">📍 Google Maps</a>
      <a href="https://waze.com/ul/hw2829j9sp" target="_blank" rel="noopener noreferrer" class="guest-btn">🧭 Waze</a>
      <button type="button" class="guest-btn guest-btn-primary" data-poster="Nikah">🖼️ View Poster</button>
    </div>
  `;

  // Phase 3: Sanding
  const sandingCard = make("article", "guest-event-card");
  sandingCard.innerHTML = `
    <div class="guest-event-eyebrow">
      <span class="phase-chip-sanding">3. Sanding</span>
      <span>Saturday, 27/11/2027</span>
    </div>
    <div>
      <div class="guest-countdown-badge">
        <span>${daysUntil("2027-11-27")}</span>
        <span class="guest-countdown-label">Days to go</span>
      </div>
    </div>
    <div class="guest-event-meta-list">
      <div class="guest-meta-item">
        <span><strong>Time:</strong> 11:00 AM – 4:00 PM</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Location:</strong> Royale Palace, Cyberjaya</span>
      </div>
      <div class="guest-meta-item">
        <span><strong>Dress Code:</strong> Shades of Purple</span>
      </div>
    </div>
    <div class="guest-actions-bar">
      <a href="https://maps.app.goo.gl/Zuh5LkTiRmYQ63AT9" target="_blank" rel="noopener noreferrer" class="guest-btn">📍 Google Maps</a>
      <a href="https://waze.com/ul/hw2829ntvy" target="_blank" rel="noopener noreferrer" class="guest-btn">🧭 Waze</a>
      <button type="button" class="guest-btn guest-btn-primary" data-poster="Sanding">🖼️ View Poster</button>
    </div>
  `;

  eventsGrid.append(tunangCard, nikahCard, sandingCard);
  container.append(eventsGrid);

  // Wire poster click events
  eventsGrid.querySelectorAll("button[data-poster]").forEach(btn => {
    btn.addEventListener("click", () => {
      const p = btn.getAttribute("data-poster");
      openPosterModal(p, `./posters/poster-${p.toLowerCase()}.jpg`);
    });
  });

  // 3. Interactive Dress Code Palette
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

  // 4. Key Event PIC & Coordinator Directory
  guestContactsView(container);

  parent.append(container);
}

function render() {
  let requested = location.hash.slice(1);
  if (!requested || requested === "dashboard") requested = isAuthenticated ? "overview" : "guest";
  if (requested === "events") requested = "tentative"; // backwards compatibility
  
  // If user requests an admin tab while not authenticated, open unlock modal
  const adminTabs = ["overview", "checklist", "expenses", "tentative", "directory", "records", "guests", "vendors", "sponsors", "files", "documents", "audit", "login", "admin"];
  if (!isAuthenticated && adminTabs.includes(requested)) {
    openAuthModal();
    requested = "guest";
    location.hash = "#guest";
  }

  const currentTabs = getActiveTabs();
  let active = requested;
  if (["guests", "vendors", "sponsors"].includes(requested)) {
    active = "directory";
  } else if (["files", "documents", "audit"].includes(requested)) {
    active = "records";
  } else if (!Object.hasOwn(currentTabs, active)) {
    active = isAuthenticated ? "overview" : "guest";
  }
  
  // Toggle guest-mode on body:
  // In Guest View (active === "guest") OR when unauthenticated, hide the entire masthead (brand, shortcuts, search)!
  if (!isAuthenticated || active === "guest") {
    document.body.classList.add("guest-mode");
  } else {
    document.body.classList.remove("guest-mode");
  }

  renderNav();
  
  const navLinks = $("nav").querySelectorAll("a");
  for (const link of navLinks) {
    if (link.hash === "#" + active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  
  const parent = $("content");
  parent.replaceChildren();

  if (active === "overview" && isAuthenticated) {
    overview(parent);
  } else if (active === "checklist" && isAuthenticated) {
    checklistView(parent, snapshot.records.filter(r => r.tab === "checklist"));
  } else if (active === "expenses" && isAuthenticated) {
    expenses(parent, snapshot.records.filter(r => r.tab === "expenses"));
  } else if (active === "tentative") {
    tentativeView(parent);
  } else if (active === "directory" && isAuthenticated) {
    const sub = ["guests", "vendors", "sponsors"].includes(requested) ? requested : "guests";
    directoryHubView(parent, sub);
  } else if (active === "records" && isAuthenticated) {
    const sub = requested === "audit" ? "audit" : "documents";
    recordsHubView(parent, sub);
  } else if (active === "contacts") {
    guestContactsView(parent);
  } else {
    guestView(parent);
  }
}

// Search Modal Dialog Handler
const dialog = $("search-dialog");
$("open-search")?.addEventListener("click", () => dialog.showModal());
$("close-search")?.addEventListener("click", () => dialog.close());

// Connect Header Search Bar
const headerSearchInput = $("header-search-input");
if (headerSearchInput) {
  headerSearchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      const val = headerSearchInput.value.trim();
      dialog.showModal();
      const queryInput = $("query");
      if (queryInput) {
        queryInput.value = val;
        $("search-form")?.dispatchEvent(new Event("submit"));
      }
    }
  });
}

// Auth Modal Dialog Handler (Supports both Lock/Unlock & Session Toggle)
const authDialog = $("auth-dialog");

function openAuthModal() {
  if (!authDialog) return;
  
  if (isAuthenticated) {
    const form = $("auth-form");
    const headerLabel = form.querySelector(".dialog-header label");
    if (headerLabel) headerLabel.textContent = "Soya & Rin Session Active";
    
    const p = form.querySelector("p");
    if (p) p.innerHTML = "You are currently viewing the full <strong>Master Control Center</strong> (#SAHdenganIra). You can switch to the Guest &amp; Vendor Guide or lock this device.";
    
    const searchLine = form.querySelector(".search-line");
    if (searchLine) {
      searchLine.replaceChildren();
      const guestBtn = make("button", "guest-btn", "🌸 Switch to Guest View");
      guestBtn.type = "button";
      guestBtn.style.padding = "8px 14px";
      guestBtn.addEventListener("click", () => {
        sessionStorage.setItem("soyarin_guest_mode", "1");
        isAuthenticated = false;
        authDialog.close();
        updateAuthUI();
        renderNav();
        location.hash = "#guest";
        render();
        showToast("Switched to Guest & Vendor View");
      });
      
      const logoutBtn = make("button", "guest-btn", "🔒 Sign Out & Lock Device");
      logoutBtn.type = "button";
      logoutBtn.style.padding = "8px 14px";
      logoutBtn.style.color = "#B91C1C";
      logoutBtn.addEventListener("click", async () => {
        localStorage.removeItem("soyarin_passcode");
        sessionStorage.setItem("soyarin_guest_mode", "1");
        try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {}
        try {
          const res = await fetch("/api/state");
          if (res.ok) snapshot = await res.json();
        } catch (e) {}
        isAuthenticated = false;
        authDialog.close();
        updateAuthUI();
        renderNav();
        location.hash = "#guest";
        render();
        showToast("Device locked. Signed out.");
      });
      
      searchLine.append(guestBtn, logoutBtn);
    }
    authDialog.showModal();
    return;
  }
  
  // If not authenticated, show passcode unlock form
  const form = $("auth-form");
  const headerLabel = form.querySelector(".dialog-header label");
  if (headerLabel) headerLabel.textContent = "Soya & Rin Sign-In";
  
  const p = form.querySelector("p");
  if (p) p.innerHTML = "Private wedding workspace access (<strong>#SAHdenganIra</strong>). Enter passcode to unlock financial records, full checklist &amp; vendor contracts.";
  
  const searchLine = form.querySelector(".search-line");
  if (searchLine) {
    searchLine.replaceChildren();
    const input = make("input");
    input.id = "passcode-input";
    input.type = "password";
    input.required = true;
    input.placeholder = "Enter passcode…";
    input.autocomplete = "current-password";
    input.value = "";
    
    const submitBtn = make("button", "", "Unlock Dashboard");
    submitBtn.type = "submit";
    
    searchLine.append(input, submitBtn);
    setTimeout(() => input.focus(), 50);
  }
  
  const errEl = $("auth-error-msg");
  if (errEl) errEl.style.display = "none";
  authDialog.showModal();
}

$("btn-portal-auth")?.addEventListener("click", openAuthModal);
$("close-auth")?.addEventListener("click", () => authDialog.close());

$("auth-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const input = $("passcode-input");
  if (!input) return;
  const passcode = input.value.trim();
  const errorEl = $("auth-error-msg");
  if (errorEl) errorEl.style.display = "none";
  
  let unlocked = false;
  
  // 1. Try static encrypted vault first (e.g. GitHub Pages route /soyarinwedding/)
  const vault = await loadStaticVault();
  if (vault) {
    try {
      snapshot = await decryptMasterVault(passcode, vault);
      unlocked = true;
      sessionStorage.setItem("soyarin_admin_passcode", passcode);
    } catch (e) {
      unlocked = false;
    }
  } else {
    // 2. Server-side authentication
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode })
      });
      if (res.ok) {
        const stateRes = await fetch("/api/state");
        if (stateRes.ok) {
          snapshot = await stateRes.json();
          unlocked = true;
        }
      }
    } catch (e) {}
  }
  
  if (unlocked) {
    sessionStorage.removeItem("soyarin_guest_mode");
    isAuthenticated = true;
    input.value = "";
    authDialog.close();
    updateAuthUI();
    renderNav();
    showToast("✓ Welcome back, Soya & Rin! Dashboard unlocked.");
    location.hash = "#overview";
    render();
  } else {
    // Rate limit failed attempts with backoff delay
    const submitBtn = event.target.querySelector("button[type='submit']");
    if (submitBtn) {
      submitBtn.disabled = true;
      setTimeout(() => { submitBtn.disabled = false; }, 1200);
    }
    if (errorEl) {
      errorEl.textContent = "Invalid passcode. Please try again.";
      errorEl.style.display = "block";
    }
  }
});

function updateBanner() {
  const bannerEl = $("banner");
  if (bannerEl) bannerEl.style.display = "none";
}

// Keyboard shortcut '/' to trigger search
window.addEventListener("keydown", event => {
  if (event.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
    event.preventDefault();
    dialog.showModal();
    $("query").focus();
  }
});

let searchRequest;
$("search-form").addEventListener("submit", async event => {
  event.preventDefault();
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  $("results").replaceChildren(make("p", "section-caption", "Searching…"));
  const query = $("query").value.trim();
  try {
    let result = null;
    try {
      const response = await fetch("/api/search?q=" + encodeURIComponent(query), {signal: request.signal});
      if (response.ok) {
        result = await response.json();
      }
    } catch (e) {}
    
    if (!result && snapshot && snapshot.records) {
      // Client-side search fallback
      const qLower = query.toLowerCase();
      const matches = snapshot.records.filter(r => {
        const text = `${r.title || ""} ${r.detail || ""} ${r.event || ""} ${r.status || ""} ${r.vendor || ""}`.toLowerCase();
        return text.includes(qLower);
      });
      result = { results: matches, capturedAt: snapshot.capturedAt || new Date().toISOString() };
    }
    
    if (result) {
      $("results").replaceChildren(
        make("p", "section-caption", `Found ${result.results.length} result(s) in snapshot · ${captured(result.capturedAt)}`),
        grid(result.results)
      );
    } else {
      throw Error("Search unavailable");
    }
  } catch (err) {
    if (err.name !== "AbortError") $("results").replaceChildren(make("p", "empty", err.message));
  }
});

async function start() {
  try {
    await checkAuthStatus();
    let stateLoaded = false;
    
    // If decrypted snapshot already loaded by checkAuthStatus via vault
    if (snapshot && snapshot.records && snapshot.records.length > 0) {
      stateLoaded = true;
    }
    
    if (!stateLoaded) {
      try {
        const response = await fetch("/api/state");
        if (response.ok) {
          snapshot = await response.json();
          stateLoaded = true;
        }
      } catch (e) {}
    }
    
    if (!stateLoaded) {
      const vault = await loadStaticVault();
      if (vault && !isAuthenticated) {
        // Automatically prompt for passcode on static admin page
        setTimeout(() => openAuthModal(), 150);
      }
      snapshot = {
        revision: "guest-preview",
        mode: "guest",
        authenticated: false,
        records: []
      };
    }
    
    updateBanner();
    render();
    window.addEventListener("hashchange", render);
    $("btn-header-contacts")?.addEventListener("click", openContactsModal);
    $("btn-footer-lock")?.addEventListener("click", openAuthModal);
  } catch (err) {
    $("banner").textContent = err.message + ". Check the local server and reload.";
  }
}
start();
