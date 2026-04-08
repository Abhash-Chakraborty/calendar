import { useState, useEffect, useCallback, useRef } from 'react'
import anime from 'animejs'
import SpiralBinding from './components/SpiralBinding'
import HeroSection from './components/HeroSection'
import MonthNav from './components/MonthNav'
import CalendarGrid from './components/CalendarGrid'
import NotesPanel from './components/NotesPanel'
import ThemeToggle from './components/ThemeToggle'
import HolidayTooltip from './components/HolidayTooltip'
import { MONTH_NAMES, HOLIDAYS } from './data/constants'
import './App.css'

function App() {
  const today = new Date()
  const stackLayerCount = 12
  const stackLayerSpacing = 1.5
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('wallCalendarTheme') || 'light')
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wallCalendarNotes') || '{}') }
    catch { return {} }
  })
  const prevMonth = useRef(currentMonth)
  const [tooltip, setTooltip] = useState({ visible: false, text: '', x: 0, y: 0 })
  const [direction, setDirection] = useState(0) // -1 = prev, 1 = next, 0 = none
  const containerRef = useRef(null)

  const [transitionState, setTransitionState] = useState({
    active: false,
    direction: 0,
    oldMonth: 0,
    oldYear: 0
  })

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('wallCalendarTheme', theme)
  }, [theme])

  // Save notes
  useEffect(() => {
    localStorage.setItem('wallCalendarNotes', JSON.stringify(notes))
  }, [notes])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
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

  // Swipe support
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startX = 0, startY = 0
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) goToPrev(); else goToNext()
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  })



  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
    anime({
      targets: '.theme-toggle',
      rotate: '1turn',
      duration: 500,
      easing: 'easeInOutQuad',
    })
  }, [])

  // Page flip animation — simple, smooth, no z-index tricks
  useEffect(() => {
    if (!transitionState.active) return
    const el = document.querySelector('.anim-layer')
    if (!el) return

    anime.remove(el)

    if (transitionState.direction > 0) {
      // NEXT: Old page lifts up and away
      anime({
        targets: el,
        rotateX: [0, -110],
        opacity: [1, 0],
        duration: 800,
        easing: 'easeInOutQuart',
        complete: () => setTransitionState(s => ({ ...s, active: false }))
      })
    } else {
      // PREV: New page drops down into place
      anime({
        targets: el,
        rotateX: [-110, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeInOutQuart',
        complete: () => setTransitionState(s => ({ ...s, active: false }))
      })
    }
  }, [transitionState])

  const goToPrev = useCallback(() => {
    if (transitionState.active) return
    setTransitionState({ active: true, direction: -1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(-1)
    setCurrentMonth(m => {
      if (m <= 0) { setCurrentYear(y => y - 1); return 11 }
      return m - 1
    })
  }, [currentMonth, currentYear, transitionState.active])

  const goToNext = useCallback(() => {
    if (transitionState.active) return
    setTransitionState({ active: true, direction: 1, oldMonth: currentMonth, oldYear: currentYear })
    setDirection(1)
    setCurrentMonth(m => {
      if (m >= 11) { setCurrentYear(y => y + 1); return 0 }
      return m + 1
    })
  }, [currentMonth, currentYear, transitionState.active])

  const goToToday = useCallback(() => {
    const t = new Date()
    setDirection(0)
    setCurrentMonth(t.getMonth())
    setCurrentYear(t.getFullYear())
    setRangeStart(new Date(t.getFullYear(), t.getMonth(), t.getDate()))
    setRangeEnd(new Date(t.getFullYear(), t.getMonth(), t.getDate()))
    setSelecting(false)
  }, [])

  const handleDayClick = useCallback((day) => {
    const clicked = new Date(currentYear, currentMonth, day)
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(clicked)
      setRangeEnd(null)
      setSelecting(true)
    } else if (selecting) {
      let start = rangeStart, end = clicked
      if (start > end) { const tmp = start; start = end; end = tmp }
      setRangeStart(start)
      setRangeEnd(end)
      setSelecting(false)
    }
  }, [currentMonth, currentYear, rangeStart, rangeEnd, selecting])

  const clearSelection = useCallback(() => {
    setRangeStart(null)
    setRangeEnd(null)
    setSelecting(false)
  }, [])

  const handleNoteChange = useCallback((text) => {
    const formatShort = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    
    let key
    if (rangeStart && rangeEnd) {
      key = `${formatShort(rangeStart)}_to_${formatShort(rangeEnd)}`
    } else if (rangeStart) {
      key = formatShort(rangeStart)
    } else {
      key = `month_${currentYear}_${currentMonth}`
    }

    setNotes(prev => ({ ...prev, [key]: text }))
  }, [rangeStart, rangeEnd, currentMonth, currentYear])

  const showTooltip = useCallback((text, x, y) => {
    setTooltip({ visible: true, text, x, y })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }))
  }, [])

  // Current active note text
  const getNoteKey = () => {
    const formatShort = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
    if (rangeStart && rangeEnd) {
      return `${formatShort(rangeStart)}_to_${formatShort(rangeEnd)}`
    } else if (rangeStart) {
      return formatShort(rangeStart)
    }
    return `month_${currentYear}_${currentMonth}`
  }
  
  const currentNoteText = notes[getNoteKey()] || ''

  // Notes title
  const formatShort = (d) => `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}`
  let notesTitle = 'Notes'
  if (rangeStart && rangeEnd) {
    const s = formatShort(rangeStart), e = formatShort(rangeEnd)
    notesTitle = s === e ? `Notes — ${s}` : `Notes — ${s} to ${e}`
  } else if (rangeStart) {
    notesTitle = `Notes — ${formatShort(rangeStart)}`
  }

  const renderPage = (m, y, keyStr, isAnimLayer) => {
    const pageContent = (
      <>
        <HeroSection month={m} year={y} />

        <div className="content-area" style={{ flex: 1, display: 'grid' }}>
          <div className="calendar-side" style={{ display: 'flex', flexDirection: 'column' }}>
            <MonthNav
              monthName={MONTH_NAMES[m]}
              year={y}
              onPrev={goToPrev}
              onNext={goToNext}
            />
            <CalendarGrid
              month={m}
              year={y}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              direction={direction}
              onDayClick={handleDayClick}
              onToday={goToToday}
              onClearSelection={clearSelection}
              onShowTooltip={showTooltip}
              onHideTooltip={hideTooltip}
            />
          </div>
          <NotesPanel
            title={notesTitle}
            text={currentNoteText}
            onChange={handleNoteChange}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
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
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className="calendar-shadow-layer">
        {Array.from({ length: stackLayerCount }, (_, index) => {
          const layer = index + 1
          const offset = layer * stackLayerSpacing

          return (
            <div
              key={layer}
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
        
        <div className="calendar-container" ref={containerRef}>
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
      <HolidayTooltip {...tooltip} />
    </div>
  )
}

export default App
