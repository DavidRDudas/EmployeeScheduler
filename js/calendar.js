window.currentDate = new Date();

window.addEventListener('ptoColorChanged', function() {
    window.renderCalendar();
});

window.renderCalendar = function() {
    const calendar = document.getElementById('calendar');
    if (!calendar) {
        console.error('Calendar element not found');
        return;
    }

    calendar.innerHTML = '';

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Get first day of month and number of days
    const firstDay = new Date(window.currentDate.getFullYear(), window.currentDate.getMonth(), 1);
    const lastDay = new Date(window.currentDate.getFullYear(), window.currentDate.getMonth() + 1, 0);
    
    // Add empty cells for days before start of month
    for (let i = 0; i < firstDay.getDay(); i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty-day';
        calendar.appendChild(emptyDay);
    }

    // Add days of month
    for (let date = 1; date <= lastDay.getDate(); date++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        
        const dateLabel = document.createElement('div');
        dateLabel.className = 'date-label';
        dateLabel.textContent = date;
        dayCell.appendChild(dateLabel);

        const currentDate = new Date(window.currentDate.getFullYear(), window.currentDate.getMonth(), date, 12, 0, 0);
        
        // Add assignments for this day
        window.scheduleData.forEach(assignment => {
            // Create dates at noon to avoid timezone issues
            const startDate = new Date(assignment.startDate + 'T12:00:00');
            const endDate = new Date(assignment.endDate + 'T12:00:00');
            
            // Set currentDate to noon as well for consistent comparison
            const currentCellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0);

            if (currentCellDate >= startDate && currentCellDate <= endDate) {
                renderAssignment(assignment, dayCell);
            }
        });

        calendar.appendChild(dayCell);
    }

    // Update month display
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = window.currentDate.toLocaleDateString('default', { 
            month: 'long', 
            year: 'numeric' 
        });
    }
};

