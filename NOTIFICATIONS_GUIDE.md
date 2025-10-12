# SignalDegen - Push Notifications System Guide

## Overview
Complete browser push notifications system for real-time cryptocurrency alerts.

## 🔔 Features

### 1. Permission Request Modal
On first visit, users see an elegant modal:
- **Title**: 🔔 "Quer receber alertas?" (PT) / "Want to receive alerts?" (EN)
- **Description**: Explains notification purpose
- **Buttons**: "Ativar Alertas" / "Agora Não"
- **Auto-shows**: 2 seconds after page load (only once)
- **Stores**: User preference in localStorage

### 2. Floating Alerts Button 🔔
- **Location**: Bottom-right corner
- **Style**: Purple gradient, 60px diameter
- **Hover**: Lifts and scales
- **Action**: Opens settings panel

### 3. Settings Panel (Slide from Right)
Comprehensive notification configuration panel:

**Master Toggle**
- Enable/Disable all notifications

**Alert Types**
- ☑️ **STRONG BUY Signals** (default ON)
  - Triggered when score ≥ 80
  - Cooldown: 1 hour per coin
- ☑️ **Price Alerts** (default OFF)
  - User-created custom alerts
  - Triggers once, then removes
- ☑️ **Top Gainers >20%** (default OFF)
  - Cooldown: 6 hours per coin
  - Threshold: 20% gain
- ☑️ **Top Losers <-20%** (default OFF)
  - Cooldown: 6 hours per coin
  - Threshold: -20% loss

**Price Alert Creator**
- Select coin (BTC, ETH, SOL, BNB, XRP, ADA)
- Condition: Above / Below
- Target price input
- "Add Alert" button
- List of active alerts with delete buttons

**Other Settings**
- Notification sound toggle
- Notification history (last 10)
- Clear history button

### 4. Notification Types

#### STRONG BUY Alerts
```
Title: SignalDegen 🚀
Body: STRONG BUY: BTC/USDT - Score 85
Icon: 🚀
Tag: strong-buy-BTC/USDT
Cooldown: 1 hour per coin
```

#### Price Alerts
```
Title: Price Alert 💰 / Alerta de Preço 💰
Body: BTC/USDT reached $45,000
Icon: 💰
Tag: price-alert-{id}
Triggers: Once (then removed)
```

#### Top Gainers
```
Title: Top Gainer 🔥
Body: PEPE +45% in 24h
Icon: 🔥
Tag: gainer-{coin_id}
Cooldown: 6 hours per coin
```

#### Top Losers
```
Title: Top Loser 📉
Body: LUNA -35% in 24h
Icon: 📉
Tag: loser-{coin_id}
Cooldown: 6 hours per coin
```

## 🏗️ Architecture

### Class: NotificationManager

```javascript
class NotificationManager {
  // Core properties
  - permission: Notification.permission
  - settings: notification preferences
  - alertHistory: notification log
  - priceAlerts: user-created alerts
  - lastNotifications: spam prevention

  // Methods
  - requestPermission()
  - checkPermission()
  - sendNotification(title, body, tag)
  - checkStrongBuyAlerts(signals)
  - checkPriceAlerts(prices)
  - checkTopGainersAlerts(gainers)
  - checkTopLosersAlerts(losers)
}
```

### localStorage Structure

```javascript
// Settings
signaldegen_notification_settings: {
  enabled: true,
  strongBuy: true,
  priceAlerts: false,
  topGainers: false,
  topLosers: false,
  sound: true,
  gainersThreshold: 20,
  losersThreshold: -20,
  lastPermissionRequest: timestamp
}

// Price Alerts
signaldegen_price_alerts: [
  {
    id: "1697040000",
    coin: "BTC/USDT",
    condition: "above",
    targetPrice: 45000,
    created: timestamp
  }
]

// History
signaldegen_notification_history: [
  {
    time: timestamp,
    type: "strong_buy",
    message: "STRONG BUY: BTC/USDT - Score 85",
    data: { pair, score, type }
  }
]

// Anti-Spam
signaldegen_last_notifications: {
  "strong-buy-BTC/USDT": timestamp,
  "gainer-bitcoin": timestamp
}
```

## 🔄 Integration Points

