// Investor Network functionality
class InvestorNetwork {
    constructor() {
        this.token = localStorage.getItem('token');
        this.baseUrl = `${window.config.apiUrl}/api/investors`;
        this.mockData = this.generateMockData();
        this.setupEventListeners();
        this.loadData();
    }

    generateMockData() {
        // Keep mock data for contacts and events until we implement those features
        const contacts = [
            { id: 'person1', name: 'John Smith', email: 'john@acme.com', position: 'CEO', company: 'comp1', linkedin: 'https://linkedin.com/in/johnsmith' },
            { id: 'person2', name: 'Emily Davis', email: 'emily@techventures.com', position: 'Partner', company: 'comp2', linkedin: 'https://linkedin.com/in/emilydavis' },
            { id: 'person3', name: 'Michael Johnson', email: 'michael@nextgenai.com', position: 'CTO', company: 'comp3', linkedin: 'https://linkedin.com/in/michaeljohnson' },
            { id: 'person4', name: 'Sarah Williams', email: 'sarah@quantumsys.io', position: 'Research Director', company: 'comp4', linkedin: 'https://linkedin.com/in/sarahwilliams' },
            { id: 'person5', name: 'Alex Chen', email: 'alex@acme.com', position: 'CFO', company: 'comp1', linkedin: 'https://linkedin.com/in/alexchen' }
        ];
        
        const events = [
            { id: 'event1', name: 'Annual Tech Conference', date: '2025-05-15', time: '09:00', location: 'San Francisco', type: 'Conference', description: 'Annual technology conference' },
            { id: 'event2', name: 'Investment Pitch Day', date: '2025-04-10', time: '14:00', location: 'New York', type: 'Pitch', description: 'Startup pitch event' },
            { id: 'event3', name: 'Biotech Workshop', date: '2025-06-20', time: '10:00', location: 'Boston', type: 'Workshop', description: 'Workshop on biotech innovations' }
        ];
        
        const fundedCompanies = [
            { id: 'funded1', name: 'AI Robotics Inc', investment_amount: 5000000, investment_date: '2024-12-15', status: 'Active' },
            { id: 'funded2', name: 'CloudSolutions', investment_amount: 3500000, investment_date: '2024-10-20', status: 'Active' },
            { id: 'funded3', name: 'Mobile Health', investment_amount: 2000000, investment_date: '2024-08-05', status: 'Active' }
        ];
        
        return { contacts, events, fundedCompanies };
    }

