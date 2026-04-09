import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import SpiralBinding from './components/SpiralBinding'
import HeroSection from './components/HeroSection'
import MonthNav from './components/MonthNav'
import CalendarGrid from './components/CalendarGrid'
import NotesPanel from './components/NotesPanel'
import ThemeToggle from './components/ThemeToggle'
import HolidayTooltip from './components/HolidayTooltip'
import EventModal from './components/EventModal'
import { MONTH_NAMES, HOLIDAYS, MONTH_IMAGES, MONTH_IMAGE_LIST, LOGO_IMAGE } from './data/constants'
import { preloadImages, preloadImagesInIdle, primeImageConnections } from './utils/imagePreload'
import './App.css'

function getMonthLoopIndex(monthIndex) {
  const normalizedMonth = monthIndex % 12
  return normalizedMonth >= 0 ? normalizedMonth : normalizedMonth + 12
}

function normalizeNoteEntry(entry) {
  if (typeof entry === 'string') {
    return { text: entry, labels: [] }
  }

  return {
    text: entry?.text || '',
    labels: Array.isArray(entry?.labels) ? entry.labels.slice(0, 2) : [],
  }
}

function App() {
  const today = new Date()
  const targetMonth = today.getMonth()
  const calendarYear = today.getFullYear()
  const stackLayerSpacing = 1.5

  // Start at January (0) for the intro animation
  const getTodayZero = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const [currentMonth, setCurrentMonth] = useState(0)
  const [currentYear] = useState(calendarYear)
  const [rangeStart, setRangeStart] = useState(getTodayZero())
  const [rangeEnd, setRangeEnd] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('wallCalendarTheme') || 'light')
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wallCalendarNotes') || '{}') }
    catch { return {} }
  })
  const [events, setEvents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wallCalendarEvents') || '{}') }
    catch { return {} }
  })
  const [isEventModalOpen, setIsEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 })
  const [direction, setDirection] = useState(0)
  const introComplete = useRef(targetMonth === 0)
  const introTimerRef = useRef(null)
  const introReadyTimerRef = useRef(null)
  const themeSyncTimerRef = useRef(null)
  const themePersistTimerRef = useRef(null)
  const [introRunning, setIntroRunning] = useState(targetMonth > 0)
  const [introAssetsReady, setIntroAssetsReady] = useState(targetMonth === 0)
  const calendarContainerRef = useRef(null)
  const [flipViewportFrame, setFlipViewportFrame] = useState(null)

  const [transitionState, setTransitionState] = useState({
    active: false,
    direction: 0,
    oldMonth: 0,
    oldYear: 0
  })

  // Dynamic stack: remaining months below current
  const stackLayerCount = 11 - currentMonth

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)

    const persistTheme = () => {
      localStorage.setItem('wallCalendarTheme', theme)
      themePersistTimerRef.current = null
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(persistTheme, { timeout: 700 })
      themePersistTimerRef.current = idleId

      return () => {
        if (themePersistTimerRef.current !== null) {
          window.cancelIdleCallback(themePersistTimerRef.current)
          themePersistTimerRef.current = null
        }
      }
    }

    themePersistTimerRef.current = window.setTimeout(persistTheme, 0)

    return () => {
      if (themePersistTimerRef.current !== null) {
        window.clearTimeout(themePersistTimerRef.current)
        themePersistTimerRef.current = null
      }
    }
  }, [theme])

  // Save notes & events
  useEffect(() => {
    localStorage.setItem('wallCalendarNotes', JSON.stringify(notes))
  }, [notes])
  useEffect(() => {
    localStorage.setItem('wallCalendarEvents', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    gsap.config({ autoSleep: 60, nullTargetWarn: false })
    gsap.defaults({ overwrite: 'auto' })
    gsap.ticker.lagSmoothing(700, 33)
  }, [])

  useEffect(() => {
    const criticalImages = [
      MONTH_IMAGES[0],
      MONTH_IMAGES[getMonthLoopIndex(targetMonth)],
      MONTH_IMAGES[getMonthLoopIndex(targetMonth + 1)],
      LOGO_IMAGE,
    ]

    primeImageConnections([...MONTH_IMAGE_LIST, LOGO_IMAGE])

    let cancelled = false

    const markReady = () => {
      if (cancelled) {
        return
      }

      setIntroAssetsReady(true)

      if (introReadyTimerRef.current) {
        window.clearTimeout(introReadyTimerRef.current)
        introReadyTimerRef.current = null
      }
    }

    introReadyTimerRef.current = window.setTimeout(markReady, 1800)

    preloadImages(criticalImages, { priority: 'high' }).finally(markReady)
    const cancelIdlePreload = preloadImagesInIdle(MONTH_IMAGE_LIST, { priority: 'low' })

    return () => {
      cancelled = true

      if (introReadyTimerRef.current) {
        window.clearTimeout(introReadyTimerRef.current)
        introReadyTimerRef.current = null
      }

      cancelIdlePreload()
    }
  }, [targetMonth])

  useEffect(() => {
    preloadImages([
      MONTH_IMAGES[getMonthLoopIndex(currentMonth + 1)],
      MONTH_IMAGES[getMonthLoopIndex(currentMonth - 1)],
    ], {
      priority: 'low',
      addPreloadLink: false,
    })
  }, [currentMonth])

  useEffect(() => {
    const root = document.documentElement

    const syncVisualViewport = () => {
      const viewport = window.visualViewport

      if (!viewport) {
        root.style.setProperty('--app-visual-height', `${window.innerHeight}px`)
        root.style.setProperty('--app-viewport-offset-bottom', '0px')
        return
      }

      const offsetBottom = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      )

      root.style.setProperty('--app-visual-height', `${viewport.height}px`)
      root.style.setProperty('--app-viewport-offset-bottom', `${offsetBottom}px`)
    }

    syncVisualViewport()

    window.addEventListener('resize', syncVisualViewport)
    window.visualViewport?.addEventListener('resize', syncVisualViewport)
    window.visualViewport?.addEventListener('scroll', syncVisualViewport)

    return () => {
      window.removeEventListener('resize', syncVisualViewport)
      window.visualViewport?.removeEventListener('resize', syncVisualViewport)
      window.visualViewport?.removeEventListener('scroll', syncVisualViewport)
      root.style.removeProperty('--app-visual-height')
      root.style.removeProperty('--app-viewport-offset-bottom')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    root.classList.add('theme-syncing')

    if (themeSyncTimerRef.current) {
      window.clearTimeout(themeSyncTimerRef.current)
      themeSyncTimerRef.current = null
    }

    setTheme(t => t === 'dark' ? 'light' : 'dark')

    const toggleButton = document.querySelector('.theme-toggle')
    if (toggleButton) {
      gsap.killTweensOf(toggleButton)
      gsap.set(toggleButton, { rotate: 0, willChange: 'transform' })
      gsap.to(toggleButton, {
        rotate: 180,
        duration: 0.34,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => {
          gsap.set(toggleButton, { clearProps: 'transform,willChange' })
        },
      })
    }

    themeSyncTimerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-syncing')
      themeSyncTimerRef.current = null
    }, 220)
  }, [])

  useEffect(() => {
    return () => {
      if (themeSyncTimerRef.current) {
        window.clearTimeout(themeSyncTimerRef.current)
      }

      document.documentElement.classList.remove('theme-syncing')
    }
  }, [])

  // Page flip animation
  useEffect(() => {
    if (!transitionState.active) return
    const el = document.querySelector('.anim-layer')
    if (!el) return

    gsap.killTweensOf(el)
    gsap.set(el, {
      willChange: 'transform, opacity',
      transformOrigin: '50% 0%',
    })

    const dur = introRunning ? 0.54 : 0.82
    const flipDepth = introRunning ? 20 : 34
    const widthLift = introRunning ? 1.035 : 1.075
    const verticalLift = introRunning ? -10 : -18

    const completeTransition = () => {
      gsap.set(el, { clearProps: 'willChange' })
      setTransitionState(s => ({ ...s, active: false }))
    }

    if (transitionState.direction > 0) {
      gsap.fromTo(el, {
        rotationX: 0,
        y: 0,
        z: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      }, {
        rotationX: 92,
        y: verticalLift,
        z: flipDepth,
        scaleX: widthLift,
        scaleY: 1.015,
        opacity: 0,
        duration: dur,
        ease: introRunning ? 'power2.inOut' : 'power3.in',
        force3D: true,
        overwrite: 'auto',
        onComplete: completeTransition,
      })
    } else {
      gsap.fromTo(el, {
        rotationX: 92,
        y: verticalLift,
        z: flipDepth,
        scaleX: widthLift,
        scaleY: 1.015,
        opacity: 0,
      }, {
        rotationX: 0,
        y: 0,
        z: 0,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
        duration: dur,
        ease: introRunning ? 'power2.inOut' : 'power3.out',
        force3D: true,
        overwrite: 'auto',
        onComplete: completeTransition,
      })
    }

    return () => {
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: 'willChange' })
    }
  }, [transitionState.active, transitionState.direction, introRunning])

  useLayoutEffect(() => {
    if (!transitionState.active) {
      return
    }

    const container = calendarContainerRef.current
    if (!container) {
      return
    }

    let frameRequestId = null

    const updateFrame = () => {
      const rect = container.getBoundingClientRect()
      const radius = window.getComputedStyle(container).borderRadius

      setFlipViewportFrame({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        borderRadius: radius,
      })
    }

    const syncFrame = () => {
      if (frameRequestId !== null) {
        return
      }

      frameRequestId = window.requestAnimationFrame(() => {
        frameRequestId = null
        updateFrame()
      })
    }

    updateFrame()

    window.addEventListener('resize', syncFrame)
    window.addEventListener('scroll', syncFrame, true)

    return () => {
      window.removeEventListener('resize', syncFrame)
      window.removeEventListener('scroll', syncFrame, true)

      if (frameRequestId !== null) {
        window.cancelAnimationFrame(frameRequestId)
      }
    }
  }, [transitionState.active])

  // Intro flip sequence: January → current month
  useEffect(() => {
    if (introComplete.current || targetMonth === 0 || !introAssetsReady) {
      return
    }

    const introStepDelayMs = 660

    const advanceMonth = (monthIndex) => {
      if (monthIndex >= targetMonth) {
        introComplete.current = true
        setIntroRunning(false)
        return
      }

      setTransitionState({
        active: true,
        direction: 1,
        oldMonth: monthIndex,
        oldYear: calendarYear
      })
      setDirection(1)
      const nextMonth = monthIndex + 1
      setCurrentMonth(nextMonth)
      introTimerRef.current = window.setTimeout(() => advanceMonth(nextMonth), introStepDelayMs)
    }

    introTimerRef.current = window.setTimeout(() => {
      advanceMonth(0)
    }, 320)

    return () => {
      if (introTimerRef.current) {
        window.clearTimeout(introTimerRef.current)
      }
    }
  }, [calendarYear, targetMonth, introAssetsReady])

  // Single-year lock: no going before January
  const goToPrev = useCallback(() => {
    if (transitionState.active || introRunning) return
    if (currentMonth <= 0) return
    setTransitionState({ active: true, direction: -1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(-1)
    setCurrentMonth(m => m - 1)
  }, [currentMonth, currentYear, transitionState.active, introRunning])

  // Single-year lock: no going past December
  const goToNext = useCallback(() => {
    if (transitionState.active || introRunning) return
    if (currentMonth >= 11) return
    setTransitionState({ active: true, direction: 1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(1)
    setCurrentMonth(m => m + 1)
  }, [currentMonth, currentYear, transitionState.active, introRunning])

  const goToToday = useCallback(() => {
    const t = new Date()
    setDirection(0)
    setCurrentMonth(t.getMonth())
    setRangeStart(new Date(t.getFullYear(), t.getMonth(), t.getDate()))
    setRangeEnd(null)
  }, [])

  const handleSingleDaySelect = useCallback((day) => {
    if (introRunning) return
    const clicked = new Date(currentYear, currentMonth, day)
    setRangeStart(clicked)
    setRangeEnd(null)
  }, [currentMonth, currentYear, introRunning])

  const handleRangeSelection = useCallback((startDay, endDay) => {
    if (introRunning) return

    const startDate = new Date(currentYear, currentMonth, startDay)
    const endDate = new Date(currentYear, currentMonth, endDay)

    if (startDate <= endDate) {
      setRangeStart(startDate)
      setRangeEnd(startDay === endDay ? null : endDate)
      return
    }

    setRangeStart(endDate)
    setRangeEnd(startDate)
  }, [currentMonth, currentYear, introRunning])

  const clearSelection = useCallback(() => {
    setRangeStart(null)
    setRangeEnd(null)
  }, [])

  // Keyboard shortcuts (disabled during intro)
  useEffect(() => {
    const handler = (e) => {
      if (introRunning) return
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrev() }
      if (e.key === 'ArrowRight') { e.preventDefault(); goToNext() }
      if (e.key === 'Escape') clearSelection()
      if (e.key === 't' || e.key === 'T') goToToday()
      if (e.key === 'd' || e.key === 'D') toggleTheme()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [introRunning, goToPrev, goToNext, clearSelection, goToToday, toggleTheme])

  const getNoteKey = useCallback(() => {
    const formatShort = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    if (rangeStart && rangeEnd) {
      return `${formatShort(rangeStart)}_to_${formatShort(rangeEnd)}`
    } else if (rangeStart) {
      return formatShort(rangeStart)
    }
    return `month_${currentYear}_${currentMonth}`
  }, [rangeStart, rangeEnd, currentYear, currentMonth])

  const handleNoteChange = useCallback((text) => {
    const key = getNoteKey()

    setNotes(prev => ({
      ...prev,
      [key]: {
        ...normalizeNoteEntry(prev[key]),
        text,
      },
    }))
  }, [getNoteKey])

  const handleNoteLabelsChange = useCallback((labels) => {
    const key = getNoteKey()

    setNotes(prev => ({
      ...prev,
      [key]: {
        ...normalizeNoteEntry(prev[key]),
        labels: labels.slice(0, 2),
      },
    }))
  }, [getNoteKey])

  const showTooltip = useCallback((text, x, y) => {
    setTooltip({ visible: true, text, x, y })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }))
  }, [])
  
  const currentNoteEntry = normalizeNoteEntry(notes[getNoteKey()])
  const currentNoteText = currentNoteEntry.text
  const currentNoteLabels = currentNoteEntry.labels

  const formatShort = (d) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`
  let notesSubtitle = ''
  if (rangeStart && rangeEnd) {
    const s = formatShort(rangeStart), e = formatShort(rangeEnd)
    notesSubtitle = s === e ? s : `${s} to ${e}`
  } else if (rangeStart) {
    notesSubtitle = formatShort(rangeStart)
  }

  const deleteEvent = useCallback((dateKey, eventId) => {
    setEvents(prev => {
      const dayEvents = prev[dateKey] || [];
      return { ...prev, [dateKey]: dayEvents.filter(e => e.id !== eventId) };
    });
  }, []);

  const handleHeroAddEvent = useCallback(() => {
    if (!rangeStart) return;
    setEditingEvent(null);
    setIsEventModalOpen(true);
  }, [rangeStart]);

  const handleEditEvent = useCallback((evt) => {
    setEditingEvent(evt);
    setIsEventModalOpen(true);
  }, []);

  const handleSaveEvent = useCallback((newEvent, isUpdate) => {
    if (!rangeStart) return;
    const formatShort = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const key = formatShort(rangeStart);
    setEvents(prev => {
      const existing = prev[key] || [];
      if (isUpdate) {
        return { ...prev, [key]: existing.map(e => e.id === newEvent.id ? newEvent : e) };
      }
      return { ...prev, [key]: [...existing, newEvent] };
    });
  }, [rangeStart]);

  const renderPage = (m, y, keyStr, isAnimLayer) => {
    const formatShort = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    const activeDateKey = rangeStart ? formatShort(rangeStart) : '';
    const userEvents = events[activeDateKey] || [];
    
    const holidayKey = rangeStart ? `${rangeStart.getMonth()}-${rangeStart.getDate()}` : '';
    const holidayName = HOLIDAYS[holidayKey];
    
    const activeEvents = holidayName 
      ? [{ id: `hol-${holidayKey}`, title: holidayName, time: 'Holiday', isReadOnly: true }, ...userEvents]
      : userEvents;

    const pageContent = (
      <>
        <HeroSection 
          month={m} 
          year={y} 
          onAddEvent={handleHeroAddEvent}
          isPriority={!isAnimLayer}
        />

        <div className="content-area" style={{ flex: 1, display: 'grid' }}>
          <div className="calendar-side" style={{ display: 'flex', flexDirection: 'column' }}>
            <MonthNav
              monthName={MONTH_NAMES[m]}
              year={y}
              onPrev={goToPrev}
              onNext={goToNext}
              disablePrev={m <= 0 || introRunning}
              disableNext={m >= 11 || introRunning}
            />
            <CalendarGrid
              month={m}
              year={y}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              direction={direction}
              enableMonthCellAnimation={!introRunning && !transitionState.active}
              events={events}
              onSingleDaySelect={handleSingleDaySelect}
              onRangeSelect={handleRangeSelection}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          </div>
          <NotesPanel
            title="Notes"
            subtitle={notesSubtitle}
            text={currentNoteText}
            labels={currentNoteLabels}
            onChange={handleNoteChange}
            onLabelsChange={handleNoteLabelsChange}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            events={activeEvents}
            onDeleteEvent={(id) => deleteEvent(activeDateKey, id)}
            onEditEvent={handleEditEvent}
          />
        </div>
      </>
    )

    if (isAnimLayer) {
      const isNextFlip = transitionState.direction > 0
    const layerStyle = {
      opacity: isNextFlip ? 1 : 0,
      transform: `rotateX(${isNextFlip ? 0 : 92}deg)`,
    }

      if (transitionState.active && flipViewportFrame) {
        layerStyle.top = flipViewportFrame.top
        layerStyle.left = flipViewportFrame.left
        layerStyle.width = flipViewportFrame.width
        layerStyle.height = flipViewportFrame.height
        layerStyle.borderRadius = flipViewportFrame.borderRadius
      } else {
        layerStyle.top = 0
        layerStyle.left = 0
        layerStyle.width = 0
        layerStyle.height = 0
      }

      return (
        <div
          key={keyStr}
          className="anim-layer"
          style={layerStyle}
        >
          <div className="calendar-inner-clip anim-layer-surface binding-hole-mask">
            {pageContent}
          </div>
        </div>
      )
    }

    return (
      <div key={keyStr} className="calendar-inner-clip static-layer">
        {pageContent}
      </div>
    )
  }

  return (
    <div className="app-wrapper">
      <div className="top-controls">
        <a href="https://abhashchakraborty.tech/" target="_blank" rel="noopener noreferrer" className="logo-badge" aria-label="Calendar logo">
          <img src={LOGO_IMAGE} alt="Calendar logo" loading="eager" decoding="async" fetchPriority="high" />
        </a>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <div className={`calendar-shadow-layer ${transitionState.active ? 'flip-active' : ''}`}>
        {Array.from({ length: Math.max(0, stackLayerCount) }, (_, index) => {
          const layer = index + 1
          const offset = layer * stackLayerSpacing

          return (
            <div
              key={`stack-${layer}`}
              className="stack-layer"
              style={{
                transform: `translate(${offset}px, ${offset}px)`,
                zIndex: -layer,
                boxShadow: layer === stackLayerCount ? '8px 8px 25px rgba(0,0,0,0.2)' : undefined,
              }}
            />
          )
        })}
        
        <SpiralBinding />
        
        <div className="calendar-container" ref={calendarContainerRef}>
          {!transitionState.active ? (
            renderPage(currentMonth, currentYear, 'static-normal', false)
          ) : transitionState.direction > 0 ? (
            renderPage(currentMonth, currentYear, 'static-new', false)
          ) : (
            renderPage(transitionState.oldMonth, transitionState.oldYear, 'static-old', false)
          )}
        </div>
      </div>

      {transitionState.active && (
        transitionState.direction > 0 ? (
          renderPage(transitionState.oldMonth, transitionState.oldYear, 'anim-old', true)
        ) : (
          renderPage(currentMonth, currentYear, 'anim-new', true)
        )
      )}

      {transitionState.active && flipViewportFrame && (
        <div
          className="spiral-overlay"
          style={{
            top: flipViewportFrame.top,
            left: flipViewportFrame.left,
            width: flipViewportFrame.width,
          }}
          aria-hidden="true"
        >
          <SpiralBinding renderMaskStyles={false} />
        </div>
      )}

      <div className="calendar-selection-hint" aria-hidden="true">
        <span>Click for one day. Hold + drag for range.</span>
      </div>

      <div className="app-footer-credit" aria-hidden="true">
        <span className="credit-text">© Abhash Chakraborty</span>
        <span className="credit-heart" role="img" aria-label="heart">❤</span>
      </div>

      <HolidayTooltip {...tooltip} />
      {isEventModalOpen && (
        <EventModal
          key={editingEvent?.id || `${currentYear}-${currentMonth}-${rangeStart?.getDate() || 1}-new`}
          date={rangeStart || new Date(currentYear, currentMonth, 1)}
          onSave={handleSaveEvent}
          onCloseComplete={() => setIsEventModalOpen(false)}
          initialEvent={editingEvent}
        />
      )}
    </div>
  )
}

export default App
