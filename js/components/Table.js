export class Table {
    constructor(id, options = {}) {
        this.id = id;
        this.tbody = document.getElementById(id);
        this.options = {
            noDataMessage: 'No data available',
            rowClassName: (item) => '',
            formatters: {},
            actions: [],
            ...options
        };
    }

    render(data) {
        if (!this.tbody) return;

        if (!data?.length) {
            this.tbody.innerHTML = `<tr><td colspan="100%" class="no-data">${this.options.noDataMessage}</td></tr>`;
            return;
        }

        this.tbody.innerHTML = data.map(item => {
            const cells = Object.entries(item)
                .filter(([key]) => !key.startsWith('_'))
                .map(([key, value]) => {
                    const formatter = this.options.formatters[key];
                    return formatter ? formatter(value) : value;
                });

            const actionButtons = this.options.actions.map(action => `
                <button class="action-button" onclick="${action.handler}('${item.id}')">
                    <i class="fas fa-${action.icon}"></i>
                </button>
            `).join('');

            const rowClass = this.options.rowClassName(item);
            
            return `
                <tr class="${rowClass}">
                    ${cells.map(cell => `<td>${cell}</td>`).join('')}
                    ${actionButtons ? `<td>${actionButtons}</td>` : ''}
                </tr>
            `;
        }).join('');
    }
}