    async setupEventListeners() {
        // Setup mode toggle
        const viewMode = document.getElementById('viewMode');
        const manageMode = document.getElementById('manageMode');
        const networkView = document.getElementById('networkView');
        const managementView = document.getElementById('managementView');
        
        if (viewMode && manageMode) {
            viewMode.addEventListener('click', () => {
                viewMode.classList.add('active');
                manageMode.classList.remove('active');
                if (networkView) {
                    networkView.classList.add('active');
                    networkView.style.display = 'block';
                }
                if (managementView) {
                    managementView.classList.remove('active');
                    managementView.style.display = 'none';
                }
                this.initializeNetwork();
            });
            
            manageMode.addEventListener('click', () => {
                manageMode.classList.add('active');
                viewMode.classList.remove('active');
                if (networkView) {
                    networkView.classList.remove('active');
                    networkView.style.display = 'none';
                }
                if (managementView) {
                    managementView.classList.add('active');
                    managementView.style.display = 'block';
                }
            });
        }

        const leadTypeSelect = document.getElementById('leadTypeSelect');
        const actionSelect = document.getElementById('actionSelect');
        
        if (leadTypeSelect) {
            leadTypeSelect.addEventListener('change', () => this.updateActionForm());
        }
        if (actionSelect) {
            actionSelect.addEventListener('change', () => this.updateActionForm());
        }

        // Setup refresh button
        const refreshBtn = document.getElementById('refreshLeads');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadData());
        }

        // Initialize network view
        this.initializeNetwork();
    }

    async loadData() {
        try {
            // Fetch companies from API
            const companies = await this.fetchCompanies();
            
            // Use mock data for other entities until we implement them
            const contacts = this.mockData.contacts;
            const events = this.mockData.events;
            const fundedCompanies = this.mockData.fundedCompanies;

            // Update dashboard stats
            document.getElementById('totalContacts').textContent = contacts.length;
            document.getElementById('totalCompanies').textContent = companies.length;
            
            const upcomingEvents = events.filter(event => {
                return new Date(event.date) >= new Date();
            });
            document.getElementById('upcomingEvents').textContent = upcomingEvents.length;
            document.getElementById('fundedCompanies').textContent = fundedCompanies.length;
            
            // Populate leads lists
            this.populateLeadsList('peopleList', contacts);
            this.populateLeadsList('companiesList', companies);
            this.populateLeadsList('eventsList', events);

            // Store companies for network visualization
            this.companies = companies;

        } catch (error) {
            console.error('Error loading data:', error);
            // Show error message to user
            alert('Error loading data. Please try again.');
        }
    }

    async fetchCompanies() {
        const response = await fetch(`${this.baseUrl}/companies`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch companies');
        return await response.json();
    }

    async fetchContacts() {
        const response = await fetch(`${this.baseUrl}/contacts`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch contacts');
        return await response.json();
    }

    async fetchEvents() {
        const response = await fetch(`${this.baseUrl}/events`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch events');
        return await response.json();
    }

    async fetchFundedCompanies() {
        const response = await fetch(`${this.baseUrl}/funded-companies`, {
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to fetch funded companies');
        return await response.json();
    }

    async createCompany(companyData) {
        const response = await fetch(`${this.baseUrl}/companies`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        if (!response.ok) throw new Error('Failed to create company');
        return await response.json();
    }

    async updateCompany(id, companyData) {
        const response = await fetch(`${this.baseUrl}/companies/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(companyData)
        });
        if (!response.ok) throw new Error('Failed to update company');
        return await response.json();
    }

    async deleteCompany(id) {
        const response = await fetch(`${this.baseUrl}/companies/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.token}`
            }
        });
        if (!response.ok) throw new Error('Failed to delete company');
        return true;
    }
    
    populateLeadsList(listId, items) {
        const list = document.getElementById(listId);
        if (!list) return;
        
        list.innerHTML = '';
        
        if (items.length === 0) {
            list.innerHTML = '<div class="empty-state">No items found</div>';
            return;
        }
        
        items.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'lead-item';
            
            const icon = document.createElement('div');
            icon.className = 'lead-icon';
            
            if (listId === 'peopleList') {
                icon.innerHTML = '<i class="fas fa-user"></i>';
            } else if (listId === 'companiesList') {
                icon.innerHTML = '<i class="fas fa-building"></i>';
            } else {
                icon.innerHTML = '<i class="fas fa-calendar"></i>';
            }
            
            const content = document.createElement('div');
            content.className = 'lead-content';
            
            const title = document.createElement('h4');
            title.textContent = listId === 'companiesList' ? item.company_name : item.name;
            
            const details = document.createElement('p');
            if (listId === 'peopleList') {
                details.textContent = item.position || 'Contact';
            } else if (listId === 'companiesList') {
                details.textContent = item.industry || 'Company';
            } else {
                details.textContent = new Date(item.date).toLocaleDateString() || 'Event';
            }
            
            content.appendChild(title);
            content.appendChild(details);
            
            listItem.appendChild(icon);
            listItem.appendChild(content);
            
            // Add view button
            const viewBtn = document.createElement('button');
            viewBtn.className = 'btn btn-sm btn-outline';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i>';
            viewBtn.addEventListener('click', () => this.viewLeadDetails(item));
            listItem.appendChild(viewBtn);
            
            list.appendChild(listItem);
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const leadType = document.getElementById('leadTypeSelect').value;
        const action = document.getElementById('actionSelect').value;
        
        // Get form data
        const formData = new FormData(event.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            let result;
            
            if (leadType === 'company') {
                if (action === 'create') {
                    result = await this.createCompany(data);
                } else if (action === 'update' && data.id) {
                    result = await this.updateCompany(data.id, data);
                }
            }
            // Add similar blocks for other lead types
            
            // Refresh the data
            await this.loadData();
            
            // Clear the form
            event.target.reset();
            
            // Show success message
            alert('Operation completed successfully');
            
        } catch (error) {
            console.error('Error:', error);
            alert('Error performing operation. Please try again.');
        }
    }

    getFieldsForLeadType(leadType) {
        switch (leadType) {
            case 'company':
                return [
                    { name: 'company_name', label: 'Company Name', type: 'text', required: true },
                    { name: 'industry', label: 'Industry', type: 'text', required: true },
                    { name: 'physical_address', label: 'Physical Address', type: 'text', required: true },
                    { name: 'website', label: 'Website', type: 'url', required: true },
                    { name: 'linkedin_page', label: 'LinkedIn Page', type: 'url', required: true }
                ];
            // Add cases for other lead types
            default:
                return [];
        }
    }

    async updateActionForm() {
        const leadType = document.getElementById('leadTypeSelect').value;
        const action = document.getElementById('actionSelect').value;
        const formContainer = document.getElementById('formContainer');

        // Clear existing form
        formContainer.innerHTML = '';

        if (!leadType || !action) return;

        const form = document.createElement('form');
        form.id = 'leadForm';
        form.classList.add('card', 'form-card');

        // Add form header
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = `<h3>${action.charAt(0).toUpperCase() + action.slice(1)} ${leadType.charAt(0).toUpperCase() + leadType.slice(1)}</h3>`;
        form.appendChild(header);

        const body = document.createElement('div');
        body.className = 'card-body';

        // Get fields for the lead type
        const fields = this.getFieldsForLeadType(leadType);
        
        fields.forEach(field => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.htmlFor = field.name;
            label.textContent = field.label;
            
            const input = document.createElement('input');
            input.type = field.type;
            input.id = field.name;
            input.name = field.name;
            input.className = 'form-control';
            input.required = field.required;
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            body.appendChild(formGroup);
        });

        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = action.charAt(0).toUpperCase() + action.slice(1);
        body.appendChild(submitBtn);

        form.appendChild(body);
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        formContainer.appendChild(form);
    }

    // Network visualization
    initializeNetwork() {
        const container = document.getElementById('networkContainer');
        if (!container) return;
        
        // Clear previous network
        container.innerHTML = '';
        
        const width = container.clientWidth || window.innerWidth * 0.8;
        const height = 600; // Fixed height for consistency
        
        // Create SVG with zoom support
        const svg = d3.select('#networkContainer')
            .append('svg')
            .attr('width', width)
            .attr('height', height);
            
        // Add zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });
            
        svg.call(zoom);
        
        // Create a group for all visualization elements that will be zoomed together
        const g = svg.append('g');
        
        // Prepare data for network visualization
        const networkData = this.prepareNetworkData();
        
        // Create force simulation with configurable parameters
        const simulation = d3.forceSimulation(networkData.nodes)
            .force('link', d3.forceLink(networkData.links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2));
        
        // Create links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(networkData.links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.6)
            .attr('stroke-width', 1);
        
        // Create nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(networkData.nodes)
            .enter()
            .append('g')
            .call(this.drag(simulation));
        
        // Add circles to nodes
        node.append('circle')
            .attr('r', 10)
            .attr('fill', d => this.getNodeColor(d.type));
        
        // Add labels to nodes
        node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => d.name || d.company_name)
            .style('font-size', '10px')
            .style('fill', '#fff');
        
        // Add hover title
        node.append('title')
            .text(d => d.name || d.company_name);
        
        // Add click handler for node details
        node.on('click', (event, d) => this.showNodeDetails(d));
        
        // Update positions on simulation tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node
                .attr('transform', d => `translate(${d.x},${d.y})`);
        });
        
        // Set up network controls
        this.setupNetworkControls(simulation, svg, zoom, width, height);
        
        // Store simulation reference for later use
        this.simulation = simulation;
    }
    
    setupNetworkControls(simulation, svg, zoom, width, height) {
        // Set up force strength slider
        const strengthControl = document.getElementById('forceStrength');
        const strengthValue = document.getElementById('strengthValue');
        if (strengthControl) {
            strengthControl.addEventListener('input', (e) => {
                const strength = parseInt(e.target.value);
                if (strengthValue) strengthValue.textContent = strength;
                simulation.force('charge').strength(-strength);
                simulation.alpha(1).restart();
            });
        }
        
        // Set up node distance slider
        const distanceControl = document.getElementById('linkDistance');
        const distanceValue = document.getElementById('distanceValue');
        if (distanceControl) {
            distanceControl.addEventListener('input', (e) => {
                const distance = parseInt(e.target.value);
                if (distanceValue) distanceValue.textContent = distance;
                simulation.force('link').distance(distance);
                simulation.alpha(1).restart();
            });
        }
        
        // Set up center button
        const centerButton = document.getElementById('centerNetwork');
        if (centerButton) {
            centerButton.addEventListener('click', () => {
                svg.transition().duration(750).call(
                    zoom.transform,
                    d3.zoomIdentity,
                    d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
                );
                
                // Restart simulation
                simulation.alpha(1).restart();
            });
        }
        
        // Set up search functionality
        const searchInput = document.getElementById('networkSearch');
        const searchResults = document.getElementById('networkSearchResults');
        if (searchInput && searchResults) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                if (query.length < 2) {
                    searchResults.innerHTML = '';
                    return;
                }
                
                // Find matching nodes
                const matches = simulation.nodes().filter(node => 
                    (node.name || node.company_name || '').toLowerCase().includes(query)
                );
                
                // Display matches
                searchResults.innerHTML = '';
                matches.slice(0, 5).forEach(match => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.textContent = match.name || match.company_name;
                    item.addEventListener('click', () => {
                        // Focus on this node
                        this.focusOnNode(match, svg, zoom, width, height);
                        // Clear search
                        searchInput.value = '';
                        searchResults.innerHTML = '';
                    });
                    searchResults.appendChild(item);
                });
            });
        }
    }
    
    prepareNetworkData() {
        const nodes = [
            ...this.mockData.contacts.map(c => ({ 
                ...c, 
                id: `person-${c.id}`, 
                type: 'person',
                company: c.company
            })),
            ...(this.companies || []).map(c => ({ 
                ...c, 
                id: `company-${c.id}`, 
                type: 'company',
                name: c.company_name
            })),
            ...this.mockData.events.map(e => ({ 
                ...e, 
                id: `event-${e.id}`, 
                type: 'event'
            }))
        ];
        
        const links = [];
        
        // Link contacts to companies
        this.mockData.contacts.forEach(contact => {
            if (contact.company) {
                links.push({
                    source: `person-${contact.id}`,
                    target: `company-${contact.company}`,
                    type: 'works_at'
                });
            }
        });
        
        return { nodes, links };
    }
    
    getNodeColor(type) {
        const colors = {
            person: '#4CAF50',
            company: '#2196F3',
            event: '#FFC107'
        };
        return colors[type] || '#9C27B0';
    }
    
    showNodeDetails(d) {
        const details = document.getElementById('nodeDetails');
        const content = document.getElementById('nodeContent');
        
        if (!details || !content) return;
        
        content.innerHTML = `
            <h4>${d.name || d.company_name}</h4>
            <p><strong>Type:</strong> ${d.type}</p>
            ${d.type === 'person' ? `
                <p><strong>Position:</strong> ${d.position || 'N/A'}</p>
                <p><strong>Email:</strong> ${d.email || 'N/A'}</p>
                <p><strong>Company:</strong> ${
                    d.company ? 
                    (this.companies?.find(c => c.id === d.company)?.company_name || d.company)
                    : 'N/A'
                }</p>
            ` : d.type === 'company' ? `
                <p><strong>Industry:</strong> ${d.industry || 'N/A'}</p>
                <p><strong>Website:</strong> ${d.website ? `<a href="${d.website}" target="_blank">${d.website}</a>` : 'N/A'}</p>
                <p><strong>LinkedIn:</strong> ${d.linkedin_page ? `<a href="${d.linkedin_page}" target="_blank">View Profile</a>` : 'N/A'}</p>
            ` : `
                <p><strong>Date:</strong> ${d.date ? new Date(d.date).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Location:</strong> ${d.location || 'N/A'}</p>
                <p><strong>Type:</strong> ${d.type || 'N/A'}</p>
            `}
        `;
        
        details.classList.add('active');
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'btn btn-sm btn-outline';
        closeBtn.innerHTML = '<i class="fas fa-times"></i> Close';
        closeBtn.style.marginTop = '10px';
        closeBtn.addEventListener('click', () => {
            details.classList.remove('active');
        });
        
        content.appendChild(closeBtn);
    }
    
    focusOnNode(node, svg, zoom, width, height) {
        // Calculate zoom transform to center on the node
        const scale = 2;
        const x = width / 2 - node.x * scale;
        const y = height / 2 - node.y * scale;
        
        // Transition to the node
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity.translate(x, y).scale(scale)
        );
        
        // Show node details
        this.showNodeDetails(node);
    }
    
    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InvestorNetwork();
});
