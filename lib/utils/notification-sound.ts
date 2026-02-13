'use client'

let notificationAudio: HTMLAudioElement | null = null
let isInitialized = false
let isLooping = false

/**
 * Initialize and preload the notification sound
 * Call this once on user interaction to enable audio playback
 */
export function initNotificationSound() {
  if (typeof window === 'undefined') return
  if (isInitialized) return
  
  // Preload the MP3 file
  try {
    notificationAudio = new Audio('/sounds/notification.mp3')
    notificationAudio.preload = 'auto'
    notificationAudio.volume = 0.7
    notificationAudio.load()
  } catch (error) {
    console.warn('[Audio] Failed to create audio element:', error)
  }
  
  isInitialized = true
}

/**
 * Unlock audio for autoplay by playing a silent sound
 * Must be called during a user interaction (click, tap, etc.)
 */
export async function unlockAudio(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  // Initialize if not done
  if (!isInitialized) {
    initNotificationSound()
  }
  
  if (!notificationAudio) return false
  
  try {
    // Play and immediately pause to unlock audio context
    notificationAudio.volume = 0
    await notificationAudio.play()
    notificationAudio.pause()
    notificationAudio.currentTime = 0
    notificationAudio.volume = 0.7
    return true
  } catch (error) {
    console.warn('[Audio] Failed to unlock audio:', error)
    return false
  }
}

/**
 * Play the notification sound once
 */
export async function playNotificationSound(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  // Auto-initialize if not done
  if (!isInitialized) {
    initNotificationSound()
  }

  if (!notificationAudio) {
    console.warn('[Audio] No audio element available')
    return false
  }

  try {
    notificationAudio.currentTime = 0
    notificationAudio.loop = false
    await notificationAudio.play()
    return true
  } catch (error) {
    console.warn('[Audio] Playback failed:', error)
    return false
  }
}

/**
 * Start looping the notification sound
 */
export async function startNotificationLoop(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  if (isLooping) return true
  
  // Auto-initialize if not done
  if (!isInitialized) {
    initNotificationSound()
  }

  if (!notificationAudio) return false

  try {
    isLooping = true
    notificationAudio.currentTime = 0
    notificationAudio.loop = true
    await notificationAudio.play()
    return true
  } catch (error) {
    console.warn('[Audio] Loop playback failed:', error)
    isLooping = false
    return false
  }
}

/**
 * Stop the notification sound loop
 */
export function stopNotificationLoop(): void {
  if (typeof window === 'undefined') return
  
  isLooping = false
  
  if (notificationAudio) {
    notificationAudio.pause()
    notificationAudio.currentTime = 0
    notificationAudio.loop = false
  }
}

/**
 * Check if sound is currently looping
 */
export function isNotificationLooping(): boolean {
  return isLooping
}
