// Initialize markets in common.js if not already there
if (!window.markets || !Array.isArray(window.markets)) {
    window.markets = [];
    window.saveData();
}

window.addMarket = function() {
    const marketName = document.getElementById('newMarketName').value;
    const region = document.getElementById('newMarketRegion').value;

    // Validate inputs
    if (!marketName || !region) {
        alert('Please fill in all fields');
        return;
    }

    // Check if market already exists
    if (window.markets.some(m => m.name.toLowerCase() === marketName.toLowerCase())) {
        alert('This market already exists');
        return;
    }

    // Add market to markets array
    window.markets.push({
        name: marketName,
        region: region
    });

    // Save to localStorage
    window.saveData();

    // Clear form
    document.getElementById('newMarketName').value = '';
    document.getElementById('newMarketRegion').value = '';

    // Refresh market list
    window.renderMarkets();
};

window.renderMarkets = function() {
    const marketList = document.getElementById('marketList');
    if (!marketList) return; // Guard clause if element doesn't exist

    marketList.innerHTML = `
        <div class="markets-grid"></div>
    `;

    const marketsGrid = marketList.querySelector('.markets-grid');
    
    // Ensure markets is an array before trying to sort/forEach
    const marketsArray = Array.isArray(window.markets) ? window.markets : [];
    
    // Apply current sort if exists
    if (window.currentSort) {
        window.applySorting(marketsArray);
    }

    marketsArray.forEach(market => {
        const marketItem = document.createElement('div');
        marketItem.className = 'market-item';
        marketItem.innerHTML = `
            <div class="market-header">
                <h4>${market.name}</h4>
            </div>
            <div class="market-details">
                <p><strong>Region:</strong> ${market.region}</p>
            </div>
            <div class="market-actions">
                <button class="edit-btn" onclick="window.editMarket('${market.name}')">Edit</button>
                <button class="delete-btn" onclick="window.deleteMarket('${market.name}')">Delete</button>
                <button class="view-schedule-btn" onclick="window.viewMarketSchedule('${market.name}')">View Schedule</button>
            </div>
        `;
        marketsGrid.appendChild(marketItem);
    });
};
window.deleteMarket = function(marketName) {
    if (confirm('Are you sure you want to delete this market?')) {
        window.markets = window.markets.filter(m => m.name.toLowerCase() !== marketName.toLowerCase());
        window.saveData();
        window.renderMarkets();
    }
};

// Sorting functionality
let currentSort = {
    field: null,
    direction: 'asc'
};

window.sortMarkets = function(criteria) {
    const marketList = document.getElementById('marketList');
    const items = Array.from(marketList.querySelectorAll('.market-item'));
    
    // Update sort direction
    if (currentSort.field === criteria) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = criteria;
        currentSort.direction = 'asc';
    }

    // Update sort icons using HTML entities
    document.querySelectorAll('.sort-btn').forEach(btn => {
        const icon = btn.querySelector('.sort-icon');
        if (btn.dataset.sort === criteria) {
            icon.innerHTML = currentSort.direction === 'asc' ? '&uarr;' : '&darr;';
        } else {
            icon.innerHTML = '&updownarrow;';
        }
    });
    
    // Sort the markets
    window.markets.sort((a, b) => {
        let valueA, valueB;
        
        switch(criteria) {
            case 'name':
                valueA = a.name;
                valueB = b.name;
                break;
            case 'region':
                valueA = a.region;
                valueB = b.region;
                break;
        }
        
        if (currentSort.direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
    
    window.renderMarkets();
};

window.applySorting = function(marketsArray) {
    marketsArray.sort((a, b) => {
        let valueA, valueB;
        
        switch (window.currentSort) {
            case 'name':
                valueA = a.name;
                valueB = b.name;
                break;
            case 'region':
                valueA = a.region;
                valueB = b.region;
                break;
        }

        if (valueA < valueB) return window.sortAscending ? -1 : 1;
        if (valueA > valueB) return window.sortAscending ? 1 : -1;
        return 0;
    });
};

// Initialize market list on page load
document.addEventListener('DOMContentLoaded', () => {
    window.renderMarkets();
});

window.filterMarkets = function() {
    const searchTerm = document.getElementById('searchMarketInput').value.toLowerCase();
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    const marketItems = marketList.querySelectorAll('.market-item');
    
    marketItems.forEach(item => {
        const marketName = item.querySelector('h4').textContent.toLowerCase();
        const marketRegion = item.querySelector('p').textContent.toLowerCase();
        
        const matches = marketName.includes(searchTerm) || 
                       marketRegion.includes(searchTerm);
        
        item.style.display = matches ? 'block' : 'none';
    });
};

let currentEditMarket = null;

window.editMarket = function(marketName) {
    const market = window.markets.find(m => m.name === marketName);
    if (!market) return;

    currentEditMarket = marketName;

    // Get the modal and populate fields
    const modal = document.getElementById('editMarketModal');
    document.getElementById('editMarketName').value = market.name;
    document.getElementById('editMarketRegion').value = market.region;

    // Show the modal
    modal.style.display = 'flex';
};

// Add event listeners for modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...

    const modal = document.getElementById('editMarketModal');
    
    // Close modal when clicking the X
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking cancel
    const cancelBtn = modal.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // Save changes
    const saveBtn = document.getElementById('saveMarketEdit');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const newName = document.getElementById('editMarketName').value;
            const newRegion = document.getElementById('editMarketRegion').value;

            if (!newName || !newRegion) {
                alert('Please fill in all fields');
                return;
            }

            // Check if new name already exists (only if name is being changed)
            if (newName !== currentEditMarket && 
                window.markets.some(m => m.name.toLowerCase() === newName.toLowerCase())) {
                alert('Market name already exists');
                return;
            }

            // Find and update the market
            const marketIndex = window.markets.findIndex(m => m.name === currentEditMarket);
            if (marketIndex !== -1) {
                // Update market data
                window.markets[marketIndex] = {
                    name: newName,
                    region: newRegion
                };

                // Update references in projects
                Object.values(window.projects).forEach(project => {
                    if (project.market === currentEditMarket) {
                        project.market = newName;
                    }
                });

                // Update references in employees
                Object.values(window.employees).forEach(employee => {
                    if (employee.market === currentEditMarket) {
                        employee.market = newName;
                    }
                });

                window.saveData();
                window.renderMarkets();
                
                // Close the modal
                modal.style.display = 'none';
            }
        });
    }

    window.renderMarkets();
});

