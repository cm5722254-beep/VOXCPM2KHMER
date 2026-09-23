/**
 * ============================================================================
 * 🔄 Auto-Update Manager - Client Side
 * ============================================================================
 * Handles update checking, downloading, and installation UI
 */

class UpdateManager {
    constructor() {
        this.container = null;
        this.currentNotification = null;
        this.checkInterval = null;
        this.isChecking = false;
        this.isDownloading = false;
        this.isInstalling = false;
        
        this.init();
    }
    
    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.className = 'update-notification-container';
        document.body.appendChild(this.container);
        
        // Start periodic update checks (every hour)
        this.startAutoCheck(3600000); // 1 hour
        
        // Check immediately on page load
        setTimeout(() => this.checkForUpdates(), 3000);
    }
    
    startAutoCheck(interval = 3600000) {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        this.checkInterval = setInterval(() => {
            this.checkForUpdates(true); // Silent check
        }, interval);
    }
    
    stopAutoCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    
    async checkForUpdates(silent = false) {
        if (this.isChecking) return;
        
        this.isChecking = true;
        
        try {
            const response = await fetch('/api/update/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success && data.result) {
                const result = data.result;
                
                if (result.status === 'update_available') {
                    this.showUpdateAvailableNotification(result);
                } else if (!silent && result.status === 'up_to_date') {
                    this.showNotification({
                        type: 'success',
                        title: '✅ អ្នកប្រើប្រាស់ Version ថ្មីបំផុត',
                        message: `Current Version: ${result.current_version}`,
                        autoClose: 5000
                    });
                }
            }
        } catch (error) {
            console.error('Update check failed:', error);
            if (!silent) {
                this.showNotification({
                    type: 'error',
                    title: '❌ មិនអាច Check Update បានទេ',
                    message: error.message,
                    autoClose: 5000
                });
            }
        } finally {
            this.isChecking = false;
        }
    }
    
    showUpdateAvailableNotification(updateInfo) {
        const manifest = updateInfo.manifest || {};
        const changelog = manifest.changelog || [];
        const latestChange = changelog[0] || {};
        const changes = latestChange.changes || [];
        
        const notification = this.createNotification({
            type: 'info',
            title: '🎉 Update ថ្មីមានហើយ!',
            closable: true,
            content: `
                <div class="update-notification-version">
                    Version ថ្មី: <strong>${updateInfo.latest_version}</strong>
                    <br>
                    Version បច្ចុប្បន្ន: <strong>${updateInfo.current_version}</strong>
                </div>
                
                ${changes.length > 0 ? `
                    <div class="update-changelog">
                        ${changes.map(change => `
                            <div class="update-changelog-item">
                                <span class="update-changelog-badge ${change.type.toLowerCase()}">${change.type}</span>
                                <span>${change.text}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="update-notification-actions">
                    <button class="update-btn update-btn-primary" onclick="updateManager.downloadAndInstall()">
                        <span>📥</span>
                        <span>Download & Install</span>
                    </button>
                    <button class="update-btn update-btn-secondary" onclick="updateManager.dismissNotification()">
                        ពេលក្រោយ
                    </button>
                </div>
            `
        });
        
        this.currentNotification = notification;
    }
    
    async downloadAndInstall() {
        if (this.isDownloading || this.isInstalling) return;
        
        try {
            // Step 1: Download
            this.isDownloading = true;
            this.showProgressNotification('📥 កំពុង Download Update...', 0);
            
            const downloadResponse = await fetch('/api/update/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const downloadData = await downloadResponse.json();
            
            if (!downloadData.success) {
                throw new Error(downloadData.message || 'Download failed');
            }
            
            this.updateProgress('📥 Download បានជោគជ័យ!', 50);
            
            // Step 2: Install
            this.isDownloading = false;
            this.isInstalling = true;
            this.updateProgress('📦 កំពុង Install Update...', 60);
            
            const installResponse = await fetch('/api/update/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const installData = await installResponse.json();
            
            if (installData.success) {
                this.updateProgress('✅ Install ជោគជ័យ!', 100);
                
                setTimeout(() => {
                    this.showNotification({
                        type: 'success',
                        title: '🎉 Update ជោគជ័យ!',
                        message: `Version ${installData.result.version} បានដំឡើងរួចរាល់! Features ថ្មីៗមានប្រើប្រាស់ហើយ។`,
                        autoClose: 8000
                    });
                    
                    // Reload modules without restarting app
                    this.reloadModules();
                }, 1000);
            } else {
                throw new Error(installData.message || 'Installation failed');
            }
            
        } catch (error) {
            console.error('Update failed:', error);
            this.showNotification({
                type: 'error',
                title: '❌ Update បរាជ័យ',
                message: error.message,
                autoClose: 5000
            });
        } finally {
            this.isDownloading = false;
            this.isInstalling = false;
        }
    }
    
    async reloadModules() {
        try {
            const response = await fetch('/api/modules/reload-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            console.log('Modules reloaded:', data);
        } catch (error) {
            console.error('Module reload failed:', error);
        }
    }
    
    async rollbackUpdate() {
        if (this.isDownloading || this.isInstalling) {
            this.showNotification({
                type: 'error',
                title: '❌ មិនអាច Rollback បានទេ',
                message: 'Update កំពុងដំណើរការ សូមរង់ចាំឱ្យបញ្ចប់ជាមុនសិន',
                autoClose: 5000
            });
            return;
        }
        
        const confirmed = confirm('តើអ្នកប្រាកដជាចង់ Rollback ទៅ Version មុនមែនទេ?\n\nវានឹង restore files ទាំងអស់ពី backup ចុងក្រោយបំផុត។');
        if (!confirmed) return;
        
        try {
            this.showProgressNotification('⏮️ កំពុង Rollback...', 0);
            
            const response = await fetch('/api/update/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateProgress('✅ Rollback ជោគជ័យ!', 100);
                
                setTimeout(() => {
                    this.showNotification({
                        type: 'success',
                        title: '✅ Rollback ជោគជ័យ!',
                        message: `បាន restore ${data.result.restored_files?.length || 0} files ពី backup "${data.result.backup}"`,
                        autoClose: 8000
                    });
                    
                    // Reload modules after rollback
                    this.reloadModules();
                }, 1000);
            } else {
                throw new Error(data.message || 'Rollback failed');
            }
        } catch (error) {
            console.error('Rollback failed:', error);
            this.showNotification({
                type: 'error',
                title: '❌ Rollback បរាជ័យ',
                message: error.message,
                autoClose: 5000
            });
        }
    }
    
    async listBackups() {
        try {
            const response = await fetch('/api/update/backups', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showBackupsDialog(data.backups || []);
            }
        } catch (error) {
            console.error('Failed to list backups:', error);
            this.showNotification({
                type: 'error',
                title: '❌ មិនអាចទាញយក Backup List បានទេ',
                message: error.message,
                autoClose: 5000
            });
        }
    }
    
    showBackupsDialog(backups) {
        if (backups.length === 0) {
            this.showNotification({
                type: 'info',
                title: 'ℹ️ គ្មាន Backup',
                message: 'មិនមាន Backup ណាមួយទេ',
                autoClose: 3000
            });
            return;
        }
        
        const backupsList = backups.map((backup, index) => `
            <div style="padding: 8px; background: rgba(255,255,255,0.1); border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${backup.name}</strong>
                        <br>
                        <small style="opacity: 0.8;">${backup.date || 'Unknown date'}</small>
                    </div>
                    <button 
                        class="update-btn update-btn-secondary" 
                        style="padding: 6px 12px; font-size: 12px;"
                        onclick="updateManager.restoreSpecificBackup('${backup.name}')">
                        Restore
                    </button>
                </div>
            </div>
        `).join('');
        
        const notification = this.createNotification({
            type: 'info',
            title: '💾 Available Backups',
            closable: true,
            content: `
                <div style="max-height: 300px; overflow-y: auto;">
                    ${backupsList}
                </div>
            `
        });
    }
    
    async restoreSpecificBackup(backupName) {
        const confirmed = confirm(`តើអ្នកប្រាកដជាចង់ restore ពី backup "${backupName}" មែនទេ?`);
        if (!confirmed) return;
        
        try {
            this.dismissNotification();
            this.showProgressNotification('⏮️ កំពុង Restore...', 0);
            
            const response = await fetch('/api/update/rollback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ backup_name: backupName })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.updateProgress('✅ Restore ជោគជ័យ!', 100);
                
                setTimeout(() => {
                    this.showNotification({
                        type: 'success',
                        title: '✅ Restore ជោគជ័យ!',
                        message: `បាន restore ${data.result.restored_files?.length || 0} files`,
                        autoClose: 5000
                    });
                    
                    this.reloadModules();
                }, 1000);
            } else {
                throw new Error(data.message || 'Restore failed');
            }
        } catch (error) {
            console.error('Restore failed:', error);
            this.showNotification({
                type: 'error',
                title: '❌ Restore បរាជ័យ',
                message: error.message,
                autoClose: 5000
            });
        }
    }
    
    showProgressNotification(message, progress) {
        this.dismissNotification();
        
        const notification = this.createNotification({
            type: 'info',
            title: message,
            closable: false,
            content: `
                <div class="update-progress-container">
                    <div class="update-progress-label">
                        <span>Progress</span>
                        <span>${Math.round(progress)}%</span>
                    </div>
                    <div class="update-progress-bar">
                        <div class="update-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            `
        });
        
        this.currentNotification = notification;
    }
    
    updateProgress(message, progress) {
        if (this.currentNotification) {
            const title = this.currentNotification.querySelector('.update-notification-title span:last-child');
            if (title) {
                title.textContent = message;
            }
            
            const progressFill = this.currentNotification.querySelector('.update-progress-fill');
            const progressText = this.currentNotification.querySelector('.update-progress-label span:last-child');
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${Math.round(progress)}%`;
            }
        }
    }
    
    showNotification({ type = 'info', title, message, autoClose = 0 }) {
        const notification = this.createNotification({
            type,
            title,
            closable: true,
            content: `<div style="font-size: 14px; opacity: 0.9;">${message}</div>`
        });
        
        if (autoClose > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, autoClose);
        }
    }
    
    createNotification({ type, title, content, closable = true }) {
        const notification = document.createElement('div');
        notification.className = `update-notification ${type}`;
        
        notification.innerHTML = `
            <div class="update-notification-header">
                <div class="update-notification-title">
                    <span class="update-notification-icon">🔄</span>
                    <span>${title}</span>
                </div>
                ${closable ? `
                    <button class="update-notification-close" onclick="updateManager.removeNotification(this.closest('.update-notification'))">
                        ×
                    </button>
                ` : ''}
            </div>
            <div class="update-notification-body">
                ${content}
            </div>
        `;
        
        this.container.appendChild(notification);
        return notification;
    }
    
    dismissNotification() {
        if (this.currentNotification) {
            this.removeNotification(this.currentNotification);
            this.currentNotification = null;
        }
    }
    
    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }
}

// Initialize update manager
let updateManager;
document.addEventListener('DOMContentLoaded', () => {
    updateManager = new UpdateManager();
});