window.updateMonthDisplay = function() {
    const monthDisplay = document.getElementById('currentMonth');
    if (monthDisplay) {
        monthDisplay.textContent = window.currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
};

window.previousMonth = function() {
    window.currentDate.setMonth(window.currentDate.getMonth() - 1);
    // Update the dropdown selectors to match the new date
    document.getElementById('monthSelect').value = window.currentDate.getMonth();
    document.getElementById('yearSelect').value = window.currentDate.getFullYear();
    window.renderCalendar();
};

window.nextMonth = function() {
    window.currentDate.setMonth(window.currentDate.getMonth() + 1);
    // Update the dropdown selectors to match the new date
    document.getElementById('monthSelect').value = window.currentDate.getMonth();
    document.getElementById('yearSelect').value = window.currentDate.getFullYear();
    window.renderCalendar();
};

window.addEntry = function() {
    const date = document.getElementById('date').value;
    const employee = document.getElementById('employee').value;
    const projectId = document.getElementById('projectId').value;
    const estimatedTime = document.getElementById('estimatedTime').value;
    const marketProjectManager = document.getElementById('marketProjectManager').value;
    const entryType = document.getElementById('entryType').value;

    if (!date || !employee || !projectId || !estimatedTime || !marketProjectManager) {
        alert('Please fill in all fields');
        return;
    }

    // Check for PTO conflicts
    if (entryType === 'pto') {
        const conflicts = window.scheduleData.filter(entry => 
            entry.date === date && 
            entry.employee === employee && 
            entry.entryType === 'work'
        );

        if (conflicts.length > 0) {
            alert('Warning: This employee is assigned to projects on this date!');
        }
    }

    window.scheduleData.push({
        date,
        employee,
        projectId,
        projectName: window.projects[projectId]?.name || 'Unknown Project',
        estimatedTime,
        marketProjectManager,
        entryType
    });

    window.saveData();
    window.renderCalendar();
};

window.initializePage = function() {
    window.setupSearchFields();
    window.initializeMonthYearSelectors();
    window.renderCalendar();
};

window.searchSchedule = function() {
    const employee = document.getElementById('searchEmployee').value;
    const projectSearch = document.getElementById('searchProject').value;
    const market = document.getElementById('searchMarket').value;
    const startDate = document.getElementById('searchStartDate').value;
    const endDate = document.getElementById('searchEndDate').value;
    const entryType = document.getElementById('searchEntryType').value;

    // If no search criteria entered, don't perform search
    if (!employee && !projectSearch && !market && !startDate && !endDate && !entryType) {
        return;
    }

    // Clear any previous highlights
    document.querySelectorAll('.assignment').forEach(el => {
        el.classList.remove('highlighted');
    });

    // Find all matching assignments
    const visibleAssignments = [];
    const hiddenAssignments = [];

    // Helper function to check if an assignment matches search criteria
    const matchesSearch = (assignment) => {
        const project = window.projects[assignment.projectId];
        const matchesEmployee = !employee || assignment.employee.toLowerCase().includes(employee.toLowerCase());
        const matchesProject = !projectSearch || (project && project.name.toLowerCase().includes(projectSearch.toLowerCase()));
        const matchesMarket = !market || (project && project.market.toLowerCase().includes(market.toLowerCase()));
        const matchesType = !entryType || assignment.entryType === entryType;
        
        // Date matching
        const assignmentStart = new Date(assignment.startDate + 'T12:00:00');
        const assignmentEnd = new Date(assignment.endDate + 'T12:00:00');
        const searchStart = startDate ? new Date(startDate + 'T12:00:00') : null;
        const searchEnd = endDate ? new Date(endDate + 'T12:00:00') : null;
        
        const matchesDate = (!searchStart || assignmentEnd >= searchStart) && 
                           (!searchEnd || assignmentStart <= searchEnd);

        return matchesEmployee && matchesProject && matchesMarket && matchesDate && matchesType;
    };

    // Process all assignments
    window.scheduleData.forEach(assignment => {
        if (matchesSearch(assignment)) {
            // Check if assignment is in current month
            const assignmentStart = new Date(assignment.startDate + 'T12:00:00');
            const assignmentEnd = new Date(assignment.endDate + 'T12:00:00');
            const currentMonth = window.currentDate.getMonth();
            const currentYear = window.currentDate.getFullYear();

            if (assignmentStart.getMonth() === currentMonth && 
                assignmentStart.getFullYear() === currentYear) {
                visibleAssignments.push({
                    date: `${assignmentStart.toLocaleDateString()} - ${assignmentEnd.toLocaleDateString()}`,
                    employee: assignment.employee,
                    project: window.projects[assignment.projectId]?.name || 'Unknown Project',
                    market: window.projects[assignment.projectId]?.market || 'N/A'
                });
                
                // Find and highlight the assignment elements
                document.querySelectorAll('.assignment').forEach(el => {
                    const matchesEmployee = el.dataset.employee === assignment.employee;
                    const matchesProject = el.dataset.projectId === assignment.projectId;
                    const assignmentStart = new Date(el.dataset.startDate + 'T12:00:00');
                    const assignmentEnd = new Date(el.dataset.endDate + 'T12:00:00');
                    
                    // If the element represents the same assignment (matches employee and project)
                    // and falls within the assignment date range, highlight it
                    if (matchesEmployee && matchesProject && 
                        assignmentStart.getTime() === new Date(assignment.startDate + 'T12:00:00').getTime() &&
                        assignmentEnd.getTime() === new Date(assignment.endDate + 'T12:00:00').getTime()) {
                        el.classList.add('highlighted');
                    }
                });
            } else {
                // Add to hidden assignments if not in current month
                hiddenAssignments.push({
                    date: `${assignmentStart.toLocaleDateString()} - ${assignmentEnd.toLocaleDateString()}`,
                    employee: assignment.employee,
                    project: window.projects[assignment.projectId]?.name || 'Unknown Project',
                    market: window.projects[assignment.projectId]?.market || 'N/A'
                });
            }
        }
    });

    // Show results modal only if:
    // 1. No matches found at all
    // 2. There are hidden assignments (in other months)
    if (visibleAssignments.length === 0 && hiddenAssignments.length === 0) {
        showSearchResultsModal('No matching assignments found');
    } else if (hiddenAssignments.length > 0) {
        showSearchResultsModal('Search Results', visibleAssignments, hiddenAssignments);
    }
    // If only visible assignments are found, they're already highlighted, so no modal needed
};

function showSearchResultsModal(title, visibleAssignments = [], hiddenAssignments = []) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    let content = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">`;

    if (typeof title === 'string' && !visibleAssignments.length && !hiddenAssignments.length) {
        content += `<p>${title}</p>`;
    } else {
        if (visibleAssignments.length > 0) {
            content += `
                <h4>Visible Assignments (Current Month)</h4>
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Date Range</th>
                            <th>Employee</th>
                            <th>Project</th>
                            <th>Market</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${visibleAssignments.map(a => `
                            <tr>
                                <td>${a.date}</td>
                                <td>${a.employee}</td>
                                <td>${a.project}</td>
                                <td>${a.market}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }

        if (hiddenAssignments.length > 0) {
            content += `
                <h4>Other Matching Assignments</h4>
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Date Range</th>
                            <th>Employee</th>
                            <th>Project</th>
                            <th>Market</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${hiddenAssignments.map(a => `
                            <tr>
                                <td>${a.date}</td>
                                <td>${a.employee}</td>
                                <td>${a.project}</td>
                                <td>${a.market}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
    }

    content += `
            </div>
        </div>`;

    modal.innerHTML = content;
    document.body.appendChild(modal);

    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => modal.remove());

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

window.findAvailableUsers = function() {
    const startDate = document.getElementById('searchStartDate').value;
    const endDate = document.getElementById('searchEndDate').value;

    if (!startDate || !endDate) {
        alert('Please select both start and end dates to find available users');
        return;
    }

    // Create dates at noon to avoid timezone issues
    const start = new Date(startDate + 'T12:00:00');
    const end = new Date(endDate + 'T12:00:00');
    
    // Get all dates in the range
    const dateRange = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
        dateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get all active employees
    const allEmployees = Object.values(window.employees)
        .filter(emp => emp.active);

    // Calculate availability for each employee
    const employeeAvailability = allEmployees.map(employee => {
        const busyDates = new Set(
            window.scheduleData
                .filter(assignment => assignment.employee === employee.name)
                .flatMap(assignment => {
                    const assignmentStart = new Date(assignment.startDate + 'T12:00:00');
                    const assignmentEnd = new Date(assignment.endDate + 'T12:00:00');
                    const dates = [];
                    let current = new Date(assignmentStart);
                    while (current <= assignmentEnd) {
                        dates.push(current.toISOString().split('T')[0]);
                        current.setDate(current.getDate() + 1);
                    }
                    return dates;
                })
        );

        const availableDays = dateRange.filter(date => !busyDates.has(date));
        const availabilityPercentage = (availableDays.length / dateRange.length) * 100;

        return {
            employee,
            availableDays,
            totalDays: dateRange.length,
            availabilityPercentage
        };
    });

    // Sort by availability percentage (highest first)
    employeeAvailability.sort((a, b) => b.availabilityPercentage - a.availabilityPercentage);

    // Create modal to display results
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content wide-modal">
            <div class="modal-header">
                <h3>Employee Availability</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p><strong>Date Range:</strong> ${start.toLocaleDateString()} - ${end.toLocaleDateString()}</p>
                <p><strong>Total Days:</strong> ${dateRange.length}</p>
                
                <table class="assignments-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Role</th>
                            <th>Market</th>
                            <th>Available Days</th>
                            <th>Availability</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${employeeAvailability.map(({employee, availableDays, totalDays, availabilityPercentage}) => `
                            <tr class="${availabilityPercentage === 100 ? 'fully-available' : availabilityPercentage === 0 ? 'not-available' : 'partially-available'}">
                                <td>${employee.name}</td>
                                <td>${employee.role}</td>
                                <td>${employee.market}</td>
                                <td>${availableDays.length} of ${totalDays} days</td>
                                <td>
                                    <div class="availability-bar">
                                        <div class="availability-fill" style="width: ${availabilityPercentage}%"></div>
                                        <span>${Math.round(availabilityPercentage)}%</span>
                                    </div>
                                </td>
                                <td>
                                    <button class="show-dates-btn" onclick="toggleAvailableDates(this)">Show Dates</button>
                                    <div class="available-dates-detail hidden">
                                        <h4>Available Dates:</h4>
                                        ${availableDays
                                            .map(date => `<div class="date-item">${new Date(date + 'T12:00:00').toLocaleDateString()}</div>`)
                                            .join('')}
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => modal.remove());

    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

window.clearSearch = function() {
    // Clear search inputs
    document.getElementById('searchEmployee').value = '';
    document.getElementById('searchProject').value = '';
    document.getElementById('searchMarket').value = '';
    document.getElementById('searchStartDate').value = '';
    document.getElementById('searchEndDate').value = '';
    document.getElementById('searchEntryType').value = '';
    
    // Refresh calendar with all data
    window.renderCalendar();
};

window.setupEmployeeSearch = function() {
    const employeeInput = document.getElementById('employee');
    const searchResults = document.getElementById('employee-search-results');

    employeeInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        // Clear results if search term is empty
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        // Filter employees based on search term
        const matchingEmployees = Object.entries(window.employees)
            .filter(([id, employee]) => {
                return employee.active && ( // Only show active employees
                    employee.name.toLowerCase().includes(searchTerm) ||
                    employee.role.toLowerCase().includes(searchTerm) ||
                    employee.market.toLowerCase().includes(searchTerm)
                );
            })
            .slice(0, 5); // Limit to 5 results

        // Show results
        if (matchingEmployees.length > 0) {
            searchResults.innerHTML = matchingEmployees
                .map(([id, employee]) => `
                    <div class="search-result-item" onclick="window.selectEmployee('${employee.name}')">
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
        if (!employeeInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });

    // Prevent form submission on enter
    employeeInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });
};

