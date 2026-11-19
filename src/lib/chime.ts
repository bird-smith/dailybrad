// One soft tone (and a short buzz where the phone allows), made in the browser: no sound file.
// Phones only allow sound after a tap, so call unlockChime() inside a tap first.

let player: AudioContext | null = null

export function unlockChime(): void {
  try {
    player ??= new AudioContext()
    void player.resume().catch(() => {})
  } catch {
    // No sound in this browser: the chime stays silent.
  }
}

export function chime(): void {
  try {
    navigator.vibrate?.(150)
  } catch {
    // Not allowed here.
  }
  if (!player) return
  try {
    const now = player.currentTime
    const tone = player.createOscillator()
    const volume = player.createGain()
    tone.type = 'sine'
    tone.frequency.value = 660
    volume.gain.setValueAtTime(0.0001, now)
    volume.gain.exponentialRampToValueAtTime(0.25, now + 0.02)
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.3)
    tone.connect(volume).connect(player.destination)
    tone.start(now)
    tone.stop(now + 0.32)
  } catch {
    // Sound failed: the timer carries on silently.
  }
}
