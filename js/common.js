// Shared data and utilities - use window to make variables globally accessible
window.scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || [];
window.projects = JSON.parse(localStorage.getItem('projects')) || {};
window.markets = JSON.parse(localStorage.getItem('markets')) || [];
window.employees = JSON.parse(localStorage.getItem('employees')) || {};

window.saveData = function() {
    localStorage.setItem('scheduleData', JSON.stringify(window.scheduleData));
    localStorage.setItem('projects', JSON.stringify(window.projects));
    localStorage.setItem('markets', JSON.stringify(window.markets));
    localStorage.setItem('employees', JSON.stringify(window.employees));
};

// Export all data
window.exportData = function() {
    const data = {
        scheduleData: window.scheduleData,
        projects: window.projects,
        markets: window.markets,
        employees: window.employees,
        ptoColor: localStorage.getItem('ptoColor') || '#ffcdd2', // Add PTO color
        version: "1.0"
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Import data
window.importData = function(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validate data structure
            if (!data.version || !data.scheduleData || !data.projects || !data.markets || !data.employees) {
                throw new Error('Invalid backup file format');
            }

            // Confirm before overwriting
            if (confirm('This will overwrite all existing data. Are you sure you want to continue?')) {
                window.scheduleData = data.scheduleData;
                window.projects = data.projects;
                window.markets = data.markets;
                window.employees = data.employees;
                
                // Save PTO color if it exists in the backup
                if (data.ptoColor) {
                    localStorage.setItem('ptoColor', data.ptoColor);
                }
                
                window.saveData();
                alert('Data imported successfully! The page will now reload.');
                location.reload();
            }
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    };

    reader.readAsText(file);
};

// Other shared functions...

// Add this function to the common.js file
window.getPTOColor = function() {
    return localStorage.getItem('ptoColor') || '#ffcdd2'; // Default color if none set
};

// Add color preference to common.js
window.getColorPreference = function() {
    return localStorage.getItem('calendarColorPreference') || 'employee'; // Default to employee colors
};

window.setColorPreference = function(preference) {
    localStorage.setItem('calendarColorPreference', preference);
    // Trigger calendar update if it exists
    window.dispatchEvent(new Event('colorPreferenceChanged'));
};

// Add these functions to common.js
window.getContinuousBlocks = function() {
    return localStorage.getItem('continuousBlocks') === 'true'; // Default to false if not set
};

window.setContinuousBlocks = function(enabled) {
    localStorage.setItem('continuousBlocks', enabled);
    // Trigger calendar update if it exists
    window.dispatchEvent(new Event('continuousBlocksChanged'));
};
