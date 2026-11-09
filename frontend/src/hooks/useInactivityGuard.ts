import { useEffect, useState } from 'react'
import { INACTIVITY_RETURN_MS, INACTIVITY_WARNING_MS } from '../config/kiosk'

interface InactivityOptions {
  isEmpty: boolean
  onReturn: () => void
}

export function useInactivityGuard({ isEmpty, onReturn }: InactivityOptions) {
  const [warningVisible, setWarningVisible] = useState(false)

  useEffect(() => {
    let warningTimer: ReturnType<typeof setTimeout> | undefined
    let returnTimer: ReturnType<typeof setTimeout> | undefined

    const clearTimers = () => {
      if (warningTimer) clearTimeout(warningTimer)
      if (returnTimer) clearTimeout(returnTimer)
    }

    const reset = () => {
      clearTimers()
      setWarningVisible(false)
      warningTimer = setTimeout(() => {
        setWarningVisible(true)
        if (isEmpty) {
          returnTimer = setTimeout(
            onReturn,
            INACTIVITY_RETURN_MS - INACTIVITY_WARNING_MS,
          )
        }
      }, INACTIVITY_WARNING_MS)
    }

    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    events.forEach((event) => window.addEventListener(event, reset))
    reset()
    return () => {
      clearTimers()
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [isEmpty, onReturn])

  return { warningVisible }
}
