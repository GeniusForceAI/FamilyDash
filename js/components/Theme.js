// Theme component
export class Theme {
    constructor() {
        this.themeToggle = document.getElementById('themeToggle');
        this.themeIcon = this.themeToggle?.querySelector('i');
        this.currentTheme = localStorage.getItem('theme') || 'dark';
    }

    initialize() {
        this.applyTheme(this.currentTheme);
        this.setupToggleButton();
    }

    applyTheme(themeName) {
        // Update body classes
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(`${themeName}-mode`);
        
        // Update theme toggle icon
        if (this.themeIcon) {
            this.themeIcon.className = `fas fa-${themeName === 'dark' ? 'sun' : 'moon'}`;
        }
        
        // Store theme preference
        localStorage.setItem('theme', themeName);
        this.currentTheme = themeName;
    }

    setupToggleButton() {
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
    }
}
