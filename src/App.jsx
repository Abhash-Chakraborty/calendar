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
  const themeSyncTimerRef = useRef(null)
  const [introRunning, setIntroRunning] = useState(targetMonth > 0)

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
    }

    setTheme(t => t === 'dark' ? 'light' : 'dark')

    gsap.to('.theme-toggle', {
      rotate: '+=180',
      duration: 0.55,
      ease: 'power2.inOut',
    })

    themeSyncTimerRef.current = window.setTimeout(() => {
      root.classList.remove('theme-syncing')
      themeSyncTimerRef.current = null
    }, 420)
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

    const dur = introRunning ? 0.54 : 0.9
    const completeTransition = () => setTransitionState(s => ({ ...s, active: false }))

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
        onComplete: completeTransition,
      })
    }

    return () => {
      gsap.killTweensOf(el)
    }
  }, [transitionState.active, transitionState.direction, introRunning])

  // Intro flip sequence: January → current month
  useEffect(() => {
    if (introComplete.current || targetMonth === 0) {
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
  }, [calendarYear, targetMonth])

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
  })

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
    <div className="app-wrapper">
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
