import { useState, useEffect, useCallback, useRef } from 'react'
import { gsap } from 'gsap'
import SpiralBinding from './components/SpiralBinding'
import HeroSection from './components/HeroSection'
import MonthNav from './components/MonthNav'
import CalendarGrid from './components/CalendarGrid'
import NotesPanel from './components/NotesPanel'
import ThemeToggle from './components/ThemeToggle'
import HolidayTooltip from './components/HolidayTooltip'
import EventModal from './components/EventModal'
import { MONTH_NAMES, HOLIDAYS } from './data/constants'
import './App.css'

function normalizeNoteEntry(entry) {
  if (typeof entry === 'string') {
    return { text: entry, labels: [] }
  }

  return {
    text: entry?.text || '',
    labels: Array.isArray(entry?.labels) ? entry.labels.slice(0, 2) : [],
  }
}

function detectLowMotionMode() {
  if (typeof window === 'undefined') {
    return false
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
  const lowMemory = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4

  return reducedMotion || coarsePointer || lowCpu || lowMemory
}

function App() {
  const today = new Date()
  const targetMonth = today.getMonth()
  const calendarYear = today.getFullYear()
  const stackLayerSpacing = 1.5
  const [lowMotionMode] = useState(() => detectLowMotionMode())

  // Start at January (0) for the intro animation
  const getTodayZero = () => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  const [currentMonth, setCurrentMonth] = useState(() => (lowMotionMode ? targetMonth : 0))
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
  const introComplete = useRef(targetMonth === 0 || lowMotionMode)
  const introTimerRef = useRef(null)
  const themeSyncTimerRef = useRef(null)
  const [introRunning, setIntroRunning] = useState(targetMonth > 0 && !lowMotionMode)

  const [transitionState, setTransitionState] = useState({
    active: false,
    direction: 0,
    oldMonth: 0,
    oldYear: 0
  })

  // Dynamic stack: remaining months below current
  const stackLayerCount = lowMotionMode ? 0 : 11 - currentMonth

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wallCalendarTheme', theme)
  }, [theme])

  // Save notes & events
  useEffect(() => {
    localStorage.setItem('wallCalendarNotes', JSON.stringify(notes))
  }, [notes])
  useEffect(() => {
    localStorage.setItem('wallCalendarEvents', JSON.stringify(events))
  }, [events])

  useEffect(() => {
    const root = document.documentElement
    let rafId = null

    const syncVisualViewport = () => {
      const viewport = window.visualViewport
      const layoutHeight = document.documentElement.clientHeight
      const measuredSafeAreaBottom = Math.max(0, window.innerHeight - layoutHeight)

      if (!viewport) {
        const fallbackHeight = Math.max(window.innerHeight, layoutHeight)
        root.style.setProperty('--app-visual-height', `${fallbackHeight}px`)
        root.style.setProperty('--app-viewport-offset-bottom', '0px')
        root.style.setProperty('--app-safe-area-bottom-measured', `${measuredSafeAreaBottom}px`)
        return
      }

      const visualBottom = viewport.height + viewport.offsetTop

      const offsetBottom = Math.max(
        0,
        layoutHeight - visualBottom,
        window.innerHeight - visualBottom
      )

      root.style.setProperty('--app-visual-height', `${viewport.height}px`)
      root.style.setProperty('--app-viewport-offset-bottom', `${offsetBottom}px`)
      root.style.setProperty('--app-safe-area-bottom-measured', `${measuredSafeAreaBottom}px`)
    }

    const scheduleSync = () => {
      if (rafId !== null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        syncVisualViewport()
      })
    }

    scheduleSync()

    window.addEventListener('resize', scheduleSync, { passive: true })
    window.visualViewport?.addEventListener('resize', scheduleSync, { passive: true })
    window.visualViewport?.addEventListener('scroll', scheduleSync, { passive: true })

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId)
      }
      window.removeEventListener('resize', scheduleSync)
      window.visualViewport?.removeEventListener('resize', scheduleSync)
      window.visualViewport?.removeEventListener('scroll', scheduleSync)
      root.style.removeProperty('--app-visual-height')
      root.style.removeProperty('--app-viewport-offset-bottom')
      root.style.removeProperty('--app-safe-area-bottom-measured')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    const root = document.documentElement
    if (!lowMotionMode) {
      root.classList.add('theme-syncing')
    }

    if (themeSyncTimerRef.current) {
      window.clearTimeout(themeSyncTimerRef.current)
      themeSyncTimerRef.current = null
    }

    setTheme(t => t === 'dark' ? 'light' : 'dark')

    if (lowMotionMode) {
      root.classList.remove('theme-syncing')
      return
    }

    if (!lowMotionMode) {
      gsap.to('.theme-toggle', {
        rotate: '+=180',
        duration: 0.4,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    }

    themeSyncTimerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-syncing')
      themeSyncTimerRef.current = null
    }, lowMotionMode ? 240 : 420)
  }, [lowMotionMode])

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

    const dur = lowMotionMode ? 0.24 : introRunning ? 0.5 : 0.78
    const completeTransition = () => setTransitionState(s => ({ ...s, active: false }))

    if (lowMotionMode) {
      const isNextFlip = transitionState.direction > 0

      gsap.fromTo(el, {
        opacity: isNextFlip ? 1 : 0,
        y: isNextFlip ? 0 : 10,
      }, {
        opacity: isNextFlip ? 0 : 1,
        y: isNextFlip ? -10 : 0,
        duration: dur,
        ease: 'power1.out',
        overwrite: 'auto',
        onComplete: completeTransition,
      })

      return () => {
        gsap.killTweensOf(el)
      }
    }

    if (transitionState.direction > 0) {
      gsap.fromTo(el, {
        rotationX: 0,
        y: 0,
        opacity: 1,
        transformOrigin: '50% 0%',
      }, {
        rotationX: -92,
        y: -10,
        opacity: 0,
        duration: dur,
        ease: introRunning ? 'power2.inOut' : 'power3.inOut',
        force3D: true,
        overwrite: 'auto',
        onComplete: completeTransition,
      })
    } else {
      gsap.fromTo(el, {
        rotationX: -92,
        y: -10,
        opacity: 0,
        transformOrigin: '50% 0%',
      }, {
        rotationX: 0,
        y: 0,
        opacity: 1,
        duration: dur,
        ease: introRunning ? 'power2.inOut' : 'power3.inOut',
        force3D: true,
        overwrite: 'auto',
        onComplete: completeTransition,
      })
    }

    return () => {
      gsap.killTweensOf(el)
    }
  }, [transitionState.active, transitionState.direction, introRunning, lowMotionMode])

  // Intro flip sequence: January → current month
  useEffect(() => {
    if (introComplete.current || targetMonth === 0 || lowMotionMode) {
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
  }, [calendarYear, targetMonth, lowMotionMode])

  // Single-year lock: no going before January
  const goToPrev = useCallback(() => {
    if (transitionState.active || introRunning) return
    if (currentMonth <= 0) return

    if (lowMotionMode) {
      setDirection(-1)
      setCurrentMonth(m => m - 1)
      return
    }

    setTransitionState({ active: true, direction: -1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(-1)
    setCurrentMonth(m => m - 1)
  }, [currentMonth, currentYear, transitionState.active, introRunning, lowMotionMode])

  // Single-year lock: no going past December
  const goToNext = useCallback(() => {
    if (transitionState.active || introRunning) return
    if (currentMonth >= 11) return

    if (lowMotionMode) {
      setDirection(1)
      setCurrentMonth(m => m + 1)
      return
    }

    setTransitionState({ active: true, direction: 1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(1)
    setCurrentMonth(m => m + 1)
  }, [currentMonth, currentYear, transitionState.active, introRunning, lowMotionMode])

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
  let notesTitle = 'Notes'
  if (rangeStart && rangeEnd) {
    const s = formatShort(rangeStart), e = formatShort(rangeEnd)
    notesTitle = s === e ? `Notes — ${s}` : `Notes — ${s} to ${e}`
  } else if (rangeStart) {
    notesTitle = `Notes — ${formatShort(rangeStart)}`
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
              isLowMotion={lowMotionMode}
              isAnimLayer={isAnimLayer}
            />
            <CalendarGrid
              month={m}
              year={y}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              direction={direction}
              events={events}
              onSingleDaySelect={handleSingleDaySelect}
              onRangeSelect={handleRangeSelection}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
              isLowMotion={lowMotionMode}
            />
          </div>
          <NotesPanel
            title={notesTitle}
            text={currentNoteText}
            labels={currentNoteLabels}
            onChange={handleNoteChange}
            onLabelsChange={handleNoteLabelsChange}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            events={activeEvents}
            onDeleteEvent={(id) => deleteEvent(activeDateKey, id)}
            onEditEvent={handleEditEvent}
            isLowMotion={lowMotionMode}
          />
        </div>
      </>
    )

    if (isAnimLayer) {
      const isNextFlip = transitionState.direction > 0

      return (
        <div
          key={keyStr}
          className="calendar-inner-clip anim-layer"
          style={{
            opacity: isNextFlip ? 1 : 0,
            transform: `rotateX(${isNextFlip ? 0 : -110}deg)`,
          }}
        >
          {pageContent}
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
    <div className={`app-wrapper ${lowMotionMode ? 'app-wrapper-lite' : ''}`}>
      <div className="top-controls">
        <a href="https://abhashchakraborty.tech/" target="_blank" rel="noopener noreferrer" className="logo-badge" aria-label="Calendar logo">
          <img src="/Logo.svg" alt="Calendar logo" />
        </a>
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <div className="calendar-shadow-layer">
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
        
        <div className="calendar-container">
          {!transitionState.active ? (
            renderPage(currentMonth, currentYear, 'static-normal', false)
          ) : transitionState.direction > 0 ? (
            renderPage(currentMonth, currentYear, 'static-new', false)
          ) : (
            renderPage(transitionState.oldMonth, transitionState.oldYear, 'static-old', false)
          )}

          {transitionState.active && (
            transitionState.direction > 0 ? (
              renderPage(transitionState.oldMonth, transitionState.oldYear, 'anim-old', true)
            ) : (
              renderPage(currentMonth, currentYear, 'anim-new', true)
            )
          )}
        </div>
      </div>

      <div className="calendar-selection-hint" aria-hidden="true">
        <span>Click for one day. Hold + drag for range.</span>
      </div>

      <div className="app-footer-credit" aria-hidden="true">
        <span className="credit-text">© Abhash Chakraborty</span>
        <span className="credit-heart" role="img" aria-label="heart">❤</span>
      </div>

      <div className="mobile-nav-floating" aria-label="Month navigation">
        <button
          className={`nav-btn mobile-nav-btn ${currentMonth <= 0 || introRunning ? 'nav-btn-disabled' : ''}`}
          onClick={goToPrev}
          aria-label="Previous month"
          disabled={currentMonth <= 0 || introRunning}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
        </button>
        <button
          className={`nav-btn mobile-nav-btn ${currentMonth >= 11 || introRunning ? 'nav-btn-disabled' : ''}`}
          onClick={goToNext}
          aria-label="Next month"
          disabled={currentMonth >= 11 || introRunning}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
      </div>

      <HolidayTooltip {...tooltip} />
      {isEventModalOpen && (
        <EventModal
          key={editingEvent?.id || `${currentYear}-${currentMonth}-${rangeStart?.getDate() || 1}-new`}
          date={rangeStart || new Date(currentYear, currentMonth, 1)}
          onSave={handleSaveEvent}
          onCloseComplete={() => setIsEventModalOpen(false)}
          initialEvent={editingEvent}
          isLowMotion={lowMotionMode}
        />
      )}
    </div>
  )
}

export default App
