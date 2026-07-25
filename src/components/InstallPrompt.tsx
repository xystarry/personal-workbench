import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowPrompt(false)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      setShowPrompt(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (isInstalled || !showPrompt) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '16px',
      right: '16px',
      background: 'white',
      borderRadius: '16px',
      padding: '16px',
      boxShadow: '0 4px 20px rgba(245, 168, 139, 0.3)',
      zIndex: 200,
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #F5A88B, #E08868)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: 'white',
        fontWeight: 'bold',
        flexShrink: 0
      }}>工</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#5C4030' }}>安装到主屏幕</div>
        <div style={{ fontSize: '12px', color: '#8B6F5C' }}>全屏使用，离线可用</div>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: 'linear-gradient(135deg, #F5A88B, #E08868)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 500,
          flexShrink: 0
        }}
      >
        安装
      </button>
      <button
        onClick={() => setShowPrompt(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#A09080',
          fontSize: '18px',
          padding: '4px',
          flexShrink: 0
        }}
      >×</button>
    </div>
  )
}
