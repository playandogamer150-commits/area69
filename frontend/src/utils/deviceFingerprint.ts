const DEVICE_SEED_KEY = 'area69_device_seed'

async function sha256Hex(value: string) {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getOrCreateDeviceSeed() {
  const existingSeed = localStorage.getItem(DEVICE_SEED_KEY)
  if (existingSeed) {
    return existingSeed
  }

  const generatedSeed = window.crypto.randomUUID()
  localStorage.setItem(DEVICE_SEED_KEY, generatedSeed)
  return generatedSeed
}

export async function getDeviceFingerprint() {
  const seed = getOrCreateDeviceSeed()
  const traits = [
    seed,
    navigator.userAgent,
    navigator.language,
    navigator.platform,
    String(navigator.hardwareConcurrency || 0),
    Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    `${window.screen.width}x${window.screen.height}`,
    String(window.screen.colorDepth || 0),
  ].join('|')

  return sha256Hex(traits)
}
