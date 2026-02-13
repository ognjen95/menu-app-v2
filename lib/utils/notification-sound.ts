'use client'

let audioContext: AudioContext | null = null
let notificationAudio: HTMLAudioElement | null = null
let isInitialized = false

/**
 * Initialize and preload the notification sound
 * Call this once on user interaction to enable audio playback
 */
export function initNotificationSound() {
  if (typeof window === 'undefined') return
  if (isInitialized) return
  
  console.log('[Audio] Initializing notification sound...')

  // Try to preload the MP3 file
  try {
    notificationAudio = new Audio('/sounds/notification.mp3')
    notificationAudio.preload = 'auto'
    notificationAudio.volume = 0.7
    notificationAudio.load()
    console.log('[Audio] MP3 audio element created')
  } catch (error) {
    console.warn('[Audio] Failed to create audio element:', error)
  }

  // Initialize AudioContext for fallback beep
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    // Resume immediately if possible
    if (audioContext.state === 'suspended') {
      audioContext.resume()
    }
    console.log('[Audio] AudioContext created, state:', audioContext.state)
  } catch (error) {
    console.warn('[Audio] Failed to create AudioContext:', error)
  }
  
  isInitialized = true
}

/**
 * Play the notification sound
 * Falls back to a generated beep if MP3 fails
 */
export async function playNotificationSound(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  console.log('[Audio] playNotificationSound called, isInitialized:', isInitialized)
  
  // Auto-initialize if not done
  if (!isInitialized) {
    initNotificationSound()
  }

  // First, try to play the MP3 file
  if (notificationAudio) {
    try {
      console.log('[Audio] Attempting to play MP3...')
      notificationAudio.currentTime = 0
      await notificationAudio.play()
      console.log('[Audio] MP3 played successfully')
      return true
    } catch (error) {
      console.warn('[Audio] MP3 playback failed, trying fallback beep:', error)
    }
  }

  // Fallback: generate a beep using Web Audio API
  console.log('[Audio] Trying fallback beep with Web Audio API...')
  try {
    // Always create a fresh AudioContext if needed
    if (!audioContext || audioContext.state === 'closed') {
      console.log('[Audio] Creating new AudioContext...')
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Resume context if suspended (required after user interaction)
    console.log('[Audio] AudioContext state before resume:', audioContext.state)
    if (audioContext.state === 'suspended') {
      console.log('[Audio] Resuming suspended AudioContext...')
      await audioContext.resume()
      console.log('[Audio] AudioContext state after resume:', audioContext.state)
    }
    
    // Wait a tiny bit for context to be ready
    await new Promise(resolve => setTimeout(resolve, 10))

    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Pleasant notification tone (two-tone chime)
    oscillator.frequency.value = 880 // A5 note
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)

    // Second tone
    const oscillator2 = audioContext.createOscillator()
    const gainNode2 = audioContext.createGain()

    oscillator2.connect(gainNode2)
    gainNode2.connect(audioContext.destination)

    oscillator2.frequency.value = 1320 // E6 note (higher)
    oscillator2.type = 'sine'
    
    gainNode2.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime + 0.15)
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator2.start(audioContext.currentTime + 0.15)
    oscillator2.stop(audioContext.currentTime + 0.5)

    console.log('[Audio] Fallback beep scheduled successfully')
    return true
  } catch (error) {
    console.error('[Audio] Failed to play notification sound:', error)
    return false
  }
}

/**
 * Check if notification sound can be played
 */
export function canPlaySound(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.AudioContext || (window as any).webkitAudioContext)
}
