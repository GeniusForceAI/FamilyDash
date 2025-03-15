// Theme management module
export const theme = {
    // Initialize theme from localStorage or default to dark
    initialize() {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        this.applyTheme(savedTheme);
    },

    // Apply theme to document and update icons
    applyTheme(themeName) {
        // Update body classes
        document.body.classList.remove('dark-mode', 'light-mode');
        document.body.classList.add(`${themeName}-mode`);
        
        // Update all theme toggle icons
        const themeIcons = document.querySelectorAll('#themeToggle i');
        themeIcons.forEach(icon => {
            icon.className = `fas fa-${themeName === 'dark' ? 'sun' : 'moon'}`;
        });
    },

    // Toggle between light and dark themes
    toggle() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        const newTheme = isDarkMode ? 'light' : 'dark';
        
        this.applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    },

    // Add theme toggle functionality to a button
    setupToggleButton(buttonId = 'themeToggle') {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => this.toggle());
        }
    }
};