### 1. Safe Signals (js/api.js)
```javascript
// In updateSignalCards()
if (window.NotificationManager) {
  const signals = extractSignalsFromCards();
  window.NotificationManager.checkStrongBuyAlerts(signals);
  window.NotificationManager.checkPriceAlerts(pricesData);
}
```

**Triggers**: Every 30 seconds with price updates

### 2. Degen Zone (js/api.js)
```javascript
// In updateDegenZone(tabType)
if (window.NotificationManager) {
  if (tabType === 'gainers') {
    window.NotificationManager.checkTopGainersAlerts(coins);
  } else if (tabType === 'losers') {
    window.NotificationManager.checkTopLosersAlerts(coins);
  }
}
```

**Triggers**: Every 2 minutes with degen zone updates

## 🎨 UI Components

### Permission Modal
```html
<div class="notification-modal-overlay">
  <div class="notification-modal">
    <div class="notification-modal-icon">🔔</div>
    <h2>Title</h2>
    <p>Description</p>
    <div class="notification-modal-buttons">
      <button class="btn-notification-accept">Accept</button>
      <button class="btn-notification-deny">Deny</button>
    </div>
  </div>
</div>
```

### Settings Panel
```html
<div class="notification-panel">
  <div class="notification-panel-header">
    <h3>Alerts & Notifications</h3>
    <button class="notification-panel-close">✕</button>
  </div>

  <div class="notification-panel-content">
    <!-- Toggles, price alert creator, history -->
  </div>

  <div class="notification-panel-footer">
    <button class="btn-save-settings">Save</button>
  </div>
</div>
```

### Floating Button
```html
<button class="notification-floating-btn">🔔</button>
```

## 🔊 Notification Sound
- Built-in beep sound (data URI)
- Plays on notification (if enabled)
- Fallback: Silent if play fails

## 🚨 Anti-Spam System

### Cooldown Periods
- **STRONG BUY**: 1 hour per coin
- **Top Gainers**: 6 hours per coin
- **Top Losers**: 6 hours per coin
- **Price Alerts**: Once (auto-removed)

### Implementation
```javascript
canSendNotification(tag, cooldownMinutes) {
  const lastTime = this.lastNotifications[tag];
  if (!lastTime) return true;

  const diff = Date.now() - lastTime;
  return diff >= (cooldownMinutes * 60 * 1000);
}
```

## 🌐 Localization

### Languages
- **Portuguese (pt-BR)**: Default
- **English (en)**: Full translation

### Translation Keys
```javascript
modal: {
  title: "🔔 Quer receber alertas?",
  description: "...",
  accept: "Ativar Alertas",
  deny: "Agora Não"
}

settings: {
  title: "Alertas & Notificações",
  enabled: "Ativar Notificações",
  // ... etc
}
```

## 📱 Browser Compatibility

### Supported
- ✅ Chrome 50+ (Desktop & Android)
- ✅ Firefox 44+ (Desktop & Android)
- ✅ Edge 14+
- ✅ Safari 16+ (macOS)
- ⚠️ Safari iOS 16.4+ (limited)

### Not Supported
- ❌ Internet Explorer
- ❌ Safari < 16
- ❌ iOS < 16.4

### Feature Detection
```javascript
if (!('Notification' in window)) {
  console.warn('Browser does not support notifications');
  return null;
}
```

## 🔐 Permissions

### States
1. **default**: Not yet requested
2. **granted**: User allowed
3. **denied**: User blocked

### Handling
```javascript
// Request
const permission = await Notification.requestPermission();

// Check
if (Notification.permission === 'granted') {
  // Send notification
}
```

## 🧪 Testing Guide

### 1. Permission Modal Test
```
1. Clear localStorage (or use incognito)
2. Open page
3. Wait 2 seconds
4. Should see permission modal
5. Click "Enable Alerts"
6. Browser should request permission
7. Grant permission
8. Should see test notification
```

### 2. Settings Panel Test
```
1. Click floating bell button (bottom-right)
2. Panel should slide from right
3. Toggle each setting on/off
4. Click "Save Settings"
5. Refresh page
6. Reopen panel - settings should persist
```

### 3. Price Alert Test
```
1. Open settings panel
2. Enable "Price Alerts"
3. Select BTC/USDT
4. Condition: Above
5. Target: Enter current price + $100
6. Click "Add Alert"
7. Alert should appear in list
8. Wait for price to reach target (or manually set lower)
9. Should receive notification
10. Alert should auto-remove
```

