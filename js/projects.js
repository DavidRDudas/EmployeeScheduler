let currentEditId = null;
let currentSort = {
    field: null,
    direction: 'asc'
};

window.addProject = function() {
    const id = document.getElementById('newProjectId').value;
    const name = document.getElementById('newProjectName').value;
    const days = document.getElementById('newProjectDays').value;
    const marketName = document.getElementById('newProjectMarket').value;
    const color = document.getElementById('newProjectColor').value;

    if (!id || !name || !days || !marketName) {
        alert('Please fill in all fields');
        return;
    }

    // Check if project ID already exists
    if (window.projects[id]) {
        alert('A project with this ID already exists');
        return;
    }

    window.projects[id] = {
        name,
        days: parseInt(days),
        market: marketName,
        color: color || '#4CAF50',
        dateAdded: new Date().toISOString()
    };

    window.saveData();
    window.renderProjects();
    
    // Clear form
    document.getElementById('newProjectId').value = '';
    document.getElementById('newProjectName').value = '';
    document.getElementById('newProjectDays').value = '';
    document.getElementById('newProjectMarket').value = '';
    document.getElementById('newProjectColor').value = '#4CAF50';
};

// Add this helper function to determine status color
function getDaysStatusColor(estimatedDays, actualDays) {
    if (actualDays < estimatedDays) return '#4CAF50'; // Green
    if (actualDays === estimatedDays) return '#007bff'; // Blue
    return '#dc3545'; // Red
}

window.renderProjects = function() {
    const projectList = document.getElementById('projectList');
    projectList.innerHTML = '';

    Object.entries(window.projects).forEach(([id, project]) => {

        // Calculate total days assigned
        const assignments = window.scheduleData ? window.scheduleData.filter(a => a.projectId === id) : [];
        const totalDays = assignments.reduce((acc, assignment) => {
            const start = new Date(assignment.startDate + 'T12:00:00');
            const end = new Date(assignment.endDate + 'T12:00:00');
            return acc + (Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }, 0);

        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.style.borderLeft = `4px solid ${project.color || '#4CAF50'}`;
        
        projectCard.innerHTML = `
            <div class="project-header">
                <h4>${project.name}</h4>
                <div class="project-color" style="background-color: ${project.color || '#4CAF50'}"></div>
            </div>
            <div class="project-details">
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Market:</strong> ${project.market}</p>
                <p class="days-status" style="color: ${getDaysStatusColor(project.days, totalDays)}">
                    <strong>Days:</strong> ${totalDays}/${project.days} 
                    (${totalDays < project.days ? 'Under' : totalDays > project.days ? 'Over' : 'On'} Budget)
                </p>
            </div>
            <div class="project-actions">
                <button onclick="window.editProject('${id}')" class="edit-btn">Edit</button>
                <button onclick="window.deleteProject('${id}')" class="delete-btn">Delete</button>
                <button onclick="window.viewProjectSchedule('${id}')" class="schedule-btn">View Schedule</button>
            </div>
        `;
        
        projectList.appendChild(projectCard);
    });
};

window.deleteProject = function(id) {
    if (confirm('Are you sure you want to delete this project?')) {
        delete window.projects[id];
        window.saveData();
        window.renderProjects();
    }
};

window.filterProjects = function() {
    const searchTerm = document.getElementById('searchProjectInput').value.toLowerCase();
    const projectList = document.getElementById('projectList');
    
    Array.from(projectList.children).forEach(card => {
        const projectName = card.querySelector('h4').textContent.toLowerCase();
        const projectId = card.querySelector('.project-details p:nth-child(1)').textContent.toLowerCase();
        const projectMarket = card.querySelector('.project-details p:nth-child(2)').textContent.toLowerCase();
        
        const matches = projectName.includes(searchTerm) || 
                       projectId.includes(searchTerm) ||
                       projectMarket.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
    });
};

window.sortProjects = function(criteria) {
    const projectList = document.getElementById('projectList');
    const cards = Array.from(projectList.children);
    
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
                valueA = a.querySelector('.project-details p:nth-child(2)').textContent.split(':')[1].trim();
                valueB = b.querySelector('.project-details p:nth-child(2)').textContent.split(':')[1].trim();
                break;
            case 'days':
                valueA = parseInt(a.querySelector('.project-details p:nth-child(3)').textContent.split(':')[1].trim());
                valueB = parseInt(b.querySelector('.project-details p:nth-child(3)').textContent.split(':')[1].trim());
                break;
        }
        
        if (currentSort.direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
    
    projectList.innerHTML = '';
    cards.forEach(card => projectList.appendChild(card));
};

// Add event listeners for modal functionality
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('editModal');
    
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
    const saveBtn = document.getElementById('saveProjectEdit');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const oldProjectId = currentEditId;
            const newProjectId = document.getElementById('editProjectId').value;
            const newName = document.getElementById('editProjectName').value;
            const newDays = document.getElementById('editProjectDays').value;
            const newMarketName = document.getElementById('editProjectMarket').value;

            if (!newProjectId || !newName || !newDays || !newMarketName) {
                alert('Please fill in all fields');
                return;
            }

            // Check if new ID already exists (only if ID is being changed)
            if (newProjectId !== oldProjectId && window.projects[newProjectId]) {
                alert('Project ID already exists');
                return;
            }

            // Create the updated project data
            const updatedProject = {
                name: newName,
                days: parseInt(newDays),
                market: newMarketName, // Store the market name directly
                dateAdded: window.projects[oldProjectId].dateAdded
            };

            // If ID changed, update all assignments and project references
            if (newProjectId !== oldProjectId) {
                // Update all assignments that reference this project
                if (window.scheduleData) {
                    window.scheduleData.forEach(assignment => {
                        if (assignment.projectId === oldProjectId) {
                            assignment.projectId = newProjectId;
                            assignment.projectName = newName;
                        }
                    });
                }

                // Remove old project ID and add new one
                delete window.projects[oldProjectId];
                window.projects[newProjectId] = updatedProject;
            } else {
                // Just update the existing project
                window.projects[oldProjectId] = updatedProject;
                
                // Update assignment names
                if (window.scheduleData) {
                    window.scheduleData.forEach(assignment => {
                        if (assignment.projectId === oldProjectId) {
                            assignment.projectName = newName;
                        }
                    });
                }
            }

            window.saveData();
            window.renderProjects();
            
            // Close the modal
            const modal = document.getElementById('editModal');
            modal.style.display = 'none';
            
            // Refresh calendar if it exists
            const calendar = document.getElementById('calendar');
            if (calendar) {
                window.renderCalendar();
            }
        });
    }

    window.renderProjects();

    // Initialize market search on page load
    window.setupMarketSearch('newProjectMarket');
    window.setupMarketSearch('editProjectMarket');
});

