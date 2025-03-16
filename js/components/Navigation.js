// Navigation component
export class Navigation {
    constructor() {
        this.sideNav = document.querySelector('.side-nav');
        this.menuToggle = document.getElementById('menuToggle');
        this.menuIcon = this.menuToggle?.querySelector('i');
        this.currentPath = window.location.pathname;
    }

    initialize() {
        this.setupMenuToggle();
        this.setupClickOutside();
        this.highlightCurrentPage();
        this.setupLogout();
    }

    setupMenuToggle() {
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
        }
    }

    setupClickOutside() {
        document.addEventListener('click', (event) => {
            if (document.body.classList.contains('nav-open') &&
                this.sideNav && !this.sideNav.contains(event.target) &&
                this.menuToggle && !this.menuToggle.contains(event.target)) {
                this.toggleMenu();
            }
        });
    }

    toggleMenu() {
        document.body.classList.toggle('nav-open');
        if (this.menuIcon) {
            this.menuIcon.className = document.body.classList.contains('nav-open') 
                ? 'fas fa-times' 
                : 'fas fa-bars';
        }
    }

    highlightCurrentPage() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                // Remove leading dots for relative paths
                const href = link.getAttribute('href').replace(/^\./, '');
                const isActive = this.currentPath.endsWith(href);
                item.classList.toggle('active', isActive);
            }
        });
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.auth) {
                    window.auth.logout();
                }
            });
        }
    }
}
