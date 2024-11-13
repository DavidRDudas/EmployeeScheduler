// Initialize employees in common.js if not exists
if (!window.employees) {
    window.employees = JSON.parse(localStorage.getItem('employees')) || {};
}

window.addEmployee = function() {
    const id = document.getElementById('employeeId').value;
    const name = document.getElementById('employeeName').value;
    const role = document.getElementById('employeeRole').value;
    const market = document.getElementById('employeeMarket').value;
    const email = document.getElementById('employeeEmail').value;
    const color = document.getElementById('employeeColor').value || 
                 '#' + Math.floor(Math.random()*16777215).toString(16);

    if (!id || !name || !role || !market || !email) {
        alert('Please fill in all fields');
        return;
    }

    if (window.employees[id]) {
        alert('Employee ID already exists');
        return;
    }

    window.employees[id] = {
        name,
        role,
        market,
        email,
        color,
        active: true,
        dateAdded: new Date().toISOString()
    };

    window.saveData();
    window.renderEmployees();
    
    // Clear form
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeRole').value = '';
    document.getElementById('employeeMarket').value = '';
    document.getElementById('employeeEmail').value = '';
    document.getElementById('employeeColor').value = '';
};

window.renderEmployees = function() {
    const employeesGrid = document.getElementById('employees-grid');
    employeesGrid.innerHTML = '';

    Object.entries(window.employees).forEach(([id, employee]) => {
        const employeeCard = document.createElement('div');
        employeeCard.className = `employee-item ${employee.active ? '' : 'inactive'}`;
        employeeCard.style.borderLeftColor = employee.color || '#4CAF50';
        
        employeeCard.innerHTML = `
            <div class="employee-header">
                <h4>${employee.name}</h4>
                <div class="employee-color" style="background-color: ${employee.color || '#4CAF50'}"></div>
            </div>
            <div class="employee-details">
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Role:</strong> ${employee.role}</p>
                <p><strong>Market:</strong> ${employee.market}</p>
                <p><strong>Email:</strong> ${employee.email}</p>
                <p><strong>Status:</strong> ${employee.active ? 'Active' : 'Inactive'}</p>
            </div>
            <div class="employee-actions">
                <button onclick="window.editEmployee('${id}')" class="edit-btn">Edit</button>
                <button onclick="window.deleteEmployee('${id}')" class="delete-btn">Delete</button>
                <button onclick="window.viewEmployeeSchedule('${id}')" class="schedule-btn">View Schedule</button>
                <button onclick="window.toggleEmployeeStatus('${id}')" class="status-btn ${employee.active ? 'deactivate' : 'activate'}">
                    ${employee.active ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        `;
        
        employeesGrid.appendChild(employeeCard);
    });
};

// Add at the top of the file, after the employees initialization
let currentEditId = null;

// Update the editEmployee function
window.editEmployee = function(id) {
    const employee = window.employees[id];
    if (!employee) return;

    const modal = document.getElementById('editEmployeeModal');
    modal.style.display = 'flex';
    currentEditId = id;

    // Populate form fields
    document.getElementById('editEmployeeId').value = id;
    document.getElementById('editName').value = employee.name;
    document.getElementById('editRole').value = employee.role;
    document.getElementById('editMarket').value = employee.market;
    document.getElementById('editEmail').value = employee.email;
    document.getElementById('editColor').value = employee.color || '#cccccc';

    // Remove any existing click handler
    const saveBtn = document.getElementById('saveEmployeeEdit');
    saveBtn.replaceWith(saveBtn.cloneNode(true));

    // Add new click handler
    document.getElementById('saveEmployeeEdit').onclick = function() {
        const newId = document.getElementById('editEmployeeId').value;
        const newName = document.getElementById('editName').value;
        const newRole = document.getElementById('editRole').value;
        const newMarket = document.getElementById('editMarket').value;
        const newEmail = document.getElementById('editEmail').value;
        const newColor = document.getElementById('editColor').value;

        if (!newId || !newName || !newRole || !newMarket || !newEmail) {
            alert('Please fill in all fields');
            return;
        }

        if (newId !== currentEditId && window.employees[newId]) {
            alert('An employee with this ID already exists');
            document.getElementById('editEmployeeId').value = currentEditId;
            return;
        }

        const oldName = window.employees[currentEditId].name;
        const updatedEmployee = {
            name: newName,
            role: newRole,
            market: newMarket,
            email: newEmail,
            color: newColor,
            active: window.employees[currentEditId].active,
            dateAdded: window.employees[currentEditId].dateAdded
        };

        // Update assignments if name or ID changed
        if (newId !== currentEditId || newName !== oldName) {
            if (window.scheduleData) {
                window.scheduleData.forEach(assignment => {
                    if (assignment.employee === oldName) {
                        assignment.employee = newName;
                    }
                });
            }

            // Remove old employee entry if ID changed
            if (newId !== currentEditId) {
                delete window.employees[currentEditId];
            }
        }

        // Save employee with new or existing ID
        window.employees[newId] = updatedEmployee;

        window.saveData();
        window.renderEmployees();
        
        // Only call renderCalendar if it exists
        if (typeof window.renderCalendar === 'function') {
            window.renderCalendar();
        }
        
        modal.style.display = 'none';
    };

    // Modal close handlers
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => modal.style.display = 'none';

    const cancelBtn = modal.querySelector('.cancel-btn');
    cancelBtn.onclick = () => modal.style.display = 'none';

    modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
};