window.viewMarketSchedule = function(marketName) {
    const market = window.markets.find(m => m.name === marketName);
    if (!market) return;

    // Get all projects in this market
    const marketProjects = Object.entries(window.projects)
        .filter(([_, project]) => project.market === marketName)
        .map(([id, project]) => ({id, ...project}));

    // Get assignments for all projects in this market
    const assignments = window.scheduleData ? window.scheduleData.filter(a => {
        const project = window.projects[a.projectId];
        return project && project.market === marketName;
    }) : [];

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Schedule: ${market.name}</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <h4>Market Details</h4>
                <p><strong>Name:</strong> ${market.name}</p>
                <p><strong>Region:</strong> ${market.region}</p>
                
                <h4>Projects (${marketProjects.length})</h4>
                ${marketProjects.length > 0 ? `
                    <table class="assignments-table">
                        <thead>
                            <tr>
                                <th>Project ID</th>
                                <th>Name</th>
                                <th>Estimated Days</th>
                                <th>Date Added</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${marketProjects.map(project => `
                                <tr>
                                    <td>${project.id}</td>
                                    <td>${project.name}</td>
                                    <td>${project.days}</td>
                                    <td>${new Date(project.dateAdded).toLocaleDateString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No projects found in this market</p>'}

                <h4>Assignments (${assignments.length})</h4>
                ${assignments.length > 0 ? `
                    <table class="assignments-table">
                        <thead>
                            <tr>
                                <th>Date Range</th>
                                <th>Employee</th>
                                <th>Project</th>
                                <th>Market PM</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(assignment => `
                                <tr>
                                    <td>${new Date(assignment.startDate).toLocaleDateString()} - ${new Date(assignment.endDate).toLocaleDateString()}</td>
                                    <td>${assignment.employee}</td>
                                    <td>${window.projects[assignment.projectId]?.name || 'Unknown Project'}</td>
                                    <td>${assignment.marketProjectManager}</td>
                                    <td>${assignment.entryType}</td>
                                    <td>
                                        <button class="delete-assignment-btn" 
                                                data-start="${assignment.startDate}" 
                                                data-end="${assignment.endDate}"
                                                data-project="${assignment.projectId}"
                                                data-employee="${assignment.employee}">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No assignments found for this market</p>'}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Update delete button event listeners
    const deleteButtons = modal.querySelectorAll('.delete-assignment-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const startDate = this.getAttribute('data-start');
            const endDate = this.getAttribute('data-end');
            const projectId = this.getAttribute('data-project');
            const employee = this.getAttribute('data-employee');
            
            if (confirm('Are you sure you want to delete this assignment?')) {
                // Find and remove the assignment
                const assignmentIndex = window.scheduleData.findIndex(a => 
                    a.projectId === projectId && 
                    a.startDate === startDate && 
                    a.endDate === endDate && 
                    a.employee === employee
                );
                
                if (assignmentIndex !== -1) {
                    window.scheduleData.splice(assignmentIndex, 1);
                    window.saveData();
                    const calendar = document.getElementById('calendar');
                    if (calendar) {
                        window.renderCalendar();
                    }
                    
                    // Refresh the schedule view
                    modal.remove();
                    window.viewMarketSchedule(marketName);
                }
            }
        });
    });

    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => modal.remove());

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

window.renderMarkets = function() {
    const marketList = document.getElementById('marketList');
    if (!marketList) return;

    marketList.innerHTML = `
        <div class="markets-grid"></div>
    `;

    const marketsGrid = marketList.querySelector('.markets-grid');
    const marketsArray = Array.isArray(window.markets) ? window.markets : [];
    
    if (window.currentSort) {
        window.applySorting(marketsArray);
    }

    marketsArray.forEach(market => {
        const marketItem = document.createElement('div');
        marketItem.className = 'market-item';
        marketItem.innerHTML = `
            <div class="market-header">
                <h4>${market.name}</h4>
            </div>
            <div class="market-details">
                <p><strong>Region:</strong> ${market.region}</p>
            </div>
            <div class="market-actions">
                <button class="edit-btn" onclick="window.editMarket('${market.name}')">Edit</button>
                <button class="delete-btn" onclick="window.deleteMarket('${market.name}')">Delete</button>
                <button class="schedule-btn" onclick="window.viewMarketSchedule('${market.name}')">View Schedule</button>
            </div>
        `;
        marketsGrid.appendChild(marketItem);
    });
};
