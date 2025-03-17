export class ChartComponent {
    constructor(id, options = {}) {
        this.id = id;
        this.chart = null;
        this.options = options;
        this.ctx = document.getElementById(id)?.getContext('2d');
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
        }
    }

    getThemeColors() {
        const isDarkMode = document.body.classList.contains('dark-mode');
        return {
            textColor: isDarkMode ? '#ffffff' : '#333333',
            gridColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            backgroundColor: isDarkMode ? '#1e1e2d' : '#ffffff',
            tooltipBackground: isDarkMode ? '#2d2d3d' : '#ffffff',
            borderColor: isDarkMode ? '#3d3d4d' : '#e0e0e0'
        };
    }

    getDefaultColors() {
        return [
            '#4361ee', '#2d31fa', '#5390d9', '#48bfe3', '#56cfe1',
            '#64dfdf', '#72efdd', '#80ffdb', '#06d6a0', '#0cb0a9'
        ];
    }

    createDoughnutChart(data, customOptions = {}) {
        const colors = this.getThemeColors();
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.textColor,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBackground,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.borderColor,
                    borderWidth: 1
                }
            }
        };

        this.destroy();
        this.chart = new Chart(this.ctx, {
            type: 'doughnut',
            data: data,
            options: { ...defaultOptions, ...customOptions }
        });
    }

    createLineChart(data, customOptions = {}) {
        const colors = this.getThemeColors();
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.textColor,
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    backgroundColor: colors.tooltipBackground,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.borderColor,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        color: colors.textColor,
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        color: colors.gridColor
                    }
                }
            }
        };

        this.destroy();
        this.chart = new Chart(this.ctx, {
            type: 'line',
            data: data,
            options: { ...defaultOptions, ...customOptions }
        });
    }

    createBarChart(data, customOptions = {}) {
        const colors = this.getThemeColors();
        const defaultOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: colors.tooltipBackground,
                    titleColor: colors.textColor,
                    bodyColor: colors.textColor,
                    borderColor: colors.borderColor,
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                },
                x: {
                    ticks: {
                        color: colors.textColor
                    },
                    grid: {
                        color: colors.gridColor
                    }
                }
            }
        };

        this.destroy();
        this.chart = new Chart(this.ctx, {
            type: 'bar',
            data: data,
            options: { ...defaultOptions, ...customOptions }
        });
    }
}
