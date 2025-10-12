// ===========================
// SignalDegen - Notification System
// Push Notifications for Signals & Alerts
// ===========================

class NotificationManager {
    constructor() {
        this.permission = Notification.permission || 'default';
        this.settings = this.loadSettings();
        this.alertHistory = this.loadHistory();
        this.priceAlerts = this.loadPriceAlerts();
        this.lastNotifications = this.loadLastNotifications();
        this.notificationSound = null;

        // Check if permission was already requested
        if (this.permission === 'default' && !this.settings.lastPermissionRequest) {
            // Show permission modal on first visit
            setTimeout(() => this.showPermissionModal(), 2000);
        }

        this.initSound();
    }

    // ===========================
    // Settings Management
    // ===========================
    loadSettings() {
        try {
            const stored = localStorage.getItem('signaldegen_notification_settings');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load notification settings:', e);
        }

        // Default settings
        return {
            enabled: true,
            strongBuy: true,
            priceAlerts: false,
            topGainers: false,
            topLosers: false,
            sound: true,
            gainersThreshold: 20,
            losersThreshold: -20,
            lastPermissionRequest: null
        };
    }

    saveSettings() {
        try {
            localStorage.setItem('signaldegen_notification_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save notification settings:', e);
        }
    }

    // ===========================
    // Price Alerts Management
    // ===========================
    loadPriceAlerts() {
        try {
            const stored = localStorage.getItem('signaldegen_price_alerts');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load price alerts:', e);
        }
        return [];
    }

    savePriceAlerts() {
        try {
            localStorage.setItem('signaldegen_price_alerts', JSON.stringify(this.priceAlerts));
        } catch (e) {
            console.error('Failed to save price alerts:', e);
        }
    }

    addPriceAlert(coin, condition, targetPrice) {
        const alert = {
            id: Date.now().toString(),
            coin: coin,
            condition: condition, // 'above' or 'below'
            targetPrice: parseFloat(targetPrice),
            created: Date.now()
        };

        this.priceAlerts.push(alert);
        this.savePriceAlerts();

        const lang = this.getLang();
        const message = lang === 'pt'
            ? `Alerta criado: ${coin} ${condition === 'above' ? 'acima de' : 'abaixo de'} $${targetPrice}`
            : `Alert created: ${coin} ${condition} $${targetPrice}`;

        this.showToast(message, 'success');

        return alert;
    }

    removePriceAlert(id) {
        this.priceAlerts = this.priceAlerts.filter(alert => alert.id !== id);
        this.savePriceAlerts();

        const lang = this.getLang();
        const message = lang === 'pt' ? 'Alerta removido' : 'Alert removed';
        this.showToast(message, 'info');
    }

    // ===========================
    // History Management
    // ===========================
    loadHistory() {
        try {
            const stored = localStorage.getItem('signaldegen_notification_history');
            if (stored) {
                const history = JSON.parse(stored);
                // Keep only last 50 notifications
                return history.slice(-50);
            }
        } catch (e) {
            console.warn('Failed to load notification history:', e);
        }
        return [];
    }

    saveHistory() {
        try {
            localStorage.setItem('signaldegen_notification_history', JSON.stringify(this.alertHistory));
        } catch (e) {
            console.error('Failed to save notification history:', e);
        }
    }

    addToHistory(type, message, data = {}) {
        const entry = {
            time: Date.now(),
            type: type,
            message: message,
            data: data
        };

        this.alertHistory.push(entry);

        // Keep only last 50
        if (this.alertHistory.length > 50) {
            this.alertHistory = this.alertHistory.slice(-50);
        }

        this.saveHistory();
    }

    clearHistory() {
        this.alertHistory = [];
        this.saveHistory();

        const lang = this.getLang();
        const message = lang === 'pt' ? 'Histórico limpo' : 'History cleared';
        this.showToast(message, 'info');
    }

    // ===========================
    // Last Notifications (Anti-Spam)
    // ===========================
    loadLastNotifications() {
        try {
            const stored = localStorage.getItem('signaldegen_last_notifications');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Failed to load last notifications:', e);
        }
        return {};
    }

