/**
 * unified-header.js
 * Framework-agnostic Web Component — CDN-hosted universal header.
 *
 * Usage:
 *   <script src="https://cdn.example.com/unified-header.js"></script>
 *   <unified-header config='{"appName":"Connect Business", ...}'></unified-header>
 *
 * Custom Events (bubble + composed, so they cross Shadow DOM boundaries):
 *   • account-change   → detail: { account }
 *   • profile-action   → detail: { action }
 *   • app-switch       → detail: { app }
 *
 * @version 1.0.0
 */

(function () {
  "use strict";

  /* ─────────────────────────────────────────────
   * Default configuration schema
   * ───────────────────────────────────────────── */
  const DEFAULT_CONFIG = {
    appName: "Connect",
    logoText: "CONNECT",
    logoHighlight: "BUSINESS",
    logoUrl: "/",
    helpUrl: "/help",
    accounts: [],
    selectedAccount: null,
    profileInitials: "U",
    profileColor: "#0070d2",
    profileOptions: [
      { id: "profile", label: "My Profile", icon: "👤" },
      { id: "settings", label: "Settings", icon: "⚙️" },
      { id: "preferences", label: "Preferences", icon: "🎛️" },
      { id: "logout", label: "Log Out", icon: "🚪" },
    ],
    appSwitcher: [],
  };

  /* ─────────────────────────────────────────────
   * Styles (Shadow DOM — fully isolated)
   * ───────────────────────────────────────────── */
  const STYLES = `
    :host {
      display: block;
      width: 100%;
      font-family: 'Salesforce Sans', -apple-system, BlinkMacSystemFont,
                   'Segoe UI', Roboto, sans-serif;
      --uh-height: 52px;
      --uh-bg: #ffffff;
      --uh-border: #e0e5ee;
      --uh-text: #16325c;
      --uh-muted: #706e6b;
      --uh-accent: #0070d2;
      --uh-hover-bg: #f3f3f3;
      --uh-dropdown-shadow: 0 4px 16px rgba(0,0,0,0.14);
      --uh-radius: 6px;
      --uh-icon-size: 32px;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Header bar ── */
    .uh-bar {
      display: flex;
      align-items: center;
      height: var(--uh-height);
      background: var(--uh-bg);
      border-bottom: 1px solid var(--uh-border);
      padding: 0 16px;
      gap: 8px;
      position: relative;
      z-index: 1000;
      user-select: none;
    }

    /* ── Logo ── */
    .uh-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      text-decoration: none;
      flex-shrink: 0;
      padding: 4px 6px;
      border-radius: var(--uh-radius);
      transition: background 0.15s;
    }
    .uh-logo:hover { background: var(--uh-hover-bg); }

    .uh-logo-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .uh-logo-icon svg { width: 28px; height: 28px; }

    .uh-divider-v {
      width: 1px;
      height: 22px;
      background: var(--uh-border);
      flex-shrink: 0;
    }

    .uh-logo-text {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--uh-text);
    }
    .uh-logo-text span {
      color: var(--uh-accent);
    }

    /* ── Spacer ── */
    .uh-spacer { flex: 1; }

    /* ── Account Switcher ── */
    .uh-account-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border: 1px solid var(--uh-border);
      border-radius: 20px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--uh-text);
      transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
      white-space: nowrap;
      max-width: 220px;
    }
    .uh-account-btn:hover {
      border-color: var(--uh-accent);
      box-shadow: 0 0 0 1px var(--uh-accent);
      background: #f0f7ff;
    }
    .uh-account-btn.open {
      border-color: var(--uh-accent);
      box-shadow: 0 0 0 1px var(--uh-accent);
    }
    .uh-account-label {
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 160px;
    }
    .uh-account-caret {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      transition: transform 0.2s;
      color: var(--uh-muted);
    }
    .uh-account-btn.open .uh-account-caret { transform: rotate(180deg); }

    /* ── Icon Button (Help, App-Switcher) ── */
    .uh-icon-btn {
      width: var(--uh-icon-size);
      height: var(--uh-icon-size);
      border-radius: 50%;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--uh-muted);
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
      position: relative;
    }
    .uh-icon-btn:hover {
      background: var(--uh-hover-bg);
      color: var(--uh-text);
    }
    .uh-icon-btn.open {
      background: var(--uh-hover-bg);
      color: var(--uh-accent);
    }
    .uh-icon-btn svg { width: 18px; height: 18px; }

    /* ── Avatar ── */
    .uh-avatar-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: var(--uh-profile-color, #0070d2);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      flex-shrink: 0;
      transition: opacity 0.15s, box-shadow 0.15s;
      position: relative;
    }
    .uh-avatar-btn:hover { opacity: 0.85; }
    .uh-avatar-btn.open { box-shadow: 0 0 0 2px var(--uh-accent); }

    /* ── Dropdown base ── */
    .uh-dropdown {
      position: absolute;
      top: calc(var(--uh-height) + 4px);
      background: #fff;
      border: 1px solid var(--uh-border);
      border-radius: var(--uh-radius);
      box-shadow: var(--uh-dropdown-shadow);
      z-index: 9999;
      overflow: hidden;
      min-width: 200px;
      animation: uh-fade-in 0.12s ease;
    }
    @keyframes uh-fade-in {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* Account dropdown */
    .uh-account-dropdown {
      right: auto;
      max-height: 300px;
      overflow-y: auto;
      min-width: 230px;
    }
    .uh-dropdown-header {
      padding: 10px 14px 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--uh-muted);
      border-bottom: 1px solid var(--uh-border);
    }
    .uh-dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      cursor: pointer;
      font-size: 13px;
      color: var(--uh-text);
      transition: background 0.1s;
      border: none;
      background: transparent;
      width: 100%;
      text-align: left;
    }
    .uh-dropdown-item:hover { background: #f3f8ff; }
    .uh-dropdown-item.active {
      background: #e8f4ff;
      color: var(--uh-accent);
      font-weight: 600;
    }
    .uh-dropdown-item .uh-item-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .uh-account-check {
      margin-left: auto;
      color: var(--uh-accent);
      flex-shrink: 0;
    }
    .uh-dropdown-divider {
      height: 1px;
      background: var(--uh-border);
      margin: 4px 0;
    }

    /* Profile dropdown */
    .uh-profile-dropdown { right: 0; min-width: 200px; }
    .uh-profile-header {
      padding: 14px;
      border-bottom: 1px solid var(--uh-border);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .uh-profile-avatar-lg {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: var(--uh-profile-color, #0070d2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
      font-weight: 700;
      flex-shrink: 0;
    }
    .uh-profile-name {
      font-size: 13px;
      font-weight: 600;
      color: var(--uh-text);
      line-height: 1.3;
    }
    .uh-profile-role {
      font-size: 11px;
      color: var(--uh-muted);
      margin-top: 1px;
    }

    /* App Switcher dropdown */
    .uh-apps-dropdown {
      right: 36px;
      min-width: 280px;
      padding: 12px;
    }
    .uh-apps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 4px;
    }
    .uh-app-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 10px 6px;
      border-radius: var(--uh-radius);
      cursor: pointer;
      transition: background 0.15s;
      border: none;
      background: transparent;
      text-decoration: none;
    }
    .uh-app-tile:hover { background: #f3f8ff; }
    .uh-app-tile.current { background: #e8f4ff; }
    .uh-app-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      background: var(--app-color, #f0f4f9);
    }
    .uh-app-name {
      font-size: 11px;
      color: var(--uh-text);
      text-align: center;
      font-weight: 500;
      line-height: 1.3;
    }

    /* Scrollbar styling */
    .uh-account-dropdown::-webkit-scrollbar { width: 4px; }
    .uh-account-dropdown::-webkit-scrollbar-track { background: transparent; }
    .uh-account-dropdown::-webkit-scrollbar-thumb {
      background: #c9d3de;
      border-radius: 4px;
    }
  `;

  /* ─────────────────────────────────────────────
   * SVG icon helpers
   * ───────────────────────────────────────────── */
  const Icons = {
    logo: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z"
        fill="#0070d2" stroke="none"/>
    </svg>`,

    caret: `<svg viewBox="0 0 16 16" fill="currentColor">
      <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>`,

    help: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17" r=".5" fill="currentColor"/>
    </svg>`,

    grid: `<svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="3" y="3" width="4" height="4" rx="1"/>
      <rect x="10" y="3" width="4" height="4" rx="1"/>
      <rect x="17" y="3" width="4" height="4" rx="1"/>
      <rect x="3" y="10" width="4" height="4" rx="1"/>
      <rect x="10" y="10" width="4" height="4" rx="1"/>
      <rect x="17" y="10" width="4" height="4" rx="1"/>
      <rect x="3" y="17" width="4" height="4" rx="1"/>
      <rect x="10" y="17" width="4" height="4" rx="1"/>
      <rect x="17" y="17" width="4" height="4" rx="1"/>
    </svg>`,

    check: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                 width="14" height="14">
      <path d="M3 8l3.5 3.5L13 5"/>
    </svg>`,
  };

  /* ─────────────────────────────────────────────
   * UnifiedHeader Web Component
   * ───────────────────────────────────────────── */
  class UnifiedHeader extends HTMLElement {
    constructor() {
      super();
      this._shadow = this.attachShadow({ mode: "open" });
      this._cfg = { ...DEFAULT_CONFIG };
      this._activeDropdown = null;
      this._boundOutsideClick = this._onOutsideClick.bind(this);
    }

    /* ── Observed attributes ── */
    static get observedAttributes() {
      return ["config"];
    }

    attributeChangedCallback(name, _old, newVal) {
      if (name === "config" && newVal) {
        this._applyConfig(newVal);
      }
    }

    connectedCallback() {
      const raw = this.getAttribute("config");
      if (raw) this._applyConfig(raw);
      else this._render();
      document.addEventListener("click", this._boundOutsideClick, true);
    }

    disconnectedCallback() {
      document.removeEventListener("click", this._boundOutsideClick, true);
    }

    /* ── Public API: update config programmatically ── */
    setConfig(cfg) {
      this._cfg = { ...DEFAULT_CONFIG, ...cfg };
      this._render();
    }

    /* ── Private helpers ── */
    _applyConfig(raw) {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        this._cfg = { ...DEFAULT_CONFIG, ...parsed };
      } catch (e) {
        console.error("[unified-header] Invalid JSON config:", e);
      }
      this._render();
    }

    _render() {
      const c = this._cfg;
      const selAccount =
        c.selectedAccount ||
        (c.accounts && c.accounts[0]) ||
        null;

      this._shadow.innerHTML = `
        <style>${STYLES}</style>
        <style>
          .uh-avatar-btn, .uh-profile-avatar-lg {
            --uh-profile-color: ${c.profileColor || "#0070d2"};
          }
        </style>

        <header class="uh-bar" role="banner">

          <!-- Logo -->
          <a class="uh-logo" href="${c.logoUrl || "/"}"
             data-action="logo" aria-label="${c.appName || "Home"}">
            <span >
            <img 
      src="${this._escHtml(c.logoUrl || '/assets/logo.png')}" 
      alt="${this._escHtml(c.appName || 'Logo')}" 
      style="height: 24px; width: auto;"
    />
            </span>
            <span class="uh-divider-v" aria-hidden="true"></span>
            <span class="uh-logo-text">
              ${this._escHtml(c.logoText || "CONNECT")}
              ${c.logoHighlight ? `<span>${this._escHtml(c.logoHighlight)}</span>` : ""}
            </span>
          </a>

          <div class="uh-spacer"></div>

          <!-- Account Switcher -->
          ${
            c.accounts && c.accounts.length > 0
              ? `<div class="uh-account-wrapper" style="position:relative">
              <button class="uh-account-btn" data-action="toggle-account"
                      aria-haspopup="listbox" aria-expanded="false"
                      aria-label="Switch account">
                <span class="uh-account-label">
                  ${this._escHtml(selAccount ? selAccount.name : "Select Account")}
                </span>
                <span class="uh-account-caret">${Icons.caret}</span>
              </button>
            </div>`
              : ""
          }

          <!-- Help -->
          <button class="uh-icon-btn" data-action="help"
                  aria-label="Help" title="Help">
            ${Icons.help}
          </button>

          <!-- App Switcher -->
          ${
            c.appSwitcher && c.appSwitcher.length > 0
              ? `<div class="uh-apps-wrapper" style="position:relative">
              <button class="uh-icon-btn" data-action="toggle-apps"
                      aria-haspopup="menu" aria-expanded="false"
                      aria-label="App Switcher" title="App Switcher">
                ${Icons.grid}
              </button>
            </div>`
              : `<button class="uh-icon-btn" data-action="toggle-apps"
                      aria-label="App Switcher" title="App Switcher" disabled style="opacity:.4">
                ${Icons.grid}
            </button>`
          }

          <!-- Profile Avatar -->
          <div class="uh-profile-wrapper" style="position:relative">
            <button class="uh-avatar-btn" data-action="toggle-profile"
                    aria-haspopup="menu" aria-expanded="false"
                    aria-label="Profile menu"
                    style="background:${c.profileColor || "#0070d2"}">
              ${this._escHtml(c.profileInitials || "U")}
            </button>
          </div>

        </header>
      `;

      this._attachEvents();
    }

    /* ── Render dropdowns on demand (lazy) ── */
    _renderAccountDropdown() {
      const c = this._cfg;
      const sel = c.selectedAccount || (c.accounts && c.accounts[0]) || null;
      const wrapper = this._shadow.querySelector(".uh-account-wrapper");
      if (!wrapper) return;

      this._removeDropdown("account");
      const div = document.createElement("div");
      div.className = "uh-dropdown uh-account-dropdown";
      div.setAttribute("data-dropdown", "account");
      div.setAttribute("role", "listbox");

      if (c.accounts.length > 5) {
        div.innerHTML += `<div class="uh-dropdown-header">Accounts</div>`;
      }

      c.accounts.forEach((acc) => {
        const isActive =
          sel && (sel.id === acc.id || sel.name === acc.name);
        const btn = document.createElement("button");
        btn.className = `uh-dropdown-item${isActive ? " active" : ""}`;
        btn.setAttribute("role", "option");
        btn.setAttribute("aria-selected", isActive ? "true" : "false");
        btn.dataset.accountId = acc.id || acc.name;
        btn.innerHTML = `
          <span class="uh-item-icon">${acc.icon || "🏢"}</span>
          <span>${this._escHtml(acc.name)}</span>
          ${isActive ? `<span class="uh-account-check">${Icons.check}</span>` : ""}
        `;
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          this._selectAccount(acc);
        });
        div.appendChild(btn);
      });

      wrapper.appendChild(div);
    }

    _renderProfileDropdown() {
      const c = this._cfg;
      const wrapper = this._shadow.querySelector(".uh-profile-wrapper");
      if (!wrapper) return;

      this._removeDropdown("profile");
      const div = document.createElement("div");
      div.className = "uh-dropdown uh-profile-dropdown";
      div.setAttribute("data-dropdown", "profile");
      div.setAttribute("role", "menu");

      // Header section
      div.innerHTML = `
        <div class="uh-profile-header">
          <div class="uh-profile-avatar-lg"
               style="background:${c.profileColor || "#0070d2"}">
            ${this._escHtml(c.profileInitials || "U")}
          </div>
          <div>
            <div class="uh-profile-name">${this._escHtml(c.profileName || "")}</div>
            <div class="uh-profile-role">${this._escHtml(c.profileRole || "")}</div>
          </div>
        </div>
      `;

      if (c.profileOptions && c.profileOptions.length) {
        const menuSection = document.createElement("div");
        c.profileOptions.forEach((opt, i) => {
          if (opt.divider) {
            const hr = document.createElement("div");
            hr.className = "uh-dropdown-divider";
            menuSection.appendChild(hr);
            return;
          }
          const btn = document.createElement("button");
          btn.className = "uh-dropdown-item";
          btn.setAttribute("role", "menuitem");
          btn.dataset.profileAction = opt.id;
          btn.innerHTML = `
            <span class="uh-item-icon">${opt.icon || ""}</span>
            <span>${this._escHtml(opt.label)}</span>
          `;
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            this._profileAction(opt);
          });
          menuSection.appendChild(btn);
        });
        div.appendChild(menuSection);
      }

      wrapper.appendChild(div);
    }

    _renderAppsDropdown() {
      const c = this._cfg;
      const wrapper = this._shadow.querySelector(".uh-apps-wrapper");
      if (!wrapper) return;

      this._removeDropdown("apps");
      const div = document.createElement("div");
      div.className = "uh-dropdown uh-apps-dropdown";
      div.setAttribute("data-dropdown", "apps");
      div.setAttribute("role", "menu");

      const grid = document.createElement("div");
      grid.className = "uh-apps-grid";

      c.appSwitcher.forEach((app) => {
        const tile = document.createElement("a");
        tile.className = `uh-app-tile${app.current ? " current" : ""}`;
        tile.href = app.url || "#";
        tile.setAttribute("role", "menuitem");
        tile.setAttribute("aria-label", app.name);
        tile.dataset.appId = app.id || app.name;
        tile.innerHTML = `
          <span class="uh-app-icon" style="--app-color:${app.color || "#f0f4f9"}">
            ${app.icon || "📦"}
          </span>
          <span class="uh-app-name">${this._escHtml(app.name)}</span>
        `;
        tile.addEventListener("click", (e) => {
          if (app.url && app.url !== "#") {
            // allow natural navigation — just close dropdown
            this._closeAll();
          } else {
            e.preventDefault();
          }
          this._dispatch("app-switch", { app });
        });
        grid.appendChild(tile);
      });

      div.appendChild(grid);
      wrapper.appendChild(div);
    }

    /* ── Event binding ── */
    _attachEvents() {
      const root = this._shadow;

      // Logo click
      root.querySelector("[data-action='logo']")?.addEventListener(
        "click",
        (e) => {
          e.preventDefault();
          const url = this._cfg.logoUrl || "/";
          this._dispatch("logo-click", { url });
          if (url && url !== "#") window.location.href = url;
        }
      );

      // Help click
      root.querySelector("[data-action='help']")?.addEventListener(
        "click",
        () => {
          const url = this._cfg.helpUrl || "/help";
          this._dispatch("help-click", { url });
          if (url && url !== "#") window.open(url, "_blank", "noopener");
        }
      );

      // Account switcher toggle
      root
        .querySelector("[data-action='toggle-account']")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          this._toggleDropdown("account");
        });

      // App switcher toggle
      root
        .querySelector("[data-action='toggle-apps']")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          this._toggleDropdown("apps");
        });

      // Profile toggle
      root
        .querySelector("[data-action='toggle-profile']")
        ?.addEventListener("click", (e) => {
          e.stopPropagation();
          this._toggleDropdown("profile");
        });
    }

    _toggleDropdown(name) {
      const isOpen = this._activeDropdown === name;
      this._closeAll();
      if (!isOpen) this._openDropdown(name);
    }

    _openDropdown(name) {
      this._activeDropdown = name;

      if (name === "account") {
        this._renderAccountDropdown();
        this._shadow
          .querySelector("[data-action='toggle-account']")
          ?.classList.add("open");
        this._shadow
          .querySelector("[data-action='toggle-account']")
          ?.setAttribute("aria-expanded", "true");
      } else if (name === "profile") {
        this._renderProfileDropdown();
        this._shadow
          .querySelector("[data-action='toggle-profile']")
          ?.classList.add("open");
        this._shadow
          .querySelector("[data-action='toggle-profile']")
          ?.setAttribute("aria-expanded", "true");
      } else if (name === "apps") {
        this._renderAppsDropdown();
        this._shadow
          .querySelector("[data-action='toggle-apps']")
          ?.classList.add("open");
        this._shadow
          .querySelector("[data-action='toggle-apps']")
          ?.setAttribute("aria-expanded", "true");
      }
    }

    _closeAll() {
      this._activeDropdown = null;
      this._removeDropdown("account");
      this._removeDropdown("profile");
      this._removeDropdown("apps");

      this._shadow.querySelectorAll("[aria-expanded]").forEach((el) => {
        el.setAttribute("aria-expanded", "false");
        el.classList.remove("open");
      });
    }

    _removeDropdown(name) {
      this._shadow
        .querySelector(`[data-dropdown="${name}"]`)
        ?.remove();
    }

    _onOutsideClick(e) {
      if (this._activeDropdown && !this._shadow.contains(e.target)) {
        this._closeAll();
      }
    }

    /* ── Actions ── */
    _selectAccount(account) {
      this._cfg.selectedAccount = account;
      this._closeAll();
      this._render();
      this._dispatch("account-change", { account });
    }

    _profileAction(action) {
      this._closeAll();
      this._dispatch("profile-action", { action });
    }

    /* ── Custom Event dispatcher ── */
    _dispatch(eventName, detail) {
      this.dispatchEvent(
        new CustomEvent(eventName, {
          detail,
          bubbles: true,
          composed: true, // crosses Shadow DOM boundary
        })
      );
    }

    /* ── XSS guard ── */
    _escHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }
  }

  /* ── Register custom element ── */
  if (!customElements.get("unified-header")) {
    customElements.define("unified-header", UnifiedHeader);
  }
})();
