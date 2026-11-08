import { useEffect, useRef, useState } from 'react'
import { barcodeScannerConfig as config } from './barcodeScannerConfig'
import { isValidEan13 } from '../lib/ean13'

export type ScannerStatus = 'ready' | 'reading'

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => Promise<void> | void
  onInvalid?: () => void
}

export function useBarcodeScanner({
  onScan,
  onInvalid,
}: UseBarcodeScannerOptions) {
  const [status, setStatus] = useState<ScannerStatus>('ready')
  const bufferRef = useRef('')
  const lastKeyAtRef = useRef<number | null>(null)
  const lastBarcodeRef = useRef<{ value: string; at: number } | null>(null)
  const onScanRef = useRef(onScan)
  const onInvalidRef = useRef(onInvalid)

  useEffect(() => {
    onScanRef.current = onScan
    onInvalidRef.current = onInvalid
  }, [onInvalid, onScan])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      if (
        (target instanceof HTMLElement &&
          target.matches('input, textarea, [contenteditable="true"]')) ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey
      ) {
        return
      }

      const now = Date.now()
      const elapsed =
        lastKeyAtRef.current === null ? 0 : now - lastKeyAtRef.current
      if (bufferRef.current && elapsed > config.maxKeyIntervalMs) {
        bufferRef.current = ''
      }
      lastKeyAtRef.current = now

      if (
        config.suffixes.includes(event.key as (typeof config.suffixes)[number])
      ) {
        event.preventDefault()
        const barcode = bufferRef.current
        bufferRef.current = ''
        lastKeyAtRef.current = null
        setStatus('ready')

        if (
          barcode.length < config.minLength ||
          barcode.length > config.maxLength ||
          (config.prefix && !barcode.startsWith(config.prefix)) ||
          !isValidEan13(barcode)
        ) {
          onInvalidRef.current?.()
          return
        }

        const previous = lastBarcodeRef.current
        if (
          previous?.value === barcode &&
          now - previous.at < config.duplicateWindowMs
        ) {
          return
        }
        lastBarcodeRef.current = { value: barcode, at: now }
        void Promise.resolve(onScanRef.current(barcode)).catch(() => undefined)
        return
      }

      if (
        event.key.length !== 1 ||
        bufferRef.current.length >= config.maxLength
      ) {
        return
      }

      bufferRef.current += event.key
      setStatus('reading')
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { status }
}