    saveLastNotifications() {
        try {
            localStorage.setItem('signaldegen_last_notifications', JSON.stringify(this.lastNotifications));
        } catch (e) {
            console.error('Failed to save last notifications:', e);
        }
    }

    canSendNotification(tag, cooldownMinutes = 60) {
        const lastTime = this.lastNotifications[tag];
        if (!lastTime) return true;

        const now = Date.now();
        const diff = now - lastTime;
        const cooldown = cooldownMinutes * 60 * 1000;

        return diff >= cooldown;
    }

    markNotificationSent(tag) {
        this.lastNotifications[tag] = Date.now();
        this.saveLastNotifications();
    }

    // ===========================
    // Permission Management
    // ===========================
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        try {
            this.permission = await Notification.requestPermission();

            if (this.permission === 'granted') {
                const lang = this.getLang();
                const message = lang === 'pt'
                    ? '✅ Notificações ativadas!'
                    : '✅ Notifications enabled!';
                this.showToast(message, 'success');

                // Send test notification
                this.sendTestNotification();
            } else if (this.permission === 'denied') {
                const lang = this.getLang();
                const message = lang === 'pt'
                    ? '❌ Notificações bloqueadas pelo navegador'
                    : '❌ Notifications blocked by browser';
                this.showToast(message, 'error');
            }

            this.settings.lastPermissionRequest = Date.now();
            this.saveSettings();

            return this.permission === 'granted';
        } catch (error) {
            console.error('Permission request error:', error);
            return false;
        }
    }

    checkPermission() {
        return this.permission === 'granted';
    }

    // ===========================
    // Notification Display
    // ===========================
    sendNotification(title, body, tag, icon = '🚀') {
        if (!this.settings.enabled) return;
        if (!this.checkPermission()) return;

        try {
            const notification = new Notification(title, {
                body: body,
                icon: '/icon-192.png', // Add this icon later
                badge: '/badge-72.png',
                tag: tag,
                requireInteraction: false,
                vibrate: [200, 100, 200],
                silent: !this.settings.sound
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Play sound
            if (this.settings.sound) {
                this.playNotificationSound();
            }

            // Handle click
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (error) {
            console.error('Failed to send notification:', error);
            return null;
        }
    }

    sendTestNotification() {
        const lang = this.getLang();
        const title = 'SignalDegen 🚀';
        const body = lang === 'pt'
            ? 'Notificações configuradas com sucesso!'
            : 'Notifications configured successfully!';

        this.sendNotification(title, body, 'test-notification');
    }

    // ===========================
    // Alert Checkers
    // ===========================
    checkStrongBuyAlerts(signals) {
        if (!this.settings.strongBuy) return;

        signals.forEach(signal => {
            // Check if it's a STRONG BUY with high score
            if (signal.type === 'strong-buy' && signal.score >= 80) {
                const tag = `strong-buy-${signal.pair}`;

                // Check cooldown (1 hour per coin)
                if (!this.canSendNotification(tag, 60)) return;

                const lang = this.getLang();
                const title = lang === 'pt' ? 'SignalDegen 🚀' : 'SignalDegen 🚀';
                const body = lang === 'pt'
                    ? `COMPRA FORTE: ${signal.pair} - Score ${signal.score}`
                    : `STRONG BUY: ${signal.pair} - Score ${signal.score}`;

                this.sendNotification(title, body, tag);
                this.markNotificationSent(tag);
                this.addToHistory('strong_buy', body, signal);
            }
        });
    }

    checkPriceAlerts(prices) {
        if (!this.settings.priceAlerts) return;
        if (this.priceAlerts.length === 0) return;

        const alertsToRemove = [];

        this.priceAlerts.forEach(alert => {
            const coinId = this.getCoinIdFromPair(alert.coin);
            if (!coinId || !prices[coinId]) return;

            const currentPrice = prices[coinId].usd;
            let triggered = false;

            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                triggered = true;
            } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                triggered = true;
            }

            if (triggered) {
                const lang = this.getLang();
                const title = lang === 'pt' ? 'Alerta de Preço 💰' : 'Price Alert 💰';
                const conditionText = alert.condition === 'above'
                    ? (lang === 'pt' ? 'atingiu' : 'reached')
                    : (lang === 'pt' ? 'caiu para' : 'dropped to');

                const body = `${alert.coin} ${conditionText} $${currentPrice.toFixed(2)}`;

                this.sendNotification(title, body, `price-alert-${alert.id}`);
                this.addToHistory('price_alert', body, alert);

                alertsToRemove.push(alert.id);
            }
        });

        // Remove triggered alerts
        alertsToRemove.forEach(id => this.removePriceAlert(id));
    }

    checkTopGainersAlerts(gainers) {
        if (!this.settings.topGainers) return;

        gainers.forEach(coin => {
            const change = coin.price_change_percentage_24h;

            if (change >= this.settings.gainersThreshold) {
                const tag = `gainer-${coin.id}`;

                // Check cooldown (6 hours per coin)
                if (!this.canSendNotification(tag, 360)) return;

                const lang = this.getLang();
                const title = lang === 'pt' ? 'Top Gainer 🔥' : 'Top Gainer 🔥';
                const body = `${coin.symbol.toUpperCase()} +${change.toFixed(1)}% ${lang === 'pt' ? 'em 24h' : 'in 24h'}`;

                this.sendNotification(title, body, tag);
                this.markNotificationSent(tag);
                this.addToHistory('top_gainer', body, coin);
            }
        });
    }

    checkTopLosersAlerts(losers) {
        if (!this.settings.topLosers) return;

        losers.forEach(coin => {
            const change = coin.price_change_percentage_24h;

            if (change <= this.settings.losersThreshold) {
                const tag = `loser-${coin.id}`;

                // Check cooldown (6 hours per coin)
                if (!this.canSendNotification(tag, 360)) return;

                const lang = this.getLang();
                const title = lang === 'pt' ? 'Top Loser 📉' : 'Top Loser 📉';
                const body = `${coin.symbol.toUpperCase()} ${change.toFixed(1)}% ${lang === 'pt' ? 'em 24h' : 'in 24h'}`;

                this.sendNotification(title, body, tag);
                this.markNotificationSent(tag);
                this.addToHistory('top_loser', body, coin);
            }
        });
    }

    // ===========================
    // UI Components
    // ===========================
    showPermissionModal() {
        if (document.getElementById('notification-permission-modal')) return;

        const lang = this.getLang();
        const texts = this.getTranslations(lang);

        const modal = document.createElement('div');
        modal.id = 'notification-permission-modal';
        modal.className = 'notification-modal-overlay';
        modal.innerHTML = `
            <div class="notification-modal">
                <div class="notification-modal-icon">🔔</div>
                <h2 class="notification-modal-title">${texts.modal.title}</h2>
                <p class="notification-modal-description">${texts.modal.description}</p>
                <div class="notification-modal-buttons">
                    <button class="btn-notification-accept">${texts.modal.accept}</button>
                    <button class="btn-notification-deny">${texts.modal.deny}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Animate in
        setTimeout(() => modal.classList.add('show'), 10);

        // Event listeners
        modal.querySelector('.btn-notification-accept').addEventListener('click', async () => {
            await this.requestPermission();
            this.closeModal(modal);
        });

        modal.querySelector('.btn-notification-deny').addEventListener('click', () => {
            this.settings.lastPermissionRequest = Date.now();
            this.saveSettings();
            this.closeModal(modal);
        });

        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    closeModal(modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }

    showSettingsPanel() {
        if (document.getElementById('notification-settings-panel')) {
            this.closeSettingsPanel();
            return;
        }

        const lang = this.getLang();
        const texts = this.getTranslations(lang);

        const panel = document.createElement('div');
        panel.id = 'notification-settings-panel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-panel-header">
                <h3>${texts.settings.title}</h3>
                <button class="notification-panel-close">✕</button>
            </div>

            <div class="notification-panel-content">
                <!-- Master Toggle -->
                <div class="notification-setting-group">
                    <label class="notification-toggle">
                        <input type="checkbox" id="notif-enabled" ${this.settings.enabled ? 'checked' : ''}>
                        <span class="notification-toggle-slider"></span>
                        <span class="notification-toggle-label">${texts.settings.enabled}</span>
                    </label>
                </div>

                <div class="notification-divider"></div>

                <!-- Alert Types -->
                <h4 class="notification-section-title">${texts.settings.alertTypes}</h4>

                <label class="notification-toggle">
                    <input type="checkbox" id="notif-strong-buy" ${this.settings.strongBuy ? 'checked' : ''}>
                    <span class="notification-toggle-slider"></span>
                    <span class="notification-toggle-label">${texts.settings.strongBuy}</span>
                </label>

                <label class="notification-toggle">
                    <input type="checkbox" id="notif-price-alerts" ${this.settings.priceAlerts ? 'checked' : ''}>
                    <span class="notification-toggle-slider"></span>
                    <span class="notification-toggle-label">${texts.settings.priceAlerts}</span>
                </label>

                <label class="notification-toggle">
                    <input type="checkbox" id="notif-top-gainers" ${this.settings.topGainers ? 'checked' : ''}>
                    <span class="notification-toggle-slider"></span>
                    <span class="notification-toggle-label">${texts.settings.topGainers}</span>
                </label>

                <label class="notification-toggle">
                    <input type="checkbox" id="notif-top-losers" ${this.settings.topLosers ? 'checked' : ''}>
                    <span class="notification-toggle-slider"></span>
                    <span class="notification-toggle-label">${texts.settings.topLosers}</span>
                </label>

                <div class="notification-divider"></div>

                <!-- Price Alerts Creator -->
                <h4 class="notification-section-title">${texts.settings.createAlert}</h4>

                <div class="price-alert-creator">
                    <select id="alert-coin" class="notification-input">
                        <option value="BTC/USDT">BTC/USDT</option>
                        <option value="ETH/USDT">ETH/USDT</option>
                        <option value="SOL/USDT">SOL/USDT</option>
                        <option value="BNB/USDT">BNB/USDT</option>
                        <option value="XRP/USDT">XRP/USDT</option>
                        <option value="ADA/USDT">ADA/USDT</option>
                    </select>

                    <select id="alert-condition" class="notification-input">
                        <option value="above">${texts.settings.above}</option>
                        <option value="below">${texts.settings.below}</option>
                    </select>

                    <input type="number" id="alert-price" class="notification-input" placeholder="${texts.settings.targetPrice}" step="0.01">

                    <button id="add-price-alert" class="btn-add-alert">${texts.settings.addAlert}</button>
                </div>

                <!-- Active Alerts List -->
                <div id="active-alerts-list" class="active-alerts-list">
                    ${this.renderPriceAlertsList(texts)}
                </div>

                <div class="notification-divider"></div>

                <!-- Sound Toggle -->
                <label class="notification-toggle">
                    <input type="checkbox" id="notif-sound" ${this.settings.sound ? 'checked' : ''}>
                    <span class="notification-toggle-slider"></span>
                    <span class="notification-toggle-label">${texts.settings.sound}</span>
                </label>

                <div class="notification-divider"></div>

                <!-- History -->
                <div class="notification-history-header">
                    <h4 class="notification-section-title">${texts.settings.history}</h4>
                    <button id="clear-history-btn" class="btn-clear-history">${texts.settings.clearHistory}</button>
                </div>

                <div id="notification-history" class="notification-history">
                    ${this.renderHistory(texts)}
                </div>
            </div>

            <div class="notification-panel-footer">
                <button id="save-notification-settings" class="btn-save-settings">${texts.settings.save}</button>
            </div>
        `;

        document.body.appendChild(panel);

        // Animate in
        setTimeout(() => panel.classList.add('show'), 10);

        // Event listeners
        this.attachSettingsPanelEvents(panel, texts);
    }

    attachSettingsPanelEvents(panel, texts) {
        // Close button
        panel.querySelector('.notification-panel-close').addEventListener('click', () => {
            this.closeSettingsPanel();
        });

        // Add price alert
        panel.querySelector('#add-price-alert').addEventListener('click', () => {
            const coin = panel.querySelector('#alert-coin').value;
            const condition = panel.querySelector('#alert-condition').value;
            const price = panel.querySelector('#alert-price').value;

            if (!price || price <= 0) {
                this.showToast(texts.settings.invalidPrice, 'error');
                return;
            }

            this.addPriceAlert(coin, condition, price);

            // Refresh list
            panel.querySelector('#active-alerts-list').innerHTML = this.renderPriceAlertsList(texts);
            this.reattachAlertDeleteButtons(panel, texts);

            // Clear input
            panel.querySelector('#alert-price').value = '';
        });

        // Clear history
        panel.querySelector('#clear-history-btn').addEventListener('click', () => {
            this.clearHistory();
            panel.querySelector('#notification-history').innerHTML = this.renderHistory(texts);
        });

        // Save settings
        panel.querySelector('#save-notification-settings').addEventListener('click', () => {
            this.settings.enabled = panel.querySelector('#notif-enabled').checked;
            this.settings.strongBuy = panel.querySelector('#notif-strong-buy').checked;
            this.settings.priceAlerts = panel.querySelector('#notif-price-alerts').checked;
            this.settings.topGainers = panel.querySelector('#notif-top-gainers').checked;
            this.settings.topLosers = panel.querySelector('#notif-top-losers').checked;
            this.settings.sound = panel.querySelector('#notif-sound').checked;

            this.saveSettings();

            const lang = this.getLang();
            const message = lang === 'pt' ? 'Configurações salvas!' : 'Settings saved!';
            this.showToast(message, 'success');

            this.closeSettingsPanel();
        });

        // Attach delete buttons
        this.reattachAlertDeleteButtons(panel, texts);
    }

    reattachAlertDeleteButtons(panel, texts) {
        panel.querySelectorAll('.btn-delete-alert').forEach(btn => {
            btn.addEventListener('click', () => {
                const alertId = btn.getAttribute('data-alert-id');
                this.removePriceAlert(alertId);
                panel.querySelector('#active-alerts-list').innerHTML = this.renderPriceAlertsList(texts);
                this.reattachAlertDeleteButtons(panel, texts);
            });
        });
    }

    closeSettingsPanel() {
        const panel = document.getElementById('notification-settings-panel');
        if (panel) {
            panel.classList.remove('show');
            setTimeout(() => panel.remove(), 300);
        }
    }

    renderPriceAlertsList(texts) {
        if (this.priceAlerts.length === 0) {
            return `<p class="no-alerts">${texts.settings.noAlerts}</p>`;
        }

        return this.priceAlerts.map(alert => `
            <div class="alert-item">
                <div class="alert-info">
                    <strong>${alert.coin}</strong>
                    <span>${alert.condition === 'above' ? '>' : '<'} $${alert.targetPrice.toFixed(2)}</span>
                </div>
                <button class="btn-delete-alert" data-alert-id="${alert.id}">✕</button>
            </div>
        `).join('');
    }

    renderHistory(texts) {
        if (this.alertHistory.length === 0) {
            return `<p class="no-history">${texts.settings.noHistory}</p>`;
        }

        return this.alertHistory.slice().reverse().slice(0, 10).map(entry => {
            const date = new Date(entry.time);
            const timeStr = date.toLocaleTimeString(this.getLang() === 'pt' ? 'pt-BR' : 'en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const icon = {
                'strong_buy': '🚀',
                'price_alert': '💰',
                'top_gainer': '🔥',
                'top_loser': '📉'
            }[entry.type] || '🔔';

            return `
                <div class="history-item">
                    <span class="history-icon">${icon}</span>
                    <div class="history-content">
                        <div class="history-message">${entry.message}</div>
                        <div class="history-time">${timeStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ===========================
    // Floating Button
    // ===========================
    createFloatingButton() {
        if (document.getElementById('notification-floating-btn')) return;

        const button = document.createElement('button');
        button.id = 'notification-floating-btn';
        button.className = 'notification-floating-btn';
        button.innerHTML = '🔔';
        button.title = this.getLang() === 'pt' ? 'Alertas & Notificações' : 'Alerts & Notifications';

        button.addEventListener('click', () => {
            this.showSettingsPanel();
        });

        document.body.appendChild(button);
    }

    // ===========================
    // Helpers
    // ===========================
    getLang() {
        return document.documentElement.lang === 'pt-BR' ? 'pt' : 'en';
    }

    getCoinIdFromPair(pair) {
        const map = {
            'BTC/USDT': 'bitcoin',
            'ETH/USDT': 'ethereum',
            'SOL/USDT': 'solana',
            'BNB/USDT': 'binancecoin',
            'XRP/USDT': 'ripple',
            'ADA/USDT': 'cardano'
        };
        return map[pair];
    }

    initSound() {
        // Create audio element for notification sound
        this.notificationSound = new Audio();
        // Using a simple beep sound (data URI)
        this.notificationSound.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBCx+zPLTgjMGHm7A7+OZRQ0PVK3p7ahWFApLouHyv24jBSaAz/LLfS4HIXjG8NuNPgkVYrjp6qNPEw5Pp+LwsmUdBjqS2vK/cSYGKn/N8teDNQcfa7/t45ZJDg5TrOjrplYVCk2j4PK8aSEFJH3L8tN+MgcfcMPu4JNECQ9Ur+nr';
    }

    playNotificationSound() {
        if (this.notificationSound) {
            this.notificationSound.play().catch(e => console.warn('Could not play sound:', e));
        }
    }

    showToast(message, type = 'info') {
        if (window.SignalDegen && window.SignalDegen.showToast) {
            window.SignalDegen.showToast(message);
        }
    }

    getTranslations(lang) {
        const translations = {
            pt: {
                modal: {
                    title: '🔔 Quer receber alertas?',
                    description: 'Receba notificações quando houver sinais importantes ou oportunidades de alto risco',
                    accept: 'Ativar Alertas',
                    deny: 'Agora Não'
                },
                settings: {
                    title: 'Alertas & Notificações',
                    enabled: 'Ativar Notificações',
                    alertTypes: 'Tipos de Alerta',
                    strongBuy: 'Sinais COMPRA FORTE',
                    priceAlerts: 'Alertas de Preço',
                    topGainers: 'Top Gainers >20%',
                    topLosers: 'Top Losers <-20%',
                    createAlert: 'Criar Alerta de Preço',
                    above: 'Acima de',
                    below: 'Abaixo de',
                    targetPrice: 'Preço alvo',
                    addAlert: 'Adicionar Alerta',
                    sound: 'Som de Notificação',
                    history: 'Histórico',
                    clearHistory: 'Limpar',
                    save: 'Salvar Configurações',
                    noAlerts: 'Nenhum alerta ativo',
                    noHistory: 'Nenhuma notificação ainda',
                    invalidPrice: 'Preço inválido'
                }
            },
            en: {
                modal: {
                    title: '🔔 Want to receive alerts?',
                    description: 'Get notified when there are important signals or high-risk opportunities',
                    accept: 'Enable Alerts',
                    deny: 'Not Now'
                },
                settings: {
                    title: 'Alerts & Notifications',
                    enabled: 'Enable Notifications',
                    alertTypes: 'Alert Types',
                    strongBuy: 'STRONG BUY Signals',
                    priceAlerts: 'Price Alerts',
                    topGainers: 'Top Gainers >20%',
                    topLosers: 'Top Losers <-20%',
                    createAlert: 'Create Price Alert',
                    above: 'Above',
                    below: 'Below',
                    targetPrice: 'Target price',
                    addAlert: 'Add Alert',
                    sound: 'Notification Sound',
                    history: 'History',
                    clearHistory: 'Clear',
                    save: 'Save Settings',
                    noAlerts: 'No active alerts',
                    noHistory: 'No notifications yet',
                    invalidPrice: 'Invalid price'
                }
            }
        };

        return translations[lang];
    }
}

// ===========================
// Initialize & Export
// ===========================
let notificationManager = null;

function initNotifications() {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications');
        return null;
    }

    notificationManager = new NotificationManager();
    notificationManager.createFloatingButton();

    console.log('Notification system initialized');
    return notificationManager;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

// Export for external use
window.NotificationManager = notificationManager;