window.selectEmployee = function(employeeName) {
    document.getElementById('employee').value = employeeName;
    document.getElementById('employee-search-results').classList.remove('active');
};

function renderAssignment(assignment, cell) {
    const employee = Object.values(window.employees).find(e => e.name === assignment.employee);
    if (!employee || !employee.active) return;

    const project = window.projects[assignment.projectId];
    const assignmentDiv = document.createElement('div');
    assignmentDiv.className = 'assignment';
    
    // Add data attributes for searching
    assignmentDiv.dataset.employee = assignment.employee;
    assignmentDiv.dataset.projectId = assignment.projectId;
    assignmentDiv.dataset.projectName = project ? project.name : 'Unknown Project';
    assignmentDiv.dataset.market = project ? project.market : '';
    assignmentDiv.dataset.startDate = assignment.startDate;
    assignmentDiv.dataset.endDate = assignment.endDate;
    assignmentDiv.dataset.type = assignment.entryType || 'work';
    
    // Get the current cell's date
    const cellDate = new Date(window.currentDate.getFullYear(), window.currentDate.getMonth(), parseInt(cell.querySelector('.date-label').textContent), 12, 0, 0);
    const startDate = new Date(assignment.startDate + 'T12:00:00');
    const endDate = new Date(assignment.endDate + 'T12:00:00');
    
    // Determine if this is start, middle, or end of assignment
    const isStart = cellDate.getTime() === startDate.getTime();
    const isEnd = cellDate.getTime() === endDate.getTime();
    const isMiddle = !isStart && !isEnd && cellDate >= startDate && cellDate <= endDate;
    const isContinuousMode = window.getContinuousBlocks();
    
    // Add appropriate class
    if (isContinuousMode) {
        if (isStart) assignmentDiv.classList.add('assignment-start');
        if (isMiddle) assignmentDiv.classList.add('assignment-middle');
        if (isEnd) assignmentDiv.classList.add('assignment-end');
    }
    
    // Handle PTO entries
    if (assignment.entryType && assignment.entryType.toLowerCase() === 'pto') {
        const ptoColor = window.getPTOColor();
        assignmentDiv.classList.add('pto');
        assignmentDiv.style.cssText = `
            background-color: ${ptoColor} !important;
            border-color: ${ptoColor} !important;
        `;
        
        if (isContinuousMode) {
            if (isStart) {
                assignmentDiv.innerHTML = `
                    <span class="start-icon"></span>
                    <span class="assignment-text">${assignment.employee} - PTO</span>
                `;
            } else if (isEnd) {
                assignmentDiv.innerHTML = `
                    <span class="assignment-text">${assignment.employee} - PTO (END)</span>
                    <span class="end-icon"></span>
                `;
            } else {
                assignmentDiv.innerHTML = '<span class="assignment-text"></span>';
            }
        } else {
            // Non-continuous mode - show text for every block
            assignmentDiv.innerHTML = `${assignment.employee} - PTO`;
        }
    } 
    // Handle regular assignments
    else {
        const colorPreference = window.getColorPreference();
        let color = colorPreference === 'project' && project?.color ? 
            project.color : 
            (employee.color || '#4CAF50');

        assignmentDiv.style.backgroundColor = color;
        
        if (isContinuousMode) {
            if (isStart) {
                assignmentDiv.innerHTML = `
                    <span class="start-icon"></span>
                    <span class="assignment-text">${assignment.employee} - ${project ? project.name : 'Unknown Project'}</span>
                `;
            } else if (isEnd) {
                assignmentDiv.innerHTML = `
                    <span class="assignment-text">${assignment.employee} - ${project ? project.name : 'Unknown Project'} (END)</span>
                    <span class="end-icon"></span>
                `;
            } else {
                assignmentDiv.innerHTML = '<span class="assignment-text"></span>';
            }
        } else {
            // Non-continuous mode - show text for every block
            assignmentDiv.innerHTML = `${assignment.employee} - ${project ? project.name : 'Unknown Project'}`;
        }
    }

    // Calculate text color based on background brightness
    const bgColor = assignmentDiv.style.backgroundColor;
    const rgb = parseInt(bgColor.replace('#', ''), 16);
    const brightness = ((rgb >> 16) & 255) * 0.299 + 
                      ((rgb >> 8) & 255) * 0.587 + 
                      (rgb & 255) * 0.114;
    assignmentDiv.style.color = brightness > 186 ? '#000000' : '#FFFFFF';
    
    assignmentDiv.addEventListener('click', () => showAssignmentDetails(assignment));
    cell.appendChild(assignmentDiv);
}

