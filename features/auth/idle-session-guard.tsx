'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const IDLE_LIMIT_MS = 2 * 60 * 1000
const RESPONSE_LIMIT_MS = 30 * 1000
const RESPONSE_LIMIT_SECONDS = RESPONSE_LIMIT_MS / 1000
const SESSION_ACTIVITY_CHANNEL = 'cuentaclarita:session-activity'
const ACTIVITY_BROADCAST_INTERVAL_MS = 1000

type SessionActivityMessage = {
  type: 'activity'
  userId: string
  timestamp: number
}

type IdleSessionGuardProps = {
  enabled: boolean
  userId: string | null
  onSignOut: () => Promise<void>
}

export function IdleSessionGuard({
  enabled,
  userId,
  onSignOut,
}: IdleSessionGuardProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [remainingSeconds, setRemainingSeconds] = React.useState(RESPONSE_LIMIT_SECONDS)

  const idleTimerRef = React.useRef<number | null>(null)
  const countdownTimerRef = React.useRef<number | null>(null)
  const idleDeadlineRef = React.useRef(0)
  const warningDeadlineRef = React.useRef(0)
  const enabledRef = React.useRef(false)
  const userIdRef = React.useRef<string | null>(null)
  const onSignOutRef = React.useRef(onSignOut)
  const isOpenRef = React.useRef(false)
  const signOutStartedRef = React.useRef(false)
  const lastActivityAtRef = React.useRef(0)
  const lastMouseMoveAtRef = React.useRef(0)
  const lastBroadcastAtRef = React.useRef(0)
  const channelRef = React.useRef<BroadcastChannel | null>(null)

  React.useEffect(() => {
    onSignOutRef.current = onSignOut
  }, [onSignOut])

  const clearTimers = React.useCallback(() => {
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }
  }, [])

  const signOutOnce = React.useCallback(async () => {
    if (signOutStartedRef.current) return

    signOutStartedRef.current = true
    setIsSigningOut(true)
    clearTimers()
    warningDeadlineRef.current = 0
    isOpenRef.current = false
    setIsOpen(false)

    try {
      await onSignOutRef.current()
    } catch {
      router.replace('/login')
    }
  }, [clearTimers, router])

  const updateCountdown = React.useCallback(() => {
    if (!enabledRef.current || !isOpenRef.current || signOutStartedRef.current) return

    const deadline = warningDeadlineRef.current
    if (!deadline) return

    const millisecondsLeft = deadline - Date.now()
    if (millisecondsLeft <= 0) {
      void signOutOnce()
      return
    }

    setRemainingSeconds(Math.ceil(millisecondsLeft / 1000))
  }, [signOutOnce])

  const showWarning = React.useCallback((expectedIdleDeadline: number) => {
    if (!enabledRef.current || signOutStartedRef.current) return
    if (idleDeadlineRef.current !== expectedIdleDeadline) return

    idleTimerRef.current = null
    const warningDeadline = expectedIdleDeadline + RESPONSE_LIMIT_MS
    if (Date.now() >= warningDeadline) {
      void signOutOnce()
      return
    }

    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current)
    }
    warningDeadlineRef.current = warningDeadline
    isOpenRef.current = true
    setRemainingSeconds(Math.ceil((warningDeadline - Date.now()) / 1000))
    setIsOpen(true)
    countdownTimerRef.current = window.setInterval(updateCountdown, 1000)
  }, [signOutOnce, updateCountdown])

  const registerActivity = React.useCallback((
    timestamp: number,
    source: 'local' | 'remote',
    allowDuringWarning = false,
  ) => {
    if (!enabledRef.current || signOutStartedRef.current) return
    if (source === 'local' && isOpenRef.current && !allowDuringWarning) return
    if (!Number.isFinite(timestamp) || timestamp <= lastActivityAtRef.current) return

    const now = Date.now()
    if (timestamp > now + 1000) return

    lastActivityAtRef.current = timestamp

    if (source === 'local') {
      const channel = channelRef.current
      const activeUserId = userIdRef.current
      if (channel && activeUserId && timestamp - lastBroadcastAtRef.current >= ACTIVITY_BROADCAST_INTERVAL_MS) {
        const message: SessionActivityMessage = {
          type: 'activity',
          userId: activeUserId,
          timestamp,
        }
        channel.postMessage(message)
        lastBroadcastAtRef.current = timestamp
      }
    }

    clearTimers()
    warningDeadlineRef.current = 0
    isOpenRef.current = false
    setIsOpen(false)
    setRemainingSeconds(RESPONSE_LIMIT_SECONDS)

    const idleDeadline = timestamp + IDLE_LIMIT_MS
    idleDeadlineRef.current = idleDeadline
    if (idleDeadline <= now) {
      showWarning(idleDeadline)
      return
    }

    idleTimerRef.current = window.setTimeout(
      () => showWarning(idleDeadline),
      idleDeadline - now,
    )
  }, [clearTimers, showWarning])

  const checkDeadlines = React.useCallback(() => {
    if (!enabledRef.current || signOutStartedRef.current) return

    if (isOpenRef.current) {
      updateCountdown()
      return
    }

    const idleDeadline = idleDeadlineRef.current
    if (idleDeadline && Date.now() >= idleDeadline) {
      showWarning(idleDeadline)
    }
  }, [showWarning, updateCountdown])

  React.useEffect(() => {
    if (!enabled || !userId) {
      enabledRef.current = false
      userIdRef.current = null
      signOutStartedRef.current = false
      setIsSigningOut(false)
      clearTimers()
      idleDeadlineRef.current = 0
      warningDeadlineRef.current = 0
      isOpenRef.current = false
      signOutStartedRef.current = false
      lastActivityAtRef.current = 0
      setIsOpen(false)
      setRemainingSeconds(RESPONSE_LIMIT_SECONDS)
      return
    }

    enabledRef.current = true
    userIdRef.current = userId
    signOutStartedRef.current = false
    setIsSigningOut(false)
    const initialActivityAt = Date.now()
    lastActivityAtRef.current = initialActivityAt
    lastMouseMoveAtRef.current = 0
    lastBroadcastAtRef.current = 0

    const initialIdleDeadline = initialActivityAt + IDLE_LIMIT_MS
    idleDeadlineRef.current = initialIdleDeadline
    idleTimerRef.current = window.setTimeout(
      () => showWarning(initialIdleDeadline),
      IDLE_LIMIT_MS,
    )

    const channel = typeof window.BroadcastChannel === 'function'
      ? new window.BroadcastChannel(SESSION_ACTIVITY_CHANNEL)
      : null
    channelRef.current = channel

    const handleChannelMessage = (event: MessageEvent<SessionActivityMessage>) => {
      const message = event.data
      if (
        message?.type === 'activity' &&
        message.userId === userId &&
        typeof message.timestamp === 'number' &&
        Number.isFinite(message.timestamp)
      ) {
        registerActivity(message.timestamp, 'remote')
      }
    }

    const handleActivity = () => registerActivity(Date.now(), 'local')
    const handleMouseMove = () => {
      const now = Date.now()
      if (now - lastMouseMoveAtRef.current < ACTIVITY_BROADCAST_INTERVAL_MS) return
      lastMouseMoveAtRef.current = now
      registerActivity(now, 'local')
    }
    const handleVisibilityChange = () => {
      if (!document.hidden) checkDeadlines()
    }

    channel?.addEventListener('message', handleChannelMessage)
    for (const eventName of ['pointerdown', 'click', 'keydown', 'input', 'change', 'wheel', 'touchstart']) {
      document.addEventListener(eventName, handleActivity, { capture: true, passive: true })
    }
    document.addEventListener('scroll', handleActivity, { capture: true, passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('focus', checkDeadlines)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      enabledRef.current = false
      userIdRef.current = null
      clearTimers()
      idleDeadlineRef.current = 0
      warningDeadlineRef.current = 0
      isOpenRef.current = false
      channel?.removeEventListener('message', handleChannelMessage)
      channel?.close()
      if (channelRef.current === channel) channelRef.current = null
      for (const eventName of ['pointerdown', 'click', 'keydown', 'input', 'change', 'wheel', 'touchstart']) {
        document.removeEventListener(eventName, handleActivity, true)
      }
      document.removeEventListener('scroll', handleActivity, true)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('focus', checkDeadlines)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkDeadlines, clearTimers, enabled, registerActivity, showWarning, userId])

  const continueSession = () => {
    registerActivity(Date.now(), 'local', true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md"
      >
        <div className="flex flex-col gap-5 p-5 sm:p-6">
          <DialogHeader className="flex-row items-start gap-4 text-left">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Clock className="size-6" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-xl font-semibold tracking-tight">
                ¿Sigues ahí?
              </DialogTitle>
              <DialogDescription className="leading-relaxed">
                Tu sesión está a punto de expirar por inactividad. ¿Deseas continuar conectado?
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/40 p-3.5">
            <span
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-lg font-semibold tabular-nums text-destructive"
              aria-hidden="true"
            >
              {remainingSeconds}
            </span>
            <p
              className="text-sm leading-relaxed text-muted-foreground"
              role="timer"
              aria-label={`La sesión se cerrará automáticamente en ${remainingSeconds} ${remainingSeconds === 1 ? 'segundo' : 'segundos'}`}
            >
              La sesión se cerrará automáticamente en{' '}
              <span className="font-semibold text-foreground">
                {remainingSeconds} {remainingSeconds === 1 ? 'segundo' : 'segundos'}
              </span>.
            </p>
          </div>
        </div>

        <DialogFooter className="mx-0 mb-0 gap-2 rounded-b-2xl border-border bg-muted/20 px-5 py-4 sm:px-6">
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-xl px-4"
            disabled={isSigningOut}
            onClick={() => { void signOutOnce() }}
          >
            Cerrar sesión
          </Button>
          <Button
            type="button"
            className="h-10 rounded-xl px-4"
            onClick={continueSession}
          >
            Seguir conectado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