window.viewProjectSchedule = function(id) {
    const project = window.projects[id];
    if (!project) return;

    const assignments = window.scheduleData ? window.scheduleData.filter(a => a.projectId === id) : [];
    const totalAssignedDays = assignments.reduce((total, assignment) => {
        const start = new Date(assignment.startDate + 'T12:00:00');
        const end = new Date(assignment.endDate + 'T12:00:00');
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        return total + days;
    }, 0);

    const overage = totalAssignedDays - project.days;
    const overageStatus = overage > 0 ? 'over' : overage < 0 ? 'under' : 'match';
    
    // Define status colors
    const statusColors = {
        over: '#dc3545',    // Red
        under: '#28a745',   // Green
        match: '#007bff'    // Blue
    };

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Schedule: ${project.name}</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="project-summary">
                    <h4>Project Details</h4>
                    <p><strong>ID:</strong> ${id}</p>
                    <p><strong>Market:</strong> ${project.market}</p>
                    <p><strong>Estimated Days:</strong> ${project.days}</p>
                    <p><strong>Total Assigned Days:</strong> ${totalAssignedDays}</p>
                    <p style="color: ${statusColors[overageStatus]}">
                        <strong>Status:</strong> 
                        ${overageStatus === 'match' ? 
                            'Assigned days match estimate exactly' :
                            `Project is ${Math.abs(overage)} days ${overageStatus} estimate`
                        }
                    </p>
                </div>
                
                <h4>Assignments (${assignments.length})</h4>
                ${assignments.length > 0 ? `
                    <table class="assignments-table">
                        <thead>
                            <tr>
                                <th>Date Range</th>
                                <th>Employee</th>
                                <th>Days</th>
                                <th>Market PM</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${assignments.map(assignment => {
                                const start = new Date(assignment.startDate + 'T12:00:00');
                                const end = new Date(assignment.endDate + 'T12:00:00');
                                const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                return `
                                    <tr>
                                        <td>${start.toLocaleDateString()} - ${end.toLocaleDateString()}</td>
                                        <td>${assignment.employee}</td>
                                        <td>${days}</td>
                                        <td>${assignment.marketProjectManager}</td>
                                        <td>${assignment.entryType}</td>
                                        <td>
                                            <button class="delete-assignment-btn" 
                                                    data-start="${assignment.startDate}" 
                                                    data-end="${assignment.endDate}"
                                                    data-employee="${assignment.employee}">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                ` : '<p>No assignments found for this project</p>'}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add delete button functionality
    const deleteButtons = modal.querySelectorAll('.delete-assignment-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const startDate = this.getAttribute('data-start');
            const endDate = this.getAttribute('data-end');
            const employee = this.getAttribute('data-employee');
            
            if (confirm('Are you sure you want to delete this assignment?')) {
                const assignmentIndex = window.scheduleData.findIndex(a => 
                    a.projectId === id && 
                    a.startDate === startDate && 
                    a.endDate === endDate && 
                    a.employee === employee
                );
                
                if (assignmentIndex !== -1) {
                    // Remove the assignment from the data
                    window.scheduleData.splice(assignmentIndex, 1);
                    window.saveData();
                    const calendar = document.getElementById('calendar');
                    if (calendar) {
                        window.renderCalendar();
                    }
                    
                    // Remove the table row directly
                    const row = this.closest('tr');
                    if (row) {
                        row.remove();
                        
                        // Update the assignments count in the header
                        const assignmentsHeader = modal.querySelector('h4');
                        const currentCount = window.scheduleData.filter(a => a.projectId === id).length;
                        assignmentsHeader.textContent = `Assignments (${currentCount})`;
                        
                        // If no assignments left, replace table with message
                        const tbody = modal.querySelector('tbody');
                        if (!tbody.children.length) {
                            const table = modal.querySelector('.assignments-table');
                            const noAssignmentsMsg = document.createElement('p');
                            noAssignmentsMsg.textContent = 'No assignments found for this project';
                            table.replaceWith(noAssignmentsMsg);
                        }
                    }
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

// Add this function to handle market search setup
window.setupMarketSearch = function(inputId) {
    const marketInput = document.getElementById(inputId);
    const searchResults = document.createElement('div');
    searchResults.id = `${inputId}-search-results`;
    searchResults.className = 'search-results-dropdown';
    marketInput.parentNode.appendChild(searchResults);

    marketInput.addEventListener('input', function(e) {
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
                    <div class="search-result-item" onclick="window.selectMarket('${market.name}', '${inputId}')">
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
        if (!marketInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('active');
        }
    });
};

window.selectMarket = function(marketName, inputId) {
    document.getElementById(inputId).value = marketName;
    document.getElementById(`${inputId}-search-results`).classList.remove('active');
};

window.editProject = function(id) {
    const project = window.projects[id];
    if (!project) return;

    const modal = document.getElementById('editModal');
    modal.style.display = 'flex';
    currentEditId = id;

    // Populate form fields
    document.getElementById('editProjectId').value = id;
    document.getElementById('editProjectName').value = project.name;
    document.getElementById('editProjectDays').value = project.days;
    document.getElementById('editProjectMarket').value = project.market;
    document.getElementById('editProjectColor').value = project.color || '#4CAF50';

    // Remove any existing click handler
    const saveBtn = document.getElementById('saveProjectEdit');
    saveBtn.replaceWith(saveBtn.cloneNode(true));

    // Add new click handler
    document.getElementById('saveProjectEdit').onclick = function() {
        const newProjectId = document.getElementById('editProjectId').value;
        const updatedProject = {
            name: document.getElementById('editProjectName').value,
            days: parseInt(document.getElementById('editProjectDays').value),
            market: document.getElementById('editProjectMarket').value,
            color: document.getElementById('editProjectColor').value,
            dateAdded: project.dateAdded
        };

        if (!updatedProject.name || !updatedProject.days || !updatedProject.market) {
            alert('Please fill in all required fields');
            return;
        }

        // Only check for ID conflict if we're actually changing the ID
        if (newProjectId !== currentEditId) {
            if (window.projects[newProjectId]) {
                alert('A project with this ID already exists');
                document.getElementById('editProjectId').value = currentEditId;
                return;
            }

            // Update all assignments that reference this project
            if (window.scheduleData) {
                window.scheduleData.forEach(assignment => {
                    if (assignment.projectId === currentEditId) {
                        assignment.projectId = newProjectId;
                        assignment.projectName = updatedProject.name;
                    }
                });
            }

            // Remove old project entry
            delete window.projects[currentEditId];
        }

        // Save project with new or existing ID
        window.projects[newProjectId] = updatedProject;  // Remove the spread and explicit color set

        window.saveData();
        window.renderProjects();
        modal.style.display = 'none';
        
        // Trigger calendar update
        window.dispatchEvent(new Event('colorPreferenceChanged'));
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
