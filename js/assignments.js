window.renderAssignments = function() {
    const assignmentsList = document.getElementById('assignmentsList');
    assignmentsList.innerHTML = '';

    if (!window.scheduleData) {
        window.scheduleData = [];
    }

    // Filter assignments to only show active employees
    const activeAssignments = window.scheduleData.filter(assignment => {
        const employee = Object.values(window.employees).find(emp => emp.name === assignment.employee);
        return employee && employee.active;  // Only include if employee exists and is active
    });

    activeAssignments.forEach((assignment, index) => {
        const project = window.projects[assignment.projectId] || { name: 'Unknown Project', color: '#ffffff' };
        const employee = Object.values(window.employees).find(emp => emp.name === assignment.employee) || { color: '#ffffff' };

        const row = document.createElement('tr');
        
        // Create dates at noon to avoid timezone issues
        const startDate = new Date(assignment.startDate + 'T12:00:00');
        const endDate = new Date(assignment.endDate + 'T12:00:00');
        
        row.innerHTML = `
            <td>${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</td>
            <td style="background-color: ${employee.color};">${assignment.employee}</td>
            <td style="background-color: ${project.color};">${project.name}</td>
            <td>${project.market || 'N/A'}</td>
            <td>${assignment.marketProjectManager || 'N/A'}</td>
            <td>${assignment.entryType}</td>
            <td>
                <button class="edit-btn" onclick="window.editAssignment(${index})">Edit</button>
                <button class="delete-btn" onclick="window.deleteAssignment(${index})">Delete</button>
            </td>
        `;
        
        assignmentsList.appendChild(row);
    });
};

window.addAssignment = function() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const employee = document.getElementById('employee').value;
    const projectInput = document.getElementById('projectId');
    const projectId = projectInput.dataset.id;
    const marketProjectManager = document.getElementById('marketProjectManager').value;
    const entryType = document.getElementById('entryType').value;

    if (!startDate || !endDate || !employee || !projectId || !marketProjectManager) {
        alert('Please fill in all fields');
        return;
    }

    // Create dates at noon to avoid timezone issues
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');

    if (end < start) {
        alert('End date cannot be before start date');
        return;
    }

    // Check for conflicts and collect them
    const conflicts = window.scheduleData.filter(entry => {
        const entryStart = new Date(entry.startDate + 'T12:00:00');
        const entryEnd = new Date(entry.endDate + 'T12:00:00');

        return entry.employee === employee && 
               ((start >= entryStart && start <= entryEnd) ||
                (end >= entryStart && end <= entryEnd) ||
                (start <= entryStart && end >= entryEnd));
    });

    if (conflicts.length > 0) {
        // Create conflict message
        const conflictMessage = createConflictMessage(conflicts, start, end);
        
        if (!confirm(conflictMessage)) {
            return;
        }
    }

    // Store the dates with the time component
    window.scheduleData.push({
        startDate: start.toISOString().split('T')[0],  // Store just the date part
        endDate: end.toISOString().split('T')[0],      // Store just the date part
        employee,
        projectId,
        projectName: window.projects[projectId]?.name || 'Unknown Project',
        marketProjectManager,
        entryType
    });

    window.saveData();
    window.renderAssignments();
    window.renderCalendar();

    // Clear form
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.getElementById('employee').value = '';
    document.getElementById('projectId').value = '';
    document.getElementById('marketProjectManager').value = '';
    document.getElementById('entryType').value = 'work';
};

function createConflictMessage(conflicts, newStart, newEnd) {
    const formatDate = date => new Date(date + 'T12:00:00').toLocaleDateString();
    
    let message = `Conflicts found for ${conflicts[0].employee}:\n\n`;
    message += `Your new assignment: ${formatDate(newStart.toISOString().split('T')[0])} - ${formatDate(newEnd.toISOString().split('T')[0])}\n\n`;
    message += 'Conflicts with:\n\n';
    
    conflicts.forEach(conflict => {
        const project = window.projects[conflict.projectId] || { name: 'Unknown Project' };
        message += `- ${project.name}\n`;
        message += `  ${formatDate(conflict.startDate)} - ${formatDate(conflict.endDate)}\n`;
        message += `  Type: ${conflict.entryType}\n\n`;
    });

    message += '\nDo you want to continue anyway?';
    
    return message;
}

window.deleteAssignment = function(index) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        window.scheduleData.splice(index, 1);
        window.saveData();
        window.renderAssignments();
    }
};

window.filterAssignments = function() {
    const searchTerm = document.getElementById('searchAssignmentInput').value.toLowerCase();
    const rows = document.getElementById('assignmentsList').getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
};

// Add global sort state
let currentSort = {
    field: null,
    direction: 'asc'
};