// // Add DOMContentLoaded event listener for initial setup only
// document.addEventListener('DOMContentLoaded', function() {
//     // Setup market search functionality
//     window.setupMarketSearch();
    
//     // Setup employee search functionality
//     window.setupEmployeeSearch();

//     // Initial render of employees
//     window.renderEmployees();
// });

window.toggleEmployeeStatus = function(id) {
    const employee = window.employees[id];
    if (!employee) return;

    employee.active = !employee.active;
    window.saveData();
    window.renderEmployees();
};

window.viewEmployeeSchedule = function(id) {
    const employee = window.employees[id];
    if (!employee) return;

    // Get assignments for this employee
    const assignments = window.scheduleData ? window.scheduleData.filter(a => a.employee === employee.name) : [];

    // Calculate total time for each project
    const projectTimeMap = assignments.reduce((acc, assignment) => {
        const projectId = assignment.projectId;
        const start = new Date(assignment.startDate + 'T12:00:00');
        const end = new Date(assignment.endDate + 'T12:00:00');
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (!acc[projectId]) {
            acc[projectId] = { name: window.projects[projectId]?.name || 'Unknown Project', days: 0 };
        }
        acc[projectId].days += days;

        return acc;
    }, {});

    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Schedule: ${employee.name}</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <h4>Employee Details</h4>
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Role:</strong> ${employee.role}</p>
                <p><strong>Market:</strong> ${employee.market}</p>
                <p><strong>Email:</strong> ${employee.email}</p>
                
                <h4>Project Time Summary</h4>
                <ul>
                    ${Object.entries(projectTimeMap).map(([projectId, { name, days }]) => `
                        <li>${name}: ${days} days</li>
                    `).join('')}
                </ul>
                
                <h4>Assignments (${assignments.length})</h4>
                ${assignments.length > 0 ? `
                    <table class="assignments-table">
                        <thead>
                            <tr>
                                <th>Date Range</th>
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
                                    <td>${window.projects[assignment.projectId]?.name || 'Unknown Project'}</td>
                                    <td>${assignment.marketProjectManager}</td>
                                    <td>${assignment.entryType}</td>
                                    <td>
                                        <button class="delete-assignment-btn" 
                                                data-start="${assignment.startDate}" 
                                                data-end="${assignment.endDate}"
                                                data-project="${assignment.projectId}">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<p>No assignments found for this employee</p>'}
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
            
            if (confirm('Are you sure you want to delete this assignment?')) {
                // Find and remove the assignment
                const assignmentIndex = window.scheduleData.findIndex(a => 
                    a.employee === employee.name && 
                    a.startDate === startDate && 
                    a.endDate === endDate && 
                    a.projectId === projectId
                );
                
                if (assignmentIndex !== -1) {
                    window.scheduleData.splice(assignmentIndex, 1);
                    window.saveData();
                    window.renderCalendar(); // Refresh the calendar view
                    
                    // Refresh the schedule view
                    modal.remove();
                    window.viewEmployeeSchedule(id);
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

window.filterEmployees = function() {
    const searchTerm = document.getElementById('searchEmployeeInput').value.toLowerCase();
    const employeeCards = document.querySelectorAll('.employee-item');

    employeeCards.forEach(card => {
        const name = card.querySelector('h4').textContent.toLowerCase();
        const role = card.querySelector('p:nth-child(2)').textContent.toLowerCase();
        const market = card.querySelector('p:nth-child(3)').textContent.toLowerCase();

        if (name.includes(searchTerm) || 
            role.includes(searchTerm) || 
            market.includes(searchTerm)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
};

// Add global sort state
let currentSort = {
    field: null,
    direction: 'asc'
};

window.sortEmployees = function(criteria) {
    const grid = document.getElementById('employees-grid');
    const cards = Array.from(grid.children);
    
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
    
    cards.sort((a, b) => {
        let valueA, valueB;
        
        switch(criteria) {
            case 'name':
                valueA = a.querySelector('h4').textContent;
                valueB = b.querySelector('h4').textContent;
                break;
            case 'market':
                valueA = a.querySelector('p:nth-child(2)').textContent.split(':')[1].trim();
                valueB = b.querySelector('p:nth-child(2)').textContent.split(':')[1].trim();
                break;
            case 'role':
                valueA = a.querySelector('p:nth-child(1)').textContent.split(':')[1].trim();
                valueB = b.querySelector('p:nth-child(1)').textContent.split(':')[1].trim();
                break;
        }
        
        if (currentSort.direction === 'asc') {
            return valueA.localeCompare(valueB);
        } else {
            return valueB.localeCompare(valueA);
        }
    });
    
    grid.innerHTML = '';
    cards.forEach(card => grid.appendChild(card));
};

window.initializePage = function() {
    window.renderEmployees();
    // Initialize PTO color input if it exists
    const ptoColorInput = document.getElementById('ptoColor');
    if (ptoColorInput) {
        ptoColorInput.value = window.getPTOColor();
    }
};

window.deleteEmployee = function(id) {
    const employee = window.employees[id];
    if (!employee) return;

    if (confirm('Are you sure you want to delete this employee? This will also delete all their assignments.')) {
        // Remove all assignments for this employee
        window.scheduleData = window.scheduleData.filter(assignment => 
            assignment.employee !== employee.name
        );

        // Delete the employee
        delete window.employees[id];

        // Save changes and refresh displays
        window.saveData();
        window.renderEmployees();
        window.renderCalendar(); // Refresh calendar if it exists
    }
};

// Add these functions to handle PTO color settings
window.savePTOColor = function() {
    const ptoColor = document.getElementById('ptoColor').value;
    if (!ptoColor) return;

    localStorage.setItem('ptoColor', ptoColor);
    
    // Update any visible PTO entries in the calendar
    const ptoEntries = document.querySelectorAll('.assignment[data-type="pto"]');
    ptoEntries.forEach(entry => {
        entry.style.backgroundColor = ptoColor;
        
        // Update text color based on background brightness
        const rgb = parseInt(ptoColor.slice(1), 16);
        const brightness = ((rgb >> 16) & 255) * 0.299 + 
                         ((rgb >> 8) & 255) * 0.587 + 
                         (rgb & 255) * 0.114;
        entry.style.color = brightness > 186 ? '#000000' : '#FFFFFF';
    });
    
    // Dispatch event to notify calendar to update if it exists
    window.dispatchEvent(new Event('ptoColorChanged'));
    
    // Show feedback to user
    alert('PTO color saved successfully!');
};
window.getPTOColor = function() {
    return localStorage.getItem('ptoColor') || '#ffcdd2'; // Default color if none set
};

// Add this function to handle market search setup
window.setupMarketSearch = function() {
    const marketInput = document.getElementById('employeeMarket');
    const editMarketInput = document.getElementById('editMarket');
    
    // Setup for Add Employee form
    setupMarketSearchField(marketInput);
    // Setup for Edit Employee form
    setupMarketSearchField(editMarketInput);
};

function setupMarketSearchField(input) {
    if (!input) return;

    const searchResults = document.createElement('div');
    searchResults.id = `${input.id}-search-results`;
    searchResults.className = 'search-results-dropdown';
    input.parentNode.appendChild(searchResults);

    input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        // Filter markets based on search term
        const matchingMarkets = window.markets
            .filter(market => 
                market.name.toLowerCase().includes(searchTerm) ||
                market.region.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5); // Limit to 5 results

        if (matchingMarkets.length > 0) {
            searchResults.innerHTML = matchingMarkets
                .map(market => `
                    <div class="search-result-item" onclick="window.selectMarket('${market.name}', '${input.id}')">
                        <div>${market.name}</div>
                        <div class="market-details">${market.region}</div>
                    </div>
                `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No matching markets found</div>';
            searchResults.classList.add('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

window.selectMarket = function(marketName, inputId) {
    document.getElementById(inputId).value = marketName;
    document.getElementById(`${inputId}-search-results`).classList.remove('active');
};

// Add these functions for employee search functionality
window.setupEmployeeSearch = function() {
    const employeeInput = document.getElementById('employee');
    if (!employeeInput) return;

    const searchResults = document.getElementById('employee-search-results');
    if (!searchResults) return;

    employeeInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        // Filter active employees based on search term
        const matchingEmployees = Object.values(window.employees)
            .filter(employee => 
                employee.active && (
                    employee.name.toLowerCase().includes(searchTerm) ||
                    employee.role.toLowerCase().includes(searchTerm) ||
                    employee.market.toLowerCase().includes(searchTerm)
                )
            )
            .slice(0, 5); // Limit to 5 results

        if (matchingEmployees.length > 0) {
            searchResults.innerHTML = matchingEmployees
                .map(employee => `
                    <div class="search-result-item" onclick="window.selectEmployee('${employee.name}', 'employee')">
                        <div>${employee.name}</div>
                        <div class="employee-details">Role: ${employee.role} | Market: ${employee.market}</div>
                    </div>
                `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No matching employees found</div>';
            searchResults.classList.add('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!employeeInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
};

window.selectEmployee = function(employeeName, inputId) {
    document.getElementById(inputId).value = employeeName;
    document.getElementById(`${inputId}-search-results`).classList.remove('active');
};

// Add event listeners for modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editEmployeeModal');
    if (!modal) return;
    
    // Close modal when clicking the X
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
    }
    
    // Close modal when clicking cancel
    const cancelBtn = modal.querySelector('.cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.classList.remove('show');
        });
    }
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
    
    // Save changes
    const saveBtn = document.getElementById('saveEmployeeEdit');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const newId = document.getElementById('editEmployeeId').value;
            const newName = document.getElementById('editName').value;
            const newRole = document.getElementById('editRole').value;
            const newMarket = document.getElementById('editMarket').value;
            const newEmail = document.getElementById('editEmail').value;
            const newColor = document.getElementById('editColor').value;

            if (!newId || !newName || !newRole || !newMarket || !newEmail) {
                alert('Please fill in all fields');
                return;
            }

            if (newId !== currentEditId && window.employees[newId]) {
                alert('An employee with this ID already exists');
                document.getElementById('editEmployeeId').value = currentEditId;
                return;
            }

            const oldName = window.employees[currentEditId].name;
            const updatedEmployee = {
                name: newName,
                role: newRole,
                market: newMarket,
                email: newEmail,
                color: newColor,
                active: window.employees[currentEditId].active,
                dateAdded: window.employees[currentEditId].dateAdded
            };

            // Update assignments if name or ID changed
            if (newId !== currentEditId || newName !== oldName) {
                if (window.scheduleData) {
                    window.scheduleData.forEach(assignment => {
                        if (assignment.employee === oldName) {
                            assignment.employee = newName;
                        }
                    });
                }

                // Remove old employee entry if ID changed
                if (newId !== currentEditId) {
                    delete window.employees[currentEditId];
                }
            }

            // Save employee with new or existing ID
            window.employees[newId] = updatedEmployee;

            window.saveData();
            window.renderEmployees();
            window.renderCalendar();
            
            modal.classList.remove('show');
        });
    }

    // Setup market search functionality
    window.setupMarketSearch();
    
    // Setup employee search functionality
    window.setupEmployeeSearch();

    // Initial render of employees
    window.renderEmployees();
});

