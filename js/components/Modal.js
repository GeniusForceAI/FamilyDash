export class Modal {
    constructor(id, options = {}) {
        this.id = id;
        this.modal = document.getElementById(id);
        this.closeBtn = this.modal.querySelector('.close-button');
        this.cancelBtn = this.modal.querySelector('.btn.secondary');
        this.saveBtn = this.modal.querySelector('.btn.primary');
        this.form = this.modal.querySelector('form');
        this.onSave = options.onSave || (() => {});
        this.onClose = options.onClose || (() => {});
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.close());
        this.cancelBtn.addEventListener('click', () => this.close());
        this.saveBtn.addEventListener('click', () => this.handleSave());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
    }

    show() {
        this.modal.style.display = 'block';
    }

    close() {
        this.modal.style.display = 'none';
        this.form.reset();
        this.onClose();
    }

    async handleSave() {
        const formData = new FormData(this.form);
        await this.onSave(formData);
    }
}
