/**
 * ============================================================================
 * 🔄 Check Version & Auto-Update UI Component
 * ============================================================================
 * Functional button to check version and install updates without reinstalling EXE
 */

class CheckVersionButton {
    constructor() {
        this.currentVersion = null;
        this.latestVersion = null;
        this.hasUpdate = false;
        this.isChecking = false;
        this.isUpdating = false;
        
        this.init();
    }
    
    init() {
        // Create floating button
        this.createButton();
        
        // Check version on load
        setTimeout(() => this.checkVersion(true), 3000);
        
        // Periodic check (every 30 minutes)
        setInterval(() => this.checkVersion(true), 30 * 60 * 1000);
    }
    
    createButton() {
        const btn = document.createElement('button');
        btn.className = 'check-version-btn';
        btn.title = 'Check for Updates';
        btn.innerHTML = `
            <svg class="icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>
            </svg>
        `;
        
        btn.addEventListener('click', () => this.handleClick());
        
        document.body.appendChild(btn);
        this.button = btn;
    }
    
    async handleClick() {
        if (this.isChecking || this.isUpdating) return;
        
        if (this.hasUpdate) {
            // Show update dialog
            this.showUpdateDialog();
        } else {
            // Check for updates
            await this.checkVersion(false);
        }
    }
    
