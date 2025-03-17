import { DashboardFeature } from './features/dashboard.js';
import { Navigation } from './components/Navigation.js';

export class DashboardManager extends DashboardFeature {
    constructor() {
        super();
        this.navigation = new Navigation();
        this.handleThemeChange = this.handleThemeChange.bind(this);
    }

    async initialize() {
        // Initialize navigation
        this.navigation.initialize();

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.body.classList.toggle('dark-mode', savedTheme === 'dark');
        document.body.classList.toggle('light-mode', savedTheme === 'light');

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.checked = savedTheme === 'dark';
            themeToggle.addEventListener('change', () => {
                const newTheme = themeToggle.checked ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);
                document.body.classList.toggle('dark-mode', newTheme === 'dark');
                document.body.classList.toggle('light-mode', newTheme === 'light');
                document.dispatchEvent(new Event('themeChanged'));
            });
        }

        await this.loadData();
        document.addEventListener('themeChanged', this.handleThemeChange);
    }

    handleThemeChange() {
        this.renderDashboard();
    }
}
