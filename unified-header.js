/**
 * <unified-header> — Shared Micro-Frontend Header
 * Framework-agnostic Custom Element built with Vanilla JS + Shadow DOM.
 *
 * Usage (any app — Salesforce Community, React, legacy):
 *   <script src="https://your-cdn.com/unified-header.js"></script>
 *   <unified-header
 *     logo-src="https://your-cdn.com/logo.svg"
 *     brand-name="ONNECT"
 *     api-base="https://api.yourcompany.com"
 *     current-app="home-reno">
 *   </unified-header>
 *
 * Attributes:
 *   logo-src     URL of the brand logo image
 *   brand-name   Fallback text if logo fails
 *   api-base     Base URL for the user/app-list API (credentials: include)
 *   current-app  Key of the currently active app (for highlighting)
 *   help-url     URL opened when the help (?) icon is clicked
 *
 * Events dispatched (bubble + composed so parent apps can listen):
 *   unified-header:org-change   detail: { orgId }
 *   unified-header:app-switch   detail: { appKey, url }
 *   unified-header:sign-out
 */
(function () {
  if (customElements.get('unified-header')) return;

  const TEMPLATE = document.createElement('template');
  TEMPLATE.innerHTML = `
    <style>
      :host {
        --uh-bg: #ffffff;
        --uh-border: #e5e7eb;
        --uh-text: #181818;
        --uh-muted: #6b7280;
        --uh-hover: #f3f4f6;
        --uh-accent: #1ac6d9;
        --uh-avatar-bg: #e91e8c;
        --uh-avatar-fg: #ffffff;
        --uh-height: 56px;
        --uh-radius: 8px;
        --uh-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                   "Helvetica Neue", Arial, sans-serif;

        display: block;
        font-family: var(--uh-font);
        color: var(--uh-text);
        background: var(--uh-bg);
        border-bottom: 1px solid var(--uh-border);
        position: sticky;
        top: 0;
        z-index: 1000;
      }

      .bar {
        height: var(--uh-height);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 20px;
        gap: 16px;
      }

      /* ---------- Left: brand ---------- */
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .brand img {
        height: 32px;
        width: auto;
        display: block;
      }
      .brand .name {
        font-weight: 600;
        font-size: 18px;
        letter-spacing: 0.2px;
        white-space: nowrap;
      }

      /* ---------- Right: actions ---------- */
      .actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      button.icon-btn,
      button.org-btn {
        font-family: inherit;
        color: inherit;
        background: transparent;
        border: 1px solid transparent;
        cursor: pointer;
        border-radius: var(--uh-radius);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 120ms ease, border-color 120ms ease;
      }
      button.icon-btn:hover,
      button.org-btn:hover {
        background: var(--uh-hover);
      }
      button:focus-visible {
        outline: 2px solid var(--uh-accent);
        outline-offset: 2px;
      }

      .org-btn {
        height: 36px;
        padding: 0 12px;
        border-color: var(--uh-border);
        font-size: 14px;
        gap: 6px;
      }
      .org-btn .caret { opacity: 0.6; }

      .icon-btn {
        width: 36px;
        height: 36px;
      }
      .icon-btn svg {
        width: 20px;
        height: 20px;
        stroke: currentColor;
        fill: none;
        stroke-width: 1.8;
      }

      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--uh-avatar-bg);
        color: var(--uh-avatar-fg);
        font-weight: 600;
        font-size: 13px;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      /* ---------- Popovers ---------- */
      .popover {
        position: absolute;
        top: calc(var(--uh-height) - 4px);
        right: 20px;
        background: #fff;
        border: 1px solid var(--uh-border);
        border-radius: 12px;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        padding: 12px;
        min-width: 260px;
        display: none;
      }
      .popover[open] { display: block; }

      /* App launcher grid */
      .launcher {
        width: 320px;
      }
      .launcher h3 {
        margin: 4px 8px 10px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: var(--uh-muted);
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 4px;
      }
      .app-tile {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 14px 8px;
        border-radius: 10px;
        text-decoration: none;
        color: var(--uh-text);
        background: transparent;
        border: none;
        cursor: pointer;
        font: inherit;
        text-align: center;
      }
      .app-tile:hover { background: var(--uh-hover); }
      .app-tile[aria-current="true"] {
        background: color-mix(in srgb, var(--uh-accent) 12%, transparent);
      }
      .app-tile .app-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: var(--uh-accent);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
      }
      .app-tile .app-name {
        font-size: 12px;
        line-height: 1.3;
        color: var(--uh-text);
      }

      /* User menu */
      .user-menu { min-width: 240px; }
      .user-menu .user-head {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 8px 12px;
        border-bottom: 1px solid var(--uh-border);
        margin-bottom: 6px;
      }
      .user-menu .user-head .avatar { width: 40px; height: 40px; }
      .user-menu .meta { display: flex; flex-direction: column; min-width: 0; }
      .user-menu .meta .name { font-weight: 600; font-size: 14px; }
      .user-menu .meta .email {
        font-size: 12px; color: var(--uh-muted);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .user-menu button.item {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        padding: 10px 10px;
        border-radius: 8px;
        font: inherit;
        color: inherit;
        cursor: pointer;
      }
      .user-menu button.item:hover { background: var(--uh-hover); }

      .loading, .empty {
        padding: 16px; text-align: center;
        color: var(--uh-muted); font-size: 13px;
      }

      @media (max-width: 560px) {
        .bar { padding: 0 12px; }
        .org-btn .label { display: none; }
      }
    </style>

    <div class="bar" part="bar">
      <div class="brand" part="brand">
        <img id="logo" alt="" hidden />
        <span class="name" id="brand-name"></span>
      </div>

      <div class="actions">
        <button class="org-btn" id="org-btn" aria-haspopup="listbox" aria-expanded="false">
          <span class="label" id="org-label">Loading…</span>
          <span class="caret" aria-hidden="true">▾</span>
        </button>

        <button class="icon-btn" id="help-btn" aria-label="Help">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9"/>
            <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-1 .5-1 1.2-1 2.2"/>
            <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none"/>
          </svg>
        </button>

        <button class="icon-btn" id="launcher-btn" aria-label="App launcher" aria-haspopup="true" aria-expanded="false">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none">
            <circle cx="5"  cy="5"  r="1.6"/>
            <circle cx="12" cy="5"  r="1.6"/>
            <circle cx="19" cy="5"  r="1.6"/>
            <circle cx="5"  cy="12" r="1.6"/>
            <circle cx="12" cy="12" r="1.6"/>
            <circle cx="19" cy="12" r="1.6"/>
            <circle cx="5"  cy="19" r="1.6"/>
            <circle cx="12" cy="19" r="1.6"/>
            <circle cx="19" cy="19" r="1.6"/>
          </svg>
        </button>

        <button class="avatar" id="avatar-btn" aria-label="Account menu" aria-haspopup="true" aria-expanded="false">
          <span id="avatar-initials">–</span>
        </button>
      </div>
    </div>

    <div class="popover launcher" id="launcher-popover" role="dialog" aria-label="App launcher">
      <h3>All Apps</h3>
      <div class="grid" id="app-grid">
        <div class="loading">Loading apps…</div>
      </div>
    </div>

    <div class="popover user-menu" id="user-popover" role="dialog" aria-label="Account menu">
      <div class="user-head">
        <div class="avatar" aria-hidden="true"><span id="menu-initials">–</span></div>
        <div class="meta">
          <span class="name" id="menu-name">Signed in</span>
          <span class="email" id="menu-email"></span>
        </div>
      </div>
      <button class="item" id="profile-item">Profile & settings</button>
      <button class="item" id="signout-item">Sign out</button>
    </div>
  `;

  class UnifiedHeader extends HTMLElement {
    static get observedAttributes() {
      return ['logo-src', 'brand-name', 'api-base', 'current-app', 'help-url'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' }).appendChild(
        TEMPLATE.content.cloneNode(true)
      );

      this._state = {
        user: null,
        orgs: [],
        currentOrg: null,
        apps: []
      };

      this._onDocClick = this._onDocClick.bind(this);
      this._onKeyDown = this._onKeyDown.bind(this);
    }

    connectedCallback() {
      this._cacheRefs();
      this._wireEvents();
      this._applyAttributes();
      this._loadSession();
      document.addEventListener('click', this._onDocClick);
      document.addEventListener('keydown', this._onKeyDown);
    }

    disconnectedCallback() {
      document.removeEventListener('click', this._onDocClick);
      document.removeEventListener('keydown', this._onKeyDown);
    }

    attributeChangedCallback() {
      if (this.shadowRoot && this._refs) this._applyAttributes();
    }

    // ---------- setup ----------
    _cacheRefs() {
      const $ = (id) => this.shadowRoot.getElementById(id);
      this._refs = {
        logo: $('logo'),
        brandName: $('brand-name'),
        orgBtn: $('org-btn'),
        orgLabel: $('org-label'),
        helpBtn: $('help-btn'),
        launcherBtn: $('launcher-btn'),
        launcherPop: $('launcher-popover'),
        appGrid: $('app-grid'),
        avatarBtn: $('avatar-btn'),
        avatarInitials: $('avatar-initials'),
        userPop: $('user-popover'),
        menuInitials: $('menu-initials'),
        menuName: $('menu-name'),
        menuEmail: $('menu-email'),
        profileItem: $('profile-item'),
        signoutItem: $('signout-item')
      };
    }

    _wireEvents() {
      const r = this._refs;
      r.launcherBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePopover(r.launcherPop, r.launcherBtn);
        this._closePopover(r.userPop, r.avatarBtn);
      });
      r.avatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._togglePopover(r.userPop, r.avatarBtn);
        this._closePopover(r.launcherPop, r.launcherBtn);
      });
      r.helpBtn.addEventListener('click', () => {
        const url = this.getAttribute('help-url');
        if (url) window.open(url, '_blank', 'noopener');
      });
      r.orgBtn.addEventListener('click', () => {
        // Simple cycle-through demo; real impl could open a listbox popover.
        if (this._state.orgs.length < 2) return;
        const i = this._state.orgs.findIndex(o => o.id === this._state.currentOrg?.id);
        const next = this._state.orgs[(i + 1) % this._state.orgs.length];
        this._state.currentOrg = next;
        r.orgLabel.textContent = next.name;
        this.dispatchEvent(new CustomEvent('unified-header:org-change', {
          detail: { orgId: next.id }, bubbles: true, composed: true
        }));
      });
      r.signoutItem.addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('unified-header:sign-out', {
          bubbles: true, composed: true
        }));
      });
      r.profileItem.addEventListener('click', () => {
        this._closePopover(r.userPop, r.avatarBtn);
      });
    }

    _applyAttributes() {
      const r = this._refs;
      const logo = this.getAttribute('logo-src');
      const brand = this.getAttribute('brand-name') || '';
      if (logo) {
        r.logo.src = logo;
        r.logo.alt = brand || 'Logo';
        r.logo.hidden = false;
      } else {
        r.logo.hidden = true;
      }
      r.brandName.textContent = brand;
    }

    // ---------- data ----------
    async _loadSession() {
      const base = this.getAttribute('api-base');
      // If no api-base provided, fall back to a demo payload so the component
      // still renders nicely (useful in Storybook / local dev).
      if (!base) {
        this._hydrate(this._demoPayload());
        return;
      }
      try {
        const [userRes, appsRes] = await Promise.all([
          fetch(`${base}/me`,   { credentials: 'include' }),
          fetch(`${base}/apps`, { credentials: 'include' })
        ]);
        if (!userRes.ok || !appsRes.ok) throw new Error('SSO fetch failed');
        const user = await userRes.json();
        const apps = await appsRes.json();
        this._hydrate({ user, apps: apps.items || apps, orgs: user.orgs || [] });
      } catch (err) {
        console.warn('[unified-header] falling back to demo payload:', err);
        this._hydrate(this._demoPayload());
      }
    }

    _demoPayload() {
      return {
        user: {
          name: 'Sarah Green',
          email: 'sarah.green@example.com',
          initials: 'SG',
          orgs: [
            { id: 'hri', name: 'Home Reno Inc.' },
            { id: 'acm', name: 'Acme Corp' }
          ]
        },
        orgs: [
          { id: 'hri', name: 'Home Reno Inc.' },
          { id: 'acm', name: 'Acme Corp' }
        ],
        apps: [
          { key: 'connect',   name: 'Connect',    icon: 'C', url: '#' },
          { key: 'home-reno', name: 'Home Reno',  icon: 'H', url: '#' },
          { key: 'partners',  name: 'Partners',   icon: 'P', url: '#' },
          { key: 'finance',   name: 'Finance',    icon: 'F', url: '#' },
          { key: 'support',   name: 'Support',    icon: 'S', url: '#' },
          { key: 'admin',     name: 'Admin',      icon: 'A', url: '#' }
        ]
      };
    }

    _hydrate({ user, orgs, apps }) {
      const r = this._refs;
      this._state.user = user;
      this._state.orgs = orgs || [];
      this._state.currentOrg = this._state.orgs[0] || null;
      this._state.apps = apps || [];

      // User
      const initials = user?.initials ||
        (user?.name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
      r.avatarInitials.textContent = initials;
      r.menuInitials.textContent = initials;
      r.menuName.textContent = user?.name || 'Signed in';
      r.menuEmail.textContent = user?.email || '';

      // Org
      r.orgLabel.textContent = this._state.currentOrg?.name || 'Select org';

      // Apps
      this._renderApps();
    }

    _renderApps() {
      const current = this.getAttribute('current-app');
      const grid = this._refs.appGrid;
      if (!this._state.apps.length) {
        grid.innerHTML = `<div class="empty">No apps available</div>`;
        return;
      }
      grid.innerHTML = '';
      for (const app of this._state.apps) {
        const tile = document.createElement('button');
        tile.className = 'app-tile';
        tile.type = 'button';
        if (app.key === current) tile.setAttribute('aria-current', 'true');
        tile.innerHTML = `
          <span class="app-icon">${this._escape(app.icon || app.name[0])}</span>
          <span class="app-name">${this._escape(app.name)}</span>
        `;
        tile.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('unified-header:app-switch', {
            detail: { appKey: app.key, url: app.url },
            bubbles: true, composed: true
          }));
          if (app.url && app.url !== '#') window.location.href = app.url;
        });
        grid.appendChild(tile);
      }
    }

    // ---------- popover helpers ----------
    _togglePopover(pop, btn) {
      const open = pop.hasAttribute('open');
      if (open) this._closePopover(pop, btn);
      else this._openPopover(pop, btn);
    }
    _openPopover(pop, btn) {
      pop.setAttribute('open', '');
      btn.setAttribute('aria-expanded', 'true');
    }
    _closePopover(pop, btn) {
      pop.removeAttribute('open');
      btn.setAttribute('aria-expanded', 'false');
    }
    _onDocClick(e) {
      // Close popovers on outside click. Because of Shadow DOM, clicks inside
      // the component have the host as their composedPath root.
      if (e.composedPath().includes(this)) return;
      const r = this._refs;
      this._closePopover(r.launcherPop, r.launcherBtn);
      this._closePopover(r.userPop, r.avatarBtn);
    }
    _onKeyDown(e) {
      if (e.key !== 'Escape') return;
      const r = this._refs;
      this._closePopover(r.launcherPop, r.launcherBtn);
      this._closePopover(r.userPop, r.avatarBtn);
    }

    _escape(s) {
      return String(s).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));
    }
  }

  customElements.define('unified-header', UnifiedHeader);
})();