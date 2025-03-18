// Investor Network functionality
class InvestorNetwork {
    constructor() {
        this.token = localStorage.getItem('token');
        this.baseUrl = '/api/investors';
        this.mockData = this.generateMockData();
        this.setupEventListeners();
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

        // Setup form submissions
        const leadForm = document.getElementById('leadForm');
        if (leadForm) {
            leadForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Initialize network view with mock data
        this.initializeNetwork();
        
        // Load mock data for leads
        this.loadMockData();
        
        // Setup refresh button
        const refreshBtn = document.getElementById('refreshLeads');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadMockData());
        }
    }

    generateMockData() {
        // Create mock data that matches our backend models
        const companies = [
            { id: 'comp1', name: 'Acme Corp', industry: 'Technology', website: 'https://acme.com', description: 'Leading tech company' },
            { id: 'comp2', name: 'TechVentures', industry: 'VC', website: 'https://techventures.com', description: 'Venture capital firm' },
            { id: 'comp3', name: 'NextGen AI', industry: 'Artificial Intelligence', website: 'https://nextgenai.com', description: 'AI solutions provider' },
            { id: 'comp4', name: 'Quantum Systems', industry: 'Quantum Computing', website: 'https://quantumsys.io', description: 'Quantum computing research' },
            { id: 'comp5', name: 'BioTech Solutions', industry: 'Biotechnology', website: 'https://biotechsol.com', description: 'Innovative biotech company' }
        ];
        
        const contacts = [
            { id: 'person1', name: 'John Smith', email: 'john@acme.com', position: 'CEO', company: 'comp1', linkedin: 'https://linkedin.com/in/johnsmith' },
            { id: 'person2', name: 'Emily Davis', email: 'emily@techventures.com', position: 'Partner', company: 'comp2', linkedin: 'https://linkedin.com/in/emilydavis' },
            { id: 'person3', name: 'Michael Johnson', email: 'michael@nextgenai.com', position: 'CTO', company: 'comp3', linkedin: 'https://linkedin.com/in/michaeljohnson' },
            { id: 'person4', name: 'Sarah Williams', email: 'sarah@quantumsys.io', position: 'Research Director', company: 'comp4', linkedin: 'https://linkedin.com/in/sarahwilliams' },
            { id: 'person5', name: 'Alex Chen', email: 'alex@acme.com', position: 'CFO', company: 'comp1', linkedin: 'https://linkedin.com/in/alexchen' },
            { id: 'person6', name: 'Lisa Brown', email: 'lisa@biotechsol.com', position: 'CEO', company: 'comp5', linkedin: 'https://linkedin.com/in/lisabrown' }
        ];
        
        const events = [
            { id: 'event1', name: 'Annual Tech Conference', date: '2025-05-15', time: '09:00', location: 'San Francisco', type: 'Conference', description: 'Annual technology conference', related_companies: ['comp1', 'comp3'] },
            { id: 'event2', name: 'Investment Pitch Day', date: '2025-04-10', time: '14:00', location: 'New York', type: 'Pitch', description: 'Startup pitch event', related_companies: ['comp2'] },
            { id: 'event3', name: 'Biotech Workshop', date: '2025-06-20', time: '10:00', location: 'Boston', type: 'Workshop', description: 'Workshop on biotech innovations', related_companies: ['comp5'] },
            { id: 'event4', name: 'Quantum Computing Summit', date: '2025-07-05', time: '09:30', location: 'Virtual', type: 'Conference', description: 'Latest in quantum computing', related_companies: ['comp4'] }
        ];
        
        const fundedCompanies = [
            { id: 'funded1', name: 'AI Robotics Inc', investment_amount: 5000000, investment_date: '2024-12-15', status: 'Active' },
            { id: 'funded2', name: 'CloudSolutions', investment_amount: 3500000, investment_date: '2024-10-20', status: 'Active' },
            { id: 'funded3', name: 'Mobile Health', investment_amount: 2000000, investment_date: '2024-08-05', status: 'Active' }
        ];
        
        return { companies, contacts, events, fundedCompanies };
    }
    
    async loadMockData() {
        // Update dashboard stats with mock data
        document.getElementById('totalContacts').textContent = this.mockData.contacts.length;
        document.getElementById('totalCompanies').textContent = this.mockData.companies.length;
        
        const upcomingEvents = this.mockData.events.filter(event => {
            return new Date(event.date) >= new Date();
        });
        document.getElementById('upcomingEvents').textContent = upcomingEvents.length;
        document.getElementById('fundedCompanies').textContent = this.mockData.fundedCompanies.length;
        
        // Populate leads lists
        this.populateLeadsList('peopleList', this.mockData.contacts);
        this.populateLeadsList('companiesList', this.mockData.companies);
        this.populateLeadsList('eventsList', this.mockData.events);
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
            title.textContent = item.name;
            
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

        // Common fields based on lead type
        const fields = this.getFieldsForLeadType(leadType);
        
        fields.forEach(field => {
            const formGroup = this.createFormGroup(field);
            form.appendChild(formGroup);
        });

        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'btn btn-primary';
        submitBtn.textContent = `${action} ${leadType}`;
        form.appendChild(submitBtn);

        formContainer.appendChild(form);
        
        // If viewing or updating, load existing data
        if (action === 'view' || action === 'update') {
            const searchContainer = this.createSearchContainer(leadType);
            formContainer.insertBefore(searchContainer, form);
        }
        
        // Add event listener to form
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    getFieldsForLeadType(leadType) {
        const commonFields = [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea' }
        ];

        const fields = {
            person: [
                ...commonFields,
                { name: 'email', label: 'Email', type: 'email', required: true },
                { name: 'position', label: 'Position', type: 'text' },
                { name: 'linkedin', label: 'LinkedIn Profile', type: 'url' },
                { name: 'company', label: 'Company', type: 'select', options: this.mockData.companies.map(c => ({ value: c.id, label: c.name })) }
            ],
            company: [
                ...commonFields,
                { name: 'industry', label: 'Industry', type: 'text', required: true },
                { name: 'website', label: 'Website', type: 'url' },
                { name: 'linkedin', label: 'LinkedIn Page', type: 'url' },
                { name: 'address', label: 'Address', type: 'text' }
            ],
            event: [
                ...commonFields,
                { name: 'date', label: 'Date', type: 'date', required: true },
                { name: 'time', label: 'Time', type: 'time' },
                { name: 'location', label: 'Location', type: 'text' },
                { name: 'type', label: 'Event Type', type: 'select', options: [
                    { value: 'meeting', label: 'Meeting' }, 
                    { value: 'conference', label: 'Conference' }, 
                    { value: 'workshop', label: 'Workshop' }, 
                    { value: 'pitch', label: 'Pitch' }, 
                    { value: 'other', label: 'Other' }
                ]}
            ]
        };

        return fields[leadType] || commonFields;
    }

    createFormGroup(field) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.htmlFor = field.name;
        label.textContent = field.label;
        formGroup.appendChild(label);

        let input;
        if (field.type === 'textarea') {
            input = document.createElement('textarea');
        } else if (field.type === 'select') {
            input = document.createElement('select');
            
            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = `Select ${field.label}`;
            input.appendChild(emptyOption);
            
            // Add options from field config
            if (field.options && Array.isArray(field.options)) {
                field.options.forEach(option => {
                    const opt = document.createElement('option');
                    if (typeof option === 'object') {
                        opt.value = option.value;
                        opt.textContent = option.label;
                    } else {
                        opt.value = option.toLowerCase();
                        opt.textContent = option;
                    }
                    input.appendChild(opt);
                });
            }
        } else {
            input = document.createElement('input');
            input.type = field.type;
        }

        input.id = field.name;
        input.name = field.name;
        input.required = field.required || false;
        input.className = 'form-control';
        formGroup.appendChild(input);

        return formGroup;
    }

    createSearchContainer(leadType) {
        const container = document.createElement('div');
        container.className = 'search-container card';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = `Search ${leadType}...`;
        searchInput.className = 'form-control search-input';

        const resultsList = document.createElement('div');
        resultsList.className = 'search-results';

        container.appendChild(searchInput);
        container.appendChild(resultsList);

        // Add search functionality
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length < 2) {
                resultsList.innerHTML = '';
                return;
            }

            // Get mock data based on lead type
            let items = [];
            if (leadType === 'person') {
                items = this.mockData.contacts;
            } else if (leadType === 'company') {
                items = this.mockData.companies;
            } else if (leadType === 'event') {
                items = this.mockData.events;
            }
            
            // Filter items by name matching query
            const filteredItems = items.filter(item => 
                item.name.toLowerCase().includes(query)
            );
            
            this.displaySearchResults(filteredItems, resultsList);
        });

        return container;
    }

    displaySearchResults(results, container) {
        container.innerHTML = '';
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.textContent = result.name;
            item.addEventListener('click', () => this.loadLeadData(result));
            container.appendChild(item);
        });
    }

    loadLeadData(lead) {
        const form = document.getElementById('leadForm');
        if (!form) return;

        // Populate form fields with lead data
        Object.keys(lead).forEach(key => {
            const input = form.elements[key];
            if (input) {
                input.value = lead[key];
            }
        });
    }
    
    viewLeadDetails(item) {
        // Set lead type and action
        const leadTypeSelect = document.getElementById('leadTypeSelect');
        const actionSelect = document.getElementById('actionSelect');
        
        if (item.hasOwnProperty('position')) {
            leadTypeSelect.value = 'person';
        } else if (item.hasOwnProperty('industry')) {
            leadTypeSelect.value = 'company';
        } else {
            leadTypeSelect.value = 'event';
        }
        
        actionSelect.value = 'view';
        
        // Switch to management view
        const manageMode = document.getElementById('manageMode');
        if (manageMode) {
            manageMode.click();
        }
        
        // Trigger change events to update form
        leadTypeSelect.dispatchEvent(new Event('change'));
        actionSelect.dispatchEvent(new Event('change'));
        
        // Wait for form to be created
        setTimeout(() => {
            // Populate form with item data
            this.loadLeadData(item);
        }, 300);
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        const leadType = document.getElementById('leadTypeSelect').value;
        const action = document.getElementById('actionSelect').value;
        
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        // For demo purposes, show success message and reset form
        alert(`${leadType} ${action}d successfully!`);
        e.target.reset();
        
        // Refresh mock data (in a real app, this would save to backend)
        this.loadMockData();
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
            .text(d => d.name)
            .style('font-size', '10px')
            .style('fill', '#fff');
        
        // Add hover title
        node.append('title')
            .text(d => d.name);
        
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
                    node.name.toLowerCase().includes(query)
                );
                
                // Display matches
                searchResults.innerHTML = '';
                matches.slice(0, 5).forEach(match => {
                    const item = document.createElement('div');
                    item.className = 'search-result-item';
                    item.textContent = match.name;
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
    
    prepareNetworkData() {
        const nodes = [
            ...this.mockData.contacts.map(c => ({ 
                ...c, 
                id: `person-${c.id}`, 
                type: 'person',
                company: c.company  // Keep reference to company
            })),
            ...this.mockData.companies.map(c => ({ 
                ...c, 
                id: `company-${c.id}`, 
                type: 'company' 
            })),
            ...this.mockData.events.map(e => ({ 
                ...e, 
                id: `event-${e.id}`, 
                type: 'event',
                related_companies: e.related_companies || [] // Keep reference to companies
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
        
        // Link events to companies
        this.mockData.events.forEach(event => {
            if (event.related_companies && Array.isArray(event.related_companies)) {
                event.related_companies.forEach(companyId => {
                    links.push({
                        source: `event-${event.id}`,
                        target: `company-${companyId}`,
                        type: 'involves'
                    });
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
            <h4>${d.name}</h4>
            <p><strong>Type:</strong> ${d.type}</p>
            ${d.type === 'person' ? `
                <p><strong>Position:</strong> ${d.position || 'N/A'}</p>
                <p><strong>Email:</strong> ${d.email || 'N/A'}</p>
                <p><strong>Company:</strong> ${
                    d.company ? 
                    this.mockData.companies.find(c => c.id === d.company)?.name || d.company 
                    : 'N/A'
                }</p>
            ` : d.type === 'company' ? `
                <p><strong>Industry:</strong> ${d.industry || 'N/A'}</p>
                <p><strong>Website:</strong> ${d.website ? `<a href="${d.website}" target="_blank">${d.website}</a>` : 'N/A'}</p>
                <p><strong>Description:</strong> ${d.description || 'N/A'}</p>
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
