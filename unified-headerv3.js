class UnifiedHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.config = {};
    }

    static get observedAttributes() {
        return ["config"];
    }

    attributeChangedCallback(name, oldVal, newVal) {
        if (name === "config") {
            try {
                this.config = JSON.parse(newVal);
                this.render();
            } catch (e) {
                console.error("Invalid config JSON", e);
            }
        }
    }

    connectedCallback() {
        if (this.hasAttribute("config")) {
            this.config = JSON.parse(this.getAttribute("config"));
        }
        this.render();
    }

    dispatchEventWithDetail(name, detail) {
        this.dispatchEvent(
            new CustomEvent(name, {
                detail,
                bubbles: true,
                composed: true
            })
        );
    }

    render() {
        const c = this.config;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: Arial, sans-serif;
                }
                .header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: #f4f6f9;
                    padding: 8px 16px;
                    border-bottom: 1px solid #ddd;
                }
                .left, .right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .logo {
                    cursor: pointer;
                    font-weight: bold;
                }
                select, button {
                    cursor: pointer;
                }
                .menu {
                    position: relative;
                }
                .dropdown {
                    display: none;
                    position: absolute;
                    right: 0;
                    background: white;
                    border: 1px solid #ccc;
                    padding: 8px;
                    min-width: 120px;
                    z-index: 10;
                }
                .menu:hover .dropdown {
                    display: block;
                }
                .dropdown div {
                    padding: 6px;
                    cursor: pointer;
                }
                .dropdown div:hover {
                    background: #eee;
                }
            </style>

            <div class="header">
                <div class="left">
                    <div class="logo">${c.logo?.text || "LOGO"}</div>

                    <select id="accountSwitcher">
                        ${(c.accounts || []).map(acc =>
                            `<option value="${acc.id}">${acc.name}</option>`
                        ).join("")}
                    </select>

                    <button id="appSwitcher">☰</button>
                </div>

                <div class="right">
                    <button id="helpBtn">?</button>

                    <div class="menu">
                        <button>${c.profile?.name || "User"}</button>
                        <div class="dropdown">
                            ${(c.profile?.actions || []).map(a =>
                                `<div data-action="${a.id}">${a.label}</div>`
                            ).join("")}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.addEventHandlers();
    }

    addEventHandlers() {
        const c = this.config;

        // Logo click
        this.shadowRoot.querySelector(".logo").onclick = () => {
            if (c.logo?.url) window.location.href = c.logo.url;
        };

        // Help click
        this.shadowRoot.querySelector("#helpBtn").onclick = () => {
            if (c.help?.url) window.location.href = c.help.url;
        };

        // Account change
        this.shadowRoot.querySelector("#accountSwitcher").onchange = (e) => {
            const selected = this.config.accounts.find(a => a.id === e.target.value);
            this.dispatchEventWithDetail("account-change", selected);
        };

        // Profile action
        this.shadowRoot.querySelectorAll(".dropdown div").forEach(el => {
            el.onclick = () => {
                this.dispatchEventWithDetail("profile-action", {
                    action: el.dataset.action
                });
            };
        });

        // App switcher
        this.shadowRoot.querySelector("#appSwitcher").onclick = () => {
            this.dispatchEventWithDetail("app-switch", this.config.apps || []);
        };
    }
}

customElements.define("unified-header", UnifiedHeader);