window.setupSearchFields = function() {
    // Setup employee search
    setupSearchField('employee', () => {
        return Object.values(window.employees)
            .filter(emp => emp.active)
            .map(emp => ({
                id: emp.name,
                name: emp.name,
                details: `${emp.role} - ${emp.market}`
            }));
    });

    // Setup project search
    setupSearchField('project', () => {
        return Object.entries(window.projects)
            .map(([id, project]) => ({
                id: id,
                name: project.name,
                details: `ID: ${id}`,
                searchTerms: `${id} ${project.name}`.toLowerCase()
            }));
    });

    // Setup market search
    setupSearchField('market', () => {
        return window.markets.map(market => ({
            id: market.name,
            name: market.name,
            details: `Region: ${market.region}`
        }));
    });
};

function setupSearchField(fieldId, getSearchData) {
    const input = document.getElementById(`search${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    const searchResults = document.getElementById(`${fieldId}-search-results`);
    
    if (!input || !searchResults) return;

    input.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        
        if (!searchTerm) {
            searchResults.innerHTML = '';
            searchResults.classList.remove('active');
            return;
        }

        const matchingItems = getSearchData()
            .filter(item => 
                (item.searchTerms && item.searchTerms.includes(searchTerm)) ||
                item.name.toLowerCase().includes(searchTerm) ||
                item.details.toLowerCase().includes(searchTerm)
            )
            .slice(0, 5); // Limit to 5 results

        if (matchingItems.length > 0) {
            searchResults.innerHTML = matchingItems
                .map(item => `
                    <div class="search-result-item" onclick="window.selectSearchItem('${item.id}', '${fieldId}')">
                        <div>${item.name}</div>
                        <div class="search-result-details">${item.details}</div>
                    </div>
                `).join('');
            searchResults.classList.add('active');
        } else {
            searchResults.innerHTML = '<div class="search-result-item">No matches found</div>';
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

window.selectSearchItem = function(value, fieldId) {
    const input = document.getElementById(`search${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    const project = window.projects[value];
    input.value = project ? project.name : value; // Use project name if it's a project, otherwise use the value directly
    document.getElementById(`${fieldId}-search-results`).classList.remove('active');
};

window.showAssignmentDetails = function(assignment) {
    const employee = Object.values(window.employees).find(e => e.name === assignment.employee);
    const project = window.projects[assignment.projectId] || { name: 'Unknown Project', market: 'N/A' };
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    // Calculate date range
    const startDate = new Date(assignment.startDate + 'T12:00:00');
    const endDate = new Date(assignment.endDate + 'T12:00:00');
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Assignment Details</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="details-grid">
                    <div class="detail-group">
                        <h4>Employee Details</h4>
                        <p><strong>Name:</strong> ${employee.name}</p>
                        <p><strong>Role:</strong> ${employee.role}</p>
                        <p><strong>Market:</strong> ${employee.market}</p>
                        <p><strong>Email:</strong> ${employee.email}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Project Details</h4>
                        <p><strong>Project Name:</strong> ${project.name}</p>
                        <p><strong>Project ID:</strong> ${assignment.projectId}</p>
                        <p><strong>Market:</strong> ${project.market}</p>
                        <p><strong>Estimated Days:</strong> ${project.days}</p>
                    </div>
                    
                    <div class="detail-group">
                        <h4>Assignment Details</h4>
                        <p><strong>Date Range:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
                        <p><strong>Duration:</strong> ${daysDiff} days</p>
                        <p><strong>Type:</strong> ${assignment.entryType}</p>
                        <p><strong>Market PM:</strong> ${assignment.marketProjectManager}</p>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button class="delete-btn" onclick="window.deleteAssignmentFromModal('${assignment.startDate}', '${assignment.endDate}', '${assignment.employee}', '${assignment.projectId}')">
                        Delete Assignment
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add close button functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => modal.remove());
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
};

// Add delete functionality from modal
window.deleteAssignmentFromModal = function(startDate, endDate, employee, projectId) {
    if (confirm('Are you sure you want to delete this assignment?')) {
        const index = window.scheduleData.findIndex(a => 
            a.startDate === startDate && 
            a.endDate === endDate && 
            a.employee === employee && 
            a.projectId === projectId
        );
        
        if (index !== -1) {
            window.scheduleData.splice(index, 1);
            window.saveData();
            window.renderCalendar();
            
            // Close the modal
            document.querySelector('.modal').remove();
        }
    }
};

// Add this new function to handle showing/hiding dates
window.toggleAvailableDates = function(button) {
    const detailsDiv = button.nextElementSibling;
    if (detailsDiv.classList.contains('hidden')) {
        // Hide any other open details first
        document.querySelectorAll('.available-dates-detail:not(.hidden)').forEach(div => {
            div.classList.add('hidden');
            div.previousElementSibling.textContent = 'Show Dates';
        });
        
        detailsDiv.classList.remove('hidden');
        button.textContent = 'Hide Dates';
    } else {
        detailsDiv.classList.add('hidden');
        button.textContent = 'Show Dates';
    }
};

// Add event listeners for both color preference and PTO color changes
window.addEventListener('ptoColorChanged', function() {
    window.renderCalendar();
});

window.addEventListener('colorPreferenceChanged', function() {
    window.renderCalendar();
});

// Add event listener for continuous blocks changes
window.addEventListener('continuousBlocksChanged', function() {
    window.renderCalendar();
});

// Add this to your initialization code
window.initializeMonthYearSelectors = function() {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    
    // Set up year options (current year ± 10 years)
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 10; year <= currentYear + 10; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Set initial values
    monthSelect.value = window.currentDate.getMonth();
    yearSelect.value = window.currentDate.getFullYear();
};

window.changeMonth = function() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearSelect').value);
    
    window.currentDate = new Date(year, month, 1);
    window.renderCalendar();
};