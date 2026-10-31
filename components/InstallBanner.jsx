import { useState } from 'react';
import { useInstallPrompt } from '../src/hooks/useInstallPrompt';

/**
 * A floating banner shown when the PWA can be installed.
 * Shows "Add to Home Screen" on supported browsers.
 */
export default function InstallBanner() {
  const { canInstall, isInstalled, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if already installed, already dismissed, or not installable
  if (isInstalled || dismissed || !canInstall) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',         // above mobile nav bar
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        border: '1px solid rgba(59,130,246,0.35)',
        borderRadius: '16px',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(59,130,246,0.15)',
        backdropFilter: 'blur(12px)',
        animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Icon */}
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: '22px',
      }}>
        💳
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: '#f0f9ff' }}>
          Install H-Pay
        </p>
        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8', lineHeight: 1.3 }}>
          Add to home screen for a native app experience
        </p>
      </div>

      {/* Install button */}
      <button
        id="pwa-install-btn"
        onClick={triggerInstall}
        style={{
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '8px 14px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          letterSpacing: '0.02em',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Install
      </button>

      {/* Dismiss */}
      <button
        id="pwa-dismiss-btn"
        onClick={() => setDismissed(true)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '4px',
          flexShrink: 0,
        }}
        aria-label="Dismiss install banner"
      >
        ×
      </button>
    </div>
  );
}