### 4. STRONG BUY Alert Test
```
1. Enable "STRONG BUY Signals" in settings
2. Wait for Safe Signals update (30s)
3. If any coin has score ≥ 80:
   - Should receive notification
   - Check history in settings panel
4. Wait 1 hour - same coin should trigger again
```

### 5. Top Gainers Alert Test
```
1. Enable "Top Gainers >20%"
2. Navigate to Degen Zone
3. Click "Top Gainers" tab
4. If any coin has >20% gain:
   - Should receive notification
5. Check history in settings panel
```

### 6. Sound Test
```
1. Open settings panel
2. Ensure "Notification Sound" is ON
3. Enable any alert type
4. Trigger an alert
5. Should hear beep sound
6. Toggle sound OFF
7. Next alert should be silent
```

## 🐛 Troubleshooting

### Notifications Not Showing
**Problem**: No notifications appear
**Solutions**:
1. Check browser permission (browser settings)
2. Ensure notifications enabled in panel
3. Check alert type is enabled
4. Verify cooldown period hasn't blocked
5. Check browser console for errors

### Permission Denied
**Problem**: User blocked notifications
**Solution**:
1. Go to browser settings
2. Find site permissions
3. Re-enable notifications
4. Refresh page

### Notifications Keep Coming
**Problem**: Too many notifications
**Solutions**:
1. Open settings panel
2. Disable unwanted alert types
3. Check cooldown periods are working
4. Clear notification history

### Sound Not Playing
**Problem**: No notification sound
**Solutions**:
1. Check "Notification Sound" is ON
2. Verify browser allows audio
3. Check system volume
4. Test with browser audio test

## 📊 Analytics Events

Track these for user behavior:
```javascript
// Permission
- notification_permission_requested
- notification_permission_granted
- notification_permission_denied

// Alerts
- notification_sent (type, coin)
- price_alert_created
- price_alert_triggered
- price_alert_deleted

// Settings
- notification_settings_opened
- notification_settings_saved
- notification_history_cleared
```

## 🚀 Future Enhancements

### Phase 2
- [ ] Notification grouping (batch updates)
- [ ] Custom notification sounds
- [ ] Notification priority levels
- [ ] Rich notifications with actions
- [ ] Desktop widget/dock badge

### Phase 3
- [ ] Push notifications via service worker (offline)
- [ ] Email notifications (fallback)
- [ ] Telegram bot integration
- [ ] Discord webhook integration
- [ ] SMS alerts (premium)

## 📝 Code Examples

### Send Custom Notification
```javascript
if (window.NotificationManager) {
  window.NotificationManager.sendNotification(
    'Custom Title',
    'Custom message body',
    'custom-tag-123'
  );
}
```

### Create Price Alert Programmatically
```javascript
if (window.NotificationManager) {
  window.NotificationManager.addPriceAlert(
    'ETH/USDT',
    'above',
    2500
  );
}
```

### Check Notification Permission
```javascript
if (window.NotificationManager) {
  const hasPermission = window.NotificationManager.checkPermission();
  console.log('Notification permission:', hasPermission);
}
```

### Get Notification History
```javascript
if (window.NotificationManager) {
  const history = window.NotificationManager.alertHistory;
  console.log('Recent notifications:', history);
}
```

## 🎯 Performance

### Memory Usage
- Settings: ~1KB
- Price alerts: ~100 bytes per alert
- History: ~200 bytes per entry (max 50)
- Total: < 20KB

### CPU Usage
- Permission modal: One-time on load
- Alert checks: Run with existing updates (no extra)
- Settings panel: Only when open

### Network
- No network requests
- All local processing
- Uses existing API data

## 🔒 Privacy

- All data stored locally (localStorage)
- No external tracking
- No data sent to servers
- User can clear anytime
- No personal information collected

---

**Last Updated**: October 12, 2025
**Version**: 1.0.0
**Status**: ✅ Production Ready
**Author**: SignalDegen Team

**Browser Console Access**:
```javascript
// Global object
window.NotificationManager

// Common commands
window.NotificationManager.showSettingsPanel()
window.NotificationManager.sendTestNotification()
window.NotificationManager.clearHistory()
```
