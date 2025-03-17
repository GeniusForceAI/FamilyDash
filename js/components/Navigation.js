// Navigation component
export class Navigation {
    constructor() {
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.nav = document.querySelector('nav');
        this.menuToggle = document.querySelector('.nav-toggle');
        this.menuIcon = this.menuToggle?.querySelector('i');
        this.navMenu = document.querySelector('.nav-menu');
        this.currentPath = window.location.pathname;
        this.isMenuOpen = false;
    }

    setupEventListeners() {
        // Menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleMenu());
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => this.handleClickOutside(e));

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        // Setup navigation items
        this.setupNavigationItems();

        // Setup logout
        this.setupLogout();
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        document.body.classList.toggle('nav-open', this.isMenuOpen);
        
        // Update menu icon
        if (this.menuIcon) {
            this.menuIcon.className = this.isMenuOpen ? 'fas fa-times' : 'fas fa-bars';
        }

        // Update ARIA attributes
        if (this.menuToggle) {
            this.menuToggle.setAttribute('aria-expanded', this.isMenuOpen.toString());
        }
        if (this.navMenu) {
            this.navMenu.setAttribute('aria-hidden', (!this.isMenuOpen).toString());
        }

        // Prevent body scroll when menu is open on mobile
        if (window.innerWidth <= 767) {
            document.body.style.overflow = this.isMenuOpen ? 'hidden' : '';
        }
    }

    handleClickOutside(event) {
        if (this.isMenuOpen && 
            this.nav && !this.nav.contains(event.target) &&
            this.menuToggle && !this.menuToggle.contains(event.target)) {
            this.toggleMenu();
        }
    }

    handleResize() {
        // Reset menu state on larger screens
        if (window.innerWidth > 767 && this.isMenuOpen) {
            this.isMenuOpen = false;
            document.body.classList.remove('nav-open');
            document.body.style.overflow = '';
            if (this.menuIcon) {
                this.menuIcon.className = 'fas fa-bars';
            }
        }
    }

    setupNavigationItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const link = item.querySelector('a');
            if (link) {
                // Remove leading dots for relative paths
                const href = link.getAttribute('href').replace(/^\./, '');
                const isActive = this.currentPath.endsWith(href);
                
                // Update active state
                item.classList.toggle('active', isActive);
                
                // Add click handler for mobile
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 767 && this.isMenuOpen) {
                        // Close menu after navigation on mobile
                        setTimeout(() => this.toggleMenu(), 150);
                    }
                });
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
