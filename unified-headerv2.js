// header.js
class UnifiedHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.config = {};
  }

  static get observedAttributes() {
    return ['config'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'config') {
      try {
        this.config = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error('Invalid JSON configuration for <unified-header>', e);
      }
    }
  }

  connectedCallback() {
    if (this.hasAttribute('config')) {
      try {
        this.config = JSON.parse(this.getAttribute('config'));
      } catch (e) {
        console.error('Invalid JSON configuration for <unified-header>', e);
      }
    }
    this.render();
  }

  render() {
    if (!this.config) return;

    // Clear shadow DOM
    this.shadowRoot.innerHTML = '';

    // Basic Styles
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        background: #fff;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        height: 60px;
      }
      .left, .center, .right {
        display: flex;
        align-items: center;
      }
      .logo {
        height: 40px;
        margin-right: 10px;
        cursor: pointer;
      }
      .brand {
        font-size: 18px;
        font-weight: bold;
      }
      .dropdown, .profile-menu, .app-switcher {
        margin-left: 20px;
        cursor: pointer;
      }
      .dropdown-content, .profile-content, .apps-content {
        display: none;
        position: absolute;
        background: #fff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        z-index: 1000;
        min-width: 150px;
      }
      .dropdown-content div, .profile-content div, .apps-content div {
        padding: 8px 12px;
        cursor: pointer;
      }
      .dropdown-content div:hover, .profile-content div:hover, .apps-content div:hover {
        background: #f0f0f0;
      }
      .help-icon {
        margin-left: 10px;
        cursor: pointer;
      }
      .relative {
        position: relative;
      }
    `;

    const container = document.createElement('div');
    container.classList.add('header');

    // Left Section: Logo + Brand
    const left = document.createElement('div');
    left.classList.add('left');
    if (this.config.logoUrl) {
      const logo = document.createElement('img');
      logo.src = this.config.logoUrl;
      logo.className = 'logo';
      if (this.config.logoLink) {
        logo.addEventListener('click', () => window.location.href = this.config.logoLink);
      }
      left.appendChild(logo);
    }
    if (this.config.brandText) {
      const brand = document.createElement('div');
      brand.className = 'brand';
      brand.textContent = this.config.brandText;
      left.appendChild(brand);
    }

    // Center Section: Account Switcher + Help Icon
    const center = document.createElement('div');
    center.classList.add('center');
    
    if (this.config.accounts && this.config.accounts.length > 0) {
      const accountWrapper = document.createElement('div');
      accountWrapper.className = 'dropdown relative';
      accountWrapper.textContent = this.config.currentAccount || this.config.accounts[0].name;
      
      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown-content';
      this.config.accounts.forEach(account => {
        const item = document.createElement('div');
        item.textContent = account.name;
        item.addEventListener('click', () => {
          accountWrapper.textContent = account.name;
          this.dispatchEvent(new CustomEvent('accountChange', {
            detail: account,
            bubbles: true,
            composed: true
          }));
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(item);
      });
      accountWrapper.appendChild(dropdown);
      accountWrapper.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      });
      center.appendChild(accountWrapper);
    }

    if (this.config.helpLink) {
      const help = document.createElement('div');
      help.className = 'help-icon';
      help.textContent = '❓';
      help.addEventListener('click', () => window.location.href = this.config.helpLink);
      center.appendChild(help);
    }

    // Right Section: Profile Menu + App Switcher
    const right = document.createElement('div');
    right.classList.add('right');

    if (this.config.profileOptions && this.config.profileOptions.length > 0) {
      const profileWrapper = document.createElement('div');
      profileWrapper.className = 'profile-menu relative';
      profileWrapper.textContent = '👤';
      const profileContent = document.createElement('div');
      profileContent.className = 'profile-content';
      this.config.profileOptions.forEach(option => {
        const item = document.createElement('div');
        item.textContent = option.label;
        item.addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('profileAction', {
            detail: option.action,
            bubbles: true,
            composed: true
          }));
          profileContent.style.display = 'none';
        });
        profileContent.appendChild(item);
      });
      profileWrapper.appendChild(profileContent);
      profileWrapper.addEventListener('click', () => {
        profileContent.style.display = profileContent.style.display === 'block' ? 'none' : 'block';
      });
      right.appendChild(profileWrapper);
    }

    if (this.config.apps && this.config.apps.length > 0) {
      const appsWrapper = document.createElement('div');
      appsWrapper.className = 'app-switcher relative';
      appsWrapper.textContent = '☰';
      const appsContent = document.createElement('div');
      appsContent.className = 'apps-content';
      this.config.apps.forEach(app => {
        const item = document.createElement('div');
        item.textContent = app.name;
        item.addEventListener('click', () => {
          window.location.href = app.link;
          appsContent.style.display = 'none';
        });
        appsContent.appendChild(item);
      });
      appsWrapper.appendChild(appsContent);
      appsWrapper.addEventListener('click', () => {
        appsContent.style.display = appsContent.style.display === 'block' ? 'none' : 'block';
      });
      right.appendChild(appsWrapper);
    }

    container.appendChild(left);
    container.appendChild(center);
    container.appendChild(right);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
  }
}

// Register as a native HTML element
customElements.define('unified-header', UnifiedHeader);
