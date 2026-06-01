let cachedAudio: HTMLAudioElement | null = null;
let unlocked = false;

function getAudio(): HTMLAudioElement {
  if (!cachedAudio) {
    cachedAudio = new Audio("/notification.mp3");
    cachedAudio.volume = 0.6;
    cachedAudio.preload = "auto";
  }
  return cachedAudio;
}

export function unlockNotificationSound() {
  if (unlocked) return;
  try {
    const a = getAudio();
    a.muted = true;
    a.play()
      .then(() => {
        a.pause();
        a.currentTime = 0;
        a.muted = false;
        unlocked = true;
      })
      .catch(() => {});
  } catch {
    // ignore
  }
}

export function playNotificationSound() {
  try {
    const a = getAudio();
    a.currentTime = 0;
    void a.play().catch((err) => {
      console.debug("[notification-sound] playback blocked:", err?.message);
    });
  } catch (err) {
    console.debug("[notification-sound] error:", err);
  }
  try {
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
  } catch {
    // ignore
  }
}
