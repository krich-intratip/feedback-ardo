// ========================================
// Auto-save CSV Feature
// File System Access API
// ========================================

let autoSaveEnabled = false;
let directoryHandle = null;
let autoSaveConfig = {
    enabled: false,
    directoryName: null
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    loadAutoSaveConfig();
    restoreAutoSave();
    updateAutoSaveUI();
});

// ========================================
// CONFIGURATION MANAGEMENT
// ========================================
function loadAutoSaveConfig() {
    const stored = localStorage.getItem('autoSaveConfig');
    if (stored) {
        try {
            autoSaveConfig = JSON.parse(stored);
            autoSaveEnabled = autoSaveConfig.enabled;
        } catch (e) {
            autoSaveConfig = { enabled: false, directoryName: null };
        }
    }
}

function saveAutoSaveConfig() {
    localStorage.setItem('autoSaveConfig', JSON.stringify(autoSaveConfig));
}

// ========================================
// UI UPDATES
// ========================================
function updateAutoSaveUI() {
    const toggleBtn = document.getElementById('autoSaveToggle');
    const statusText = document.getElementById('autoSaveStatus');
    const statusMobile = document.getElementById('autoSaveStatusMobile');
    const icon = document.getElementById('autoSaveIcon');

    if (!toggleBtn) return;

    if (autoSaveEnabled && directoryHandle) {
        toggleBtn.classList.add('active');
        if (statusText) statusText.textContent = 'Auto-save: ON';
        if (statusMobile) statusMobile.textContent = 'ON';
        if (icon) icon.textContent = '💾';
    } else {
        toggleBtn.classList.remove('active');
        if (statusText) statusText.textContent = 'Auto-save: OFF';
        if (statusMobile) statusMobile.textContent = 'OFF';
        if (icon) icon.textContent = '💾';
    }
}

// ========================================
// TOGGLE AUTO-SAVE
// ========================================
async function toggleAutoSave() {
    if (!('showDirectoryPicker' in window)) {
        showToast('เบราว์เซอร์ของคุณไม่รองรับ Auto-save', 'error');
        return;
    }

    if (autoSaveEnabled) {
        // Disable auto-save
        autoSaveEnabled = false;
        directoryHandle = null;
        autoSaveConfig.enabled = false;
        autoSaveConfig.directoryName = null;
        saveAutoSaveConfig();
        updateAutoSaveUI();
        showToast('ปิด Auto-save แล้ว', 'info');
    } else {
        // Enable auto-save - request directory
        try {
            directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'documents'
            });

            autoSaveEnabled = true;
            autoSaveConfig.enabled = true;
            autoSaveConfig.directoryName = directoryHandle.name;
            saveAutoSaveConfig();
            updateAutoSaveUI();

            showToast(`เปิด Auto-save: ${directoryHandle.name}`, 'success');
        } catch (error) {
            if (error.name === 'AbortError') {
                showToast('ยกเลิกการเลือกโฟลเดอร์', 'info');
            } else {
                console.error('Directory picker error:', error);
                showToast('ไม่สามารถเข้าถึงโฟลเดอร์ได้', 'error');
            }
        }
    }
}

// ========================================
// AUTO-SAVE CSV FUNCTION
// ========================================
async function autoSaveToCSV(record) {
    if (!autoSaveEnabled || !directoryHandle) {
        return;
    }

    try {
        // Verify permission
        const permission = await verifyPermission(directoryHandle);
        if (!permission) {
            autoSaveEnabled = false;
            autoSaveConfig.enabled = false;
            saveAutoSaveConfig();
            updateAutoSaveUI();
            showToast('ไม่มีสิทธิ์เข้าถึงโฟลเดอร์', 'error');
            return;
        }

        // Check if generateCSVContent function exists
        if (typeof window.generateCSVContent !== 'function') {
            console.error('generateCSVContent function not found');
            showToast('เกิดข้อผิดพลาดในการสร้าง CSV', 'error');
            return;
        }

        // Generate CSV content for all records
        const csvContent = window.generateCSVContent();

        // Create filename with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `feedback-autosave-${timestamp}.csv`;

        // Create or overwrite file
        const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();

        // Write with UTF-8 BOM
        const BOM = '\uFEFF';
        await writable.write(BOM + csvContent);
        await writable.close();

        // Show indicator
        showAutoSaveIndicator(`บันทึกไปที่: ${filename}`);

    } catch (error) {
        console.error('Auto-save error:', error);

        if (error.name === 'NotAllowedError') {
            autoSaveEnabled = false;
            autoSaveConfig.enabled = false;
            saveAutoSaveConfig();
            updateAutoSaveUI();
            showToast('ไม่มีสิทธิ์เข้าถึงโฟลเดอร์', 'error');
        } else {
            showToast('Auto-save ล้มเหลว', 'error');
        }
    }
}

// ========================================
// VERIFY DIRECTORY PERMISSION
// ========================================
async function verifyPermission(directoryHandle) {
    const options = { mode: 'readwrite' };

    // Check if permission already granted
    if ((await directoryHandle.queryPermission(options)) === 'granted') {
        return true;
    }

    // Request permission
    if ((await directoryHandle.requestPermission(options)) === 'granted') {
        return true;
    }

    return false;
}

// ========================================
// SHOW AUTO-SAVE INDICATOR
// ========================================
function showAutoSaveIndicator(message) {
    const indicator = document.getElementById('autosaveIndicator');
    const text = document.getElementById('autosaveText');

    if (!indicator || !text) return;

    text.textContent = message;
    indicator.classList.add('show');

    setTimeout(() => {
        indicator.classList.remove('show');
    }, 3000);
}

// ========================================
// RESTORE AUTO-SAVE ON PAGE LOAD
// ========================================
function restoreAutoSave() {
    if (!autoSaveConfig.enabled || !autoSaveConfig.directoryName) {
        return;
    }

    // Try to restore directory handle (not possible with current API)
    // User must re-select directory after page reload
    // This is a limitation of the File System Access API for security

    // Reset to off state
    autoSaveEnabled = false;
    directoryHandle = null;
    updateAutoSaveUI();
}

// ========================================
// EXPORT FOR USE IN app.js
// ========================================
window.toggleAutoSave = toggleAutoSave;
window.autoSaveToCSV = autoSaveToCSV;