    async checkVersion(silent = false) {
        if (this.isChecking) return;
        
        this.isChecking = true;
        this.button.style.animation = 'rotate 1s linear infinite';
        
        try {
            const response = await fetch('/api/update/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            
            if (data.success && data.result) {
                const result = data.result;
                
                this.currentVersion = result.current_version;
                this.latestVersion = result.latest_version || result.current_version;
                this.hasUpdate = result.status === 'update_available';
                
                if (this.hasUpdate) {
                    this.button.classList.add('has-update');
                    this.manifest = result.manifest;
                    
                    if (!silent) {
                        this.showUpdateDialog();
                    }
                } else {
                    this.button.classList.remove('has-update');
                    
                    if (!silent) {
                        this.showToast('✅ អ្នកកំពុងប្រើ Version ថ្មីបំផុត', 'success');
                    }
                }
            }
        } catch (error) {
            console.error('Version check failed:', error);
            if (!silent) {
                this.showToast('❌ មិនអាច Check Version បានទេ', 'error');
            }
        } finally {
            this.isChecking = false;
            this.button.style.animation = '';
        }
    }
    
    showUpdateDialog() {
        const changelog = this.manifest?.changelog?.[0] || {};
        const changes = changelog.changes || [];
        
        const modal = this.createGlassModal({
            title: '🎉 Update ថ្មីមានហើយ!',
            content: `
                <div style="margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <div>
                            <div class="glass-text-muted" style="font-size: 12px;">Version បច្ចុប្បន្ន</div>
                            <div style="font-size: 20px; font-weight: 600; color: var(--accent-info);">${this.currentVersion}</div>
                        </div>
                        <div style="font-size: 32px; opacity: 0.5;">→</div>
                        <div>
                            <div class="glass-text-muted" style="font-size: 12px;">Version ថ្មី</div>
                            <div style="font-size: 20px; font-weight: 600; color: var(--accent-success);">${this.latestVersion}</div>
                        </div>
                    </div>
                    
                    ${changes.length > 0 ? `
                        <div class="glass-card" style="padding: 16px; margin-top: 16px;">
                            <div style="font-weight: 600; margin-bottom: 12px; color: var(--text-primary);">
                                📝 អ្វីថ្មី:
                            </div>
                            ${changes.map(change => `
                                <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px;">
                                    <span class="glass-badge glass-badge-${this.getChangeBadgeType(change.type)}">
                                        ${change.type}
                                    </span>
                                    <span style="flex: 1; color: var(--text-secondary);">${change.text}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div style="margin-top: 20px; padding: 16px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <svg width="24" height="24" fill="currentColor" style="color: var(--accent-info);">
                                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <div style="flex: 1; font-size: 13px; color: var(--text-secondary);">
                                <strong>ចំណាំ:</strong> Update នេះនឹង download និង install ដោយស្វ័យប្រវត្តិ។ មិនចាំបាច់ reinstall EXE ថ្មីទេ! Features ថ្មីៗនឹងអាចប្រើបានភ្លាមៗ។
                            </div>
                        </div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: '📥 Download & Install',
                    className: 'glass-btn glass-btn-primary',
                    onClick: () => {
                        modal.remove();
                        this.downloadAndInstall();
                    }
                },
                {
                    text: 'ពេលក្រោយ',
                    className: 'glass-btn',
                    onClick: () => modal.remove()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
    
    getChangeBadgeType(type) {
        const typeMap = {
            'NEW': 'primary',
            'IMPROVED': 'success',
            'FIXED': 'warning',
            'SECURITY': 'error'
        };
        return typeMap[type] || 'info';
    }
    
    async downloadAndInstall() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        // Create progress modal
        const progressModal = this.createProgressModal();
        document.body.appendChild(progressModal);
        
        try {
            // Step 1: Download
            this.updateProgressModal(progressModal, 0, '📥 កំពុង Download Update...');
            
            const downloadResp = await fetch('/api/update/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const downloadData = await downloadResp.json();
            
            if (!downloadData.success) {
                throw new Error(downloadData.message || 'Download failed');
            }
            
            this.updateProgressModal(progressModal, 50, '✅ Download ជោគជ័យ!');
            await this.sleep(500);
            
            // Step 2: Install
            this.updateProgressModal(progressModal, 60, '📦 កំពុង Install Update...');
            
            const installResp = await fetch('/api/update/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const installData = await installResp.json();
            
            if (installData.success) {
                this.updateProgressModal(progressModal, 100, '✅ Install ជោគជ័យ!');
                
                await this.sleep(1000);
                
                // Success!
                progressModal.remove();
                this.hasUpdate = false;
                this.button.classList.remove('has-update');
                
                this.showSuccessDialog(installData.result?.version || this.latestVersion);
                
                // Reload modules
                await fetch('/api/modules/reload-all', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
            } else {
                throw new Error(installData.message || 'Installation failed');
            }
            
        } catch (error) {
            console.error('Update failed:', error);
            progressModal.remove();
            this.showToast('❌ Update បរាជ័យ: ' + error.message, 'error');
        } finally {
            this.isUpdating = false;
        }
    }
    
    createProgressModal() {
        const modal = document.createElement('div');
        modal.className = 'glass-modal-overlay';
        modal.innerHTML = `
            <div class="glass-modal" style="max-width: 500px;">
                <div class="glass-modal-header">
                    <div class="glass-modal-title">🔄 កំពុង Update...</div>
                </div>
                <div class="glass-modal-body">
                    <div class="progress-content">
                        <div class="progress-message" style="font-size: 16px; margin-bottom: 16px; color: var(--text-primary); text-align: center;">
                            Initializing...
                        </div>
                        <div class="glass-progress">
                            <div class="glass-progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="progress-percent" style="text-align: center; margin-top: 12px; font-size: 24px; font-weight: 600; color: var(--accent-primary);">
                            0%
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }
    
    updateProgressModal(modal, progress, message) {
        const fill = modal.querySelector('.glass-progress-fill');
        const percentText = modal.querySelector('.progress-percent');
        const messageText = modal.querySelector('.progress-message');
        
        if (fill) fill.style.width = `${progress}%`;
        if (percentText) percentText.textContent = `${Math.round(progress)}%`;
        if (messageText) messageText.textContent = message;
    }
    
    showSuccessDialog(version) {
        const modal = this.createGlassModal({
            title: '🎉 Update ជោគជ័យ!',
            content: `
                <div style="text-align: center; padding: 24px 0;">
                    <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
                    <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">
                        បាន Update ទៅ Version ${version} ជោគជ័យ!
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 24px;">
                        Features និង Functions ថ្មីៗមានប្រើប្រាស់ហើយភ្លាមៗ!<br>
                        មិនចាំបាច់ restart app ទេ។
                    </div>
                    <div class="glass-card" style="padding: 16px; text-align: left;">
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">
                            💡 អ្វីដែលបានធ្វើ:
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            ✅ Download update files<br>
                            ✅ Backup previous version<br>
                            ✅ Install new files<br>
                            ✅ Reload modules
                        </div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: '👍 យល់ហើយ',
                    className: 'glass-btn glass-btn-success',
                    onClick: () => modal.remove()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
    
    createGlassModal({ title, content, actions = [] }) {
        const modal = document.createElement('div');
        modal.className = 'glass-modal-overlay';
        modal.innerHTML = `
            <div class="glass-modal">
                <div class="glass-modal-header">
                    <div class="glass-modal-title">${title}</div>
                    <button class="glass-modal-close">×</button>
                </div>
                <div class="glass-modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="glass-modal-footer">
                        ${actions.map((action, idx) => `
                            <button class="${action.className}" data-action="${idx}">
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Close button handler
        const closeBtn = modal.querySelector('.glass-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.remove());
        }
        
        // Action button handlers
        actions.forEach((action, idx) => {
            const btn = modal.querySelector(`[data-action="${idx}"]`);
            if (btn && action.onClick) {
                btn.addEventListener('click', action.onClick);
            }
        });
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        return modal;
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'glass-card';
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            padding: 16px 24px;
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;
        
        const colors = {
            success: 'var(--accent-success)',
            error: 'var(--accent-error)',
            warning: 'var(--accent-warning)',
            info: 'var(--accent-info)'
        };
        
        toast.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize on page load
let checkVersionButton;
document.addEventListener('DOMContentLoaded', () => {
    checkVersionButton = new CheckVersionButton();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
