export type PermissionKey = 'notifications' | 'location' | 'camera' | 'photos'
export type PermState = 'granted' | 'denied' | 'prompt' | 'unsupported'

/** Ask for notification permission. */
export async function requestNotifications(): Promise<PermState> {
  if (!('Notification' in window)) return 'unsupported'
  try {
    const res = await Notification.requestPermission()
    return res === 'default' ? 'prompt' : (res as PermState)
  } catch {
    return 'denied'
  }
}

/** Trigger the browser geolocation prompt. */
export async function requestLocation(): Promise<PermState> {
  if (!('geolocation' in navigator)) return 'unsupported'
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => resolve(err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt'),
      { timeout: 12000 },
    )
  })
}

/** Trigger the camera prompt via getUserMedia, then release the stream. */
export async function requestCamera(): Promise<PermState> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    stream.getTracks().forEach((t) => t.stop())
    return 'granted'
  } catch (e: unknown) {
    const err = e as DOMException
    if (err?.name === 'NotAllowedError') return 'denied'
    if (err?.name === 'NotFoundError') return 'unsupported'
    return 'prompt'
  }
}

/**
 * "Photos" on the web is the file picker — there is no persistent permission to
 * request up front, so we treat it as granted (the OS picker gates access at use time).
 */
export async function requestPhotos(): Promise<PermState> {
  return 'granted'
}

/** Best-effort read of a permission's current state without prompting. */
export async function queryPermission(key: PermissionKey): Promise<PermState> {
  try {
    if (key === 'notifications') {
      if (!('Notification' in window)) return 'unsupported'
      const p = Notification.permission
      return p === 'default' ? 'prompt' : (p as PermState)
    }
    if (!('permissions' in navigator)) return 'prompt'
    const name = key === 'location' ? 'geolocation' : key
    // camera maps to a PermissionName in most browsers
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    })
    return status.state as PermState
  } catch {
    return 'prompt'
  }
}