window.sortAssignments = function(criteria) {
    const tbody = document.getElementById('assignmentsList');
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    
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
    
    rows.sort((a, b) => {
        let valueA, valueB;
        
        switch(criteria) {
            case 'date':
                // Extract the start date from the range (first part before the hyphen)
                valueA = new Date(a.cells[0].textContent.split('-')[0].trim());
                valueB = new Date(b.cells[0].textContent.split('-')[0].trim());
                break;
            case 'employee':
                valueA = a.cells[1].textContent;
                valueB = b.cells[1].textContent;
                break;
            case 'project':
                valueA = a.cells[2].textContent;
                valueB = b.cells[2].textContent;
                break;
        }
        
        if (criteria === 'date') {
            return currentSort.direction === 'asc' ? 
                valueA.getTime() - valueB.getTime() : 
                valueB.getTime() - valueA.getTime();
        } else {
            if (currentSort.direction === 'asc') {
                return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            } else {
                return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
            }
        }
    });
    
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
};

window.setupEmployeeSearch = function() {
    // Setup for employee field
    setupEmployeeField('employee');
    // Setup for market PM field
    setupEmployeeField('marketProjectManager');
};

function setupEmployeeField(fieldId) {
    const input = document.getElementById(fieldId);
    const searchResults = document.createElement('div');
    searchResults.id = `${fieldId}-search-results`;
    searchResults.className = 'search-results-dropdown';
    input.parentNode.appendChild(searchResults);

    input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        // Filter active employees based on search term
        const matchingEmployees = Object.entries(window.employees)
            .filter(([id, employee]) => {
                return employee.active && (
                    employee.name.toLowerCase().includes(searchTerm) ||
                    employee.role.toLowerCase().includes(searchTerm) ||
                    employee.market.toLowerCase().includes(searchTerm)
                );
            })
            .slice(0, 5); // Limit to 5 results

        if (matchingEmployees.length > 0) {
            searchResults.innerHTML = matchingEmployees
                .map(([id, employee]) => `
                    <div class="search-result-item" onclick="window.selectEmployee('${employee.name}', '${fieldId}')">
                        <div>${employee.name}</div>
                        <div class="employee-details">${employee.role} - ${employee.market}</div>
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
        if (!input.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

window.selectEmployee = function(employeeName, fieldId) {
    document.getElementById(fieldId).value = employeeName;
    document.getElementById(`${fieldId}-search-results`).classList.remove('active');
};

// Add this function to handle project search setup
window.setupProjectSearch = function() {
    const projectInput = document.getElementById('projectId');
    const searchResults = document.createElement('div');
    searchResults.id = 'project-search-results';
    searchResults.className = 'search-results-dropdown';
    projectInput.parentNode.appendChild(searchResults);

    projectInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        // Filter projects based on search term
        const matchingProjects = Object.entries(window.projects)
            .filter(([id, project]) => 
                project.name.toLowerCase().includes(searchTerm) ||
                id.toLowerCase().includes(searchTerm) ||
                project.market.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5); // Limit to 5 results

        if (matchingProjects.length > 0) {
            searchResults.innerHTML = matchingProjects
                .map(([id, project]) => `
                    <div class="search-result-item" onclick="window.selectProject('${id}')">
                        <div>${project.name}</div>
                        <div class="project-details">ID: ${id} | Market: ${project.market}</div>
                    </div>
                `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No matching projects found</div>';
            searchResults.classList.add('active');
        }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!projectInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
};

window.selectProject = function(projectId) {
    const project = window.projects[projectId];
    document.getElementById('projectId').value = project.name;
    document.getElementById('projectId').dataset.id = projectId;
    document.getElementById('project-search-results').classList.remove('active');
};

// Update the add assignment form HTML
document.addEventListener('DOMContentLoaded', function() {
    const formGrid = document.querySelector('.form-grid');
    if (formGrid) {
        formGrid.innerHTML = `
            <div class="date-range">
                <input type="date" id="startDate" required>
                <span>to</span>
                <input type="date" id="endDate" required>
            </div>
            <div class="employee-search-container">
                <input type="text" id="employee" placeholder="Search employee..." autocomplete="off" required>
                <div id="employee-search-results" class="search-results-dropdown"></div>
            </div>
            <div class="project-search-container">
                <input type="text" id="projectId" placeholder="Search project..." autocomplete="off" required>
                <div id="project-search-results" class="search-results-dropdown"></div>
            </div>
            <div class="employee-search-container">
                <input type="text" id="marketProjectManager" placeholder="Search Market PM..." autocomplete="off" required>
                <div id="marketProjectManager-search-results" class="search-results-dropdown"></div>
            </div>
            <select id="entryType" required>
                <option value="work">Work</option>
                <option value="pto">PTO</option>
            </select>
            <button onclick="window.addAssignment()" class="add-btn">Add Assignment</button>
        `;
    }

    // Setup search functionality
    window.setupEmployeeSearch();
    window.setupProjectSearch();
    
    // Render existing assignments
    window.renderAssignments();
});

// Helper function to get all dates in a range
function getDatesInRange(startDate, endDate) {
    const dates = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
}

window.editAssignment = function(index) {
    const assignment = window.scheduleData[index];
    if (!assignment) return;

    const modal = document.getElementById('editAssignmentModal');
    modal.style.display = 'flex';

    // Populate form fields
    document.getElementById('editStartDate').value = assignment.startDate;
    document.getElementById('editEndDate').value = assignment.endDate;
    document.getElementById('editEmployee').value = assignment.employee;
    document.getElementById('editProjectId').value = window.projects[assignment.projectId]?.name || '';
    document.getElementById('editProjectId').dataset.id = assignment.projectId;
    document.getElementById('editMarketProjectManager').value = assignment.marketProjectManager;
    document.getElementById('editEntryType').value = assignment.entryType;

    // Store the current index for use in save function
    modal.dataset.editIndex = index;

    // Setup search functionality
    setupEmployeeField('editEmployee');
    setupEmployeeField('editMarketProjectManager');
    setupProjectSearchForEdit();
};

// Add event listeners for modal functionality
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...

    const editModal = document.getElementById('editAssignmentModal');
    if (editModal) {
        // Close modal when clicking the X
        const closeBtn = editModal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                editModal.style.display = 'none';
            });
        }
        
        // Close modal when clicking cancel
        const cancelBtn = editModal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                editModal.style.display = 'none';
            });
        }
        
        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === editModal) {
                editModal.style.display = 'none';
            }
        });
        
        // Save changes
        const saveBtn = editModal.querySelector('.save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const index = parseInt(editModal.dataset.editIndex);
                const startDate = document.getElementById('editStartDate').value;
                const endDate = document.getElementById('editEndDate').value;
                const employee = document.getElementById('editEmployee').value;
                const projectId = document.getElementById('editProjectId').dataset.id;
                const marketProjectManager = document.getElementById('editMarketProjectManager').value;
                const entryType = document.getElementById('editEntryType').value;

                if (!startDate || !endDate || !employee || !projectId || !marketProjectManager) {
                    alert('Please fill in all fields');
                    return;
                }

                // Create dates at noon to avoid timezone issues
                const start = new Date(startDate + 'T12:00:00');
                const end = new Date(endDate + 'T12:00:00');

                if (end < start) {
                    alert('End date cannot be before start date');
                    return;
                }

                // Check for conflicts (excluding the current assignment)
                const conflicts = window.scheduleData.filter((entry, i) => {
                    if (i === index) return false; // Skip current assignment

                    const entryStart = new Date(entry.startDate + 'T12:00:00');
                    const entryEnd = new Date(entry.endDate + 'T12:00:00');

                    return entry.employee === employee && 
                           ((start >= entryStart && start <= entryEnd) ||
                            (end >= entryStart && end <= entryEnd) ||
                            (start <= entryStart && end >= entryEnd));
                });

                if (conflicts.length > 0) {
                    const conflictMessage = createConflictMessage(conflicts, start, end);
                    
                    if (!confirm(conflictMessage)) {
                        return;
                    }
                }

                // Update the assignment
                window.scheduleData[index] = {
                    startDate: start.toISOString().split('T')[0],
                    endDate: end.toISOString().split('T')[0],
                    employee,
                    projectId,
                    projectName: window.projects[projectId]?.name || 'Unknown Project',
                    marketProjectManager,
                    entryType
                };

                window.saveData();
                window.renderAssignments();
                // Only call renderCalendar if it exists
                if (typeof window.renderCalendar === 'function') {
                    window.renderCalendar();
                }
                editModal.style.display = 'none';
            });
        }
    }
});

// Add project search setup for edit modal
function setupProjectSearchForEdit() {
    const projectInput = document.getElementById('editProjectId');
    const searchResults = document.createElement('div');
    searchResults.id = 'edit-project-search-results';
    searchResults.className = 'search-results-dropdown';
    projectInput.parentNode.appendChild(searchResults);

    projectInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        const matchingProjects = Object.entries(window.projects)
            .filter(([id, project]) => 
                project.name.toLowerCase().includes(searchTerm) ||
                id.toLowerCase().includes(searchTerm) ||
                project.market.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5);

        if (matchingProjects.length > 0) {
            searchResults.innerHTML = matchingProjects
                .map(([id, project]) => `
                    <div class="search-result-item" onclick="window.selectEditProject('${id}')">
                        <div>${project.name}</div>
                        <div class="project-details">ID: ${id} | Market: ${project.market}</div>
                    </div>
                `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No matching projects found</div>';
            searchResults.classList.add('active');
        }
    });

    document.addEventListener('click', function(e) {
        if (!projectInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
}

// Add project selection for edit modal
window.selectEditProject = function(projectId) {
    const project = window.projects[projectId];
    document.getElementById('editProjectId').value = project.name;
    document.getElementById('editProjectId').dataset.id = projectId;
    document.getElementById('edit-project-search-results').classList.remove('active');
};