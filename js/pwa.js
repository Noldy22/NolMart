// js/pwa.js - NolMart PWA Registration and Install Prompt Helper

// 1. Register Service Worker for PWA compliance
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((reg) => {
                console.log('NolMart PWA: Service Worker registered successfully:', reg.scope);
            })
            .catch((err) => {
                console.warn('NolMart PWA: Service Worker registration failed:', err);
            });
    });
}

// 2. Install Prompt Handling
let deferredPrompt = null;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

window.addEventListener('beforeinstallprompt', (e) => {
    // Stash the event so it can be triggered on user action
    deferredPrompt = e;
    console.log('NolMart PWA: beforeinstallprompt captured');

    // Show in-app install banner if not dismissed this session
    if (!isStandalone && !sessionStorage.getItem('nolmart_pwa_dismissed')) {
        showInstallBanner();
    }
});

window.addEventListener('appinstalled', () => {
    console.log('NolMart PWA: Application installed');
    deferredPrompt = null;
    hideInstallBanner();
});

function showInstallBanner() {
    if (document.getElementById('nolmart-pwa-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'nolmart-pwa-banner';
    banner.innerHTML = [
        '<style>',
        '#nolmart-pwa-banner {',
        '  position: fixed;',
        '  bottom: 20px;',
        '  left: 16px;',
        '  z-index: 99999;',
        '  max-width: 360px;',
        '  background: #ffffff;',
        '  border-radius: 16px;',
        '  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.08);',
        '  border: 1px solid #e2e8f0;',
        '  padding: 12px 14px;',
        '  display: flex;',
        '  align-items: center;',
        '  gap: 12px;',
        '  font-family: Poppins, system-ui, -apple-system, sans-serif;',
        '  animation: pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);',
        '}',
        '@keyframes pwaSlideUp {',
        '  from { transform: translateY(100px); opacity: 0; }',
        '  to { transform: translateY(0); opacity: 1; }',
        '}',
        '#nolmart-pwa-banner .pwa-icon {',
        '  width: 44px;',
        '  height: 44px;',
        '  border-radius: 10px;',
        '  background: #ffffff;',
        '  object-fit: contain;',
        '  border: 1px solid #edf2f7;',
        '  flex-shrink: 0;',
        '}',
        '#nolmart-pwa-banner .pwa-info {',
        '  flex: 1;',
        '  min-width: 0;',
        '}',
        '#nolmart-pwa-banner .pwa-title {',
        '  font-size: 13.5px;',
        '  font-weight: 700;',
        '  color: #0f386b;',
        '  line-height: 1.2;',
        '  margin-bottom: 2px;',
        '}',
        '#nolmart-pwa-banner .pwa-desc {',
        '  font-size: 11px;',
        '  color: #64748b;',
        '  line-height: 1.25;',
        '}',
        '#nolmart-pwa-banner .pwa-actions {',
        '  display: flex;',
        '  align-items: center;',
        '  gap: 6px;',
        '  flex-shrink: 0;',
        '}',
        '#nolmart-pwa-banner .pwa-install-btn {',
        '  background: #007bff;',
        '  color: #ffffff;',
        '  border: none;',
        '  border-radius: 20px;',
        '  padding: 7px 14px;',
        '  font-size: 12px;',
        '  font-weight: 600;',
        '  cursor: pointer;',
        '  transition: background 0.2s;',
        '}',
        '#nolmart-pwa-banner .pwa-install-btn:hover {',
        '  background: #0056b3;',
        '}',
        '#nolmart-pwa-banner .pwa-close-btn {',
        '  background: transparent;',
        '  border: none;',
        '  color: #94a3b8;',
        '  font-size: 18px;',
        '  line-height: 1;',
        '  padding: 4px;',
        '  cursor: pointer;',
        '}',
        '#nolmart-pwa-banner .pwa-close-btn:hover {',
        '  color: #334155;',
        '}',
        '@media (max-width: 480px) {',
        '  #nolmart-pwa-banner {',
        '    left: 12px;',
        '    right: 12px;',
        '    max-width: none;',
        '    bottom: 16px;',
        '  }',
        '}',
        '</style>',
        '<img src="/img/favicons/icon-192.png" alt="NolMart" class="pwa-icon">',
        '<div class="pwa-info">',
        '  <div class="pwa-title">Install NolMart App</div>',
        '  <div class="pwa-desc">Fast shopping right on your home screen</div>',
        '</div>',
        '<div class="pwa-actions">',
        '  <button class="pwa-install-btn" id="pwa-trigger-install">Install</button>',
        '  <button class="pwa-close-btn" id="pwa-trigger-close" aria-label="Close">&times;</button>',
        '</div>'
    ].join('\n');

    document.body.appendChild(banner);

    document.getElementById('pwa-trigger-install').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                hideInstallBanner();
            }
            deferredPrompt = null;
        } else {
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            const desc = banner.querySelector('.pwa-desc');
            const btn = document.getElementById('pwa-trigger-install');
            btn.style.display = 'none';
            if (isIOS) {
                desc.innerHTML = 'Tap <strong>Share</strong> (⎙) and select <strong>Add to Home Screen</strong>';
            } else {
                desc.innerHTML = 'Tap browser menu (<strong>⋮</strong>) and select <strong>Install app</strong>';
            }
        }
    });

    document.getElementById('pwa-trigger-close').addEventListener('click', () => {
        sessionStorage.setItem('nolmart_pwa_dismissed', 'true');
        hideInstallBanner();
    });
}

function hideInstallBanner() {
    const banner = document.getElementById('nolmart-pwa-banner');
    if (banner) {
        banner.style.transition = 'opacity 0.25s, transform 0.25s';
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(40px)';
        setTimeout(() => banner.remove(), 250);
    }
}
