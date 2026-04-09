import { useEffect, useRef, useMemo, useCallback } from 'react'
import { gsap } from 'gsap'
import { HOLIDAYS } from '../data/constants'

export default function CalendarGrid({
  month, year, rangeStart, rangeEnd, direction, events,
  onSingleDaySelect, onRangeSelect, onShowTooltip, onHideTooltip, isLowMotion = false
}) {
  const gridRef = useRef(null)
  const prevMonth = useRef(month)
  const pressTimerRef = useRef(null)
  const interactionRef = useRef({
    pointerId: null,
    anchorDay: null,
    currentDay: null,
    rangeActive: false,
  })

  const today = new Date()
  const todayDate = today.getDate()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

  const clearPressTimer = useCallback(() => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }, [])

  const resetInteraction = useCallback(() => {
    clearPressTimer()
    interactionRef.current = {
      pointerId: null,
      anchorDay: null,
      currentDay: null,
      rangeActive: false,
    }
  }, [clearPressTimer])

  // Build calendar days
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    let startDow = firstDay.getDay()
    startDow = startDow === 0 ? 6 : startDow - 1 // Monday-based

    const prevMonthDays = new Date(year, month, 0).getDate()
    const cells = []

    // Previous month fillers
    for (let i = startDow - 1; i >= 0; i--) {
      cells.push({ day: prevMonthDays - i, isOther: true })
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d)
      const dow = date.getDay()
      
      const holidayKey = `${month}-${d}`
      const dateKeyStr = `${year}-${month + 1}-${d}`
      const dayEvents = events && events[dateKeyStr] ? events[dateKeyStr] : []
      let eventColors = []
      
      if (dayEvents.length > 0) {
        eventColors = [...new Set(dayEvents.map(e => e.color).filter(Boolean))].slice(0, 3)
      }
      
      cells.push({
        day: d,
        isOther: false,
        isSaturday: dow === 6,
        isSunday: dow === 0,
        isToday: isCurrentMonth && d === todayDate,
        holiday: HOLIDAYS[holidayKey] || null,
        eventColors,
        date
      })
    }

    // Next month fillers
    const totalCells = cells.length
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isOther: true })
    }

    return cells
  }, [month, year, isCurrentMonth, events, todayDate])

  // Stagger animation on month change
  useEffect(() => {
    if (prevMonth.current === month) return
    prevMonth.current = month

    if (isLowMotion) return

    const dayCells = gridRef.current?.querySelectorAll('.day-cell:not(.other-month)')
    if (dayCells && dayCells.length) {
      gsap.killTweensOf(dayCells)
      gsap.fromTo(dayCells, {
        scale: 0.9,
        opacity: 0,
        y: direction >= 0 ? 8 : -8,
      }, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.32,
        ease: 'power2.out',
        overwrite: 'auto',
        stagger: {
          each: 0.012,
          from: direction >= 0 ? 'start' : 'end',
        },
        clearProps: 'opacity,transform',
      })
    }
  }, [month, direction, isLowMotion])

  useEffect(() => {
    if (isLowMotion) return

    const activeCells = gridRef.current?.querySelectorAll('.day-cell.range-start, .day-cell.range-end, .day-cell.in-range')
    if (!activeCells?.length) return

    gsap.killTweensOf(activeCells)
    gsap.fromTo(activeCells, {
      scale: 0.94,
      y: 4,
    }, {
      scale: 1,
      y: 0,
      duration: 0.26,
      ease: 'power2.out',
      overwrite: 'auto',
      stagger: {
        each: 0.014,
        from: 'center',
      },
      clearProps: 'transform',
    })
  }, [month, rangeStart, rangeEnd, isLowMotion])

  const updateRangeFromPoint = useCallback((clientX, clientY) => {
    const state = interactionRef.current
    if (!state.rangeActive || state.anchorDay == null) return

    const target = document.elementFromPoint(clientX, clientY)?.closest('.day-cell[data-day]')
    if (!target || !gridRef.current?.contains(target)) return

    const nextDay = Number(target.dataset.day)
    if (!Number.isFinite(nextDay) || nextDay === state.currentDay) return

    state.currentDay = nextDay
    onRangeSelect(state.anchorDay, nextDay)
  }, [onRangeSelect])

  useEffect(() => {
    const finishInteraction = (pointerId = null) => {
      const state = interactionRef.current
      if (state.pointerId == null || (pointerId != null && state.pointerId !== pointerId)) return

      const anchorDay = state.anchorDay
      const currentDay = state.currentDay ?? anchorDay
      const useRange = state.rangeActive && anchorDay != null && currentDay != null && currentDay !== anchorDay

      if (anchorDay != null) {
        if (useRange) {
          onRangeSelect(anchorDay, currentDay)
        } else {
          onSingleDaySelect(anchorDay)
        }
      }

      resetInteraction()
    }

    const handlePointerMove = (event) => {
      if (interactionRef.current.pointerId == null || interactionRef.current.pointerId !== event.pointerId) return
      updateRangeFromPoint(event.clientX, event.clientY)
    }

    const handlePointerUp = (event) => {
      finishInteraction(event.pointerId)
    }

    const handlePointerCancel = (event) => {
      finishInteraction(event.pointerId)
    }

    const handleBlur = () => {
      finishInteraction()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
      window.removeEventListener('blur', handleBlur)
    }
  }, [onRangeSelect, onSingleDaySelect, resetInteraction, updateRangeFromPoint])

  useEffect(() => {
    return () => {
      resetInteraction()
    }
  }, [resetInteraction])

  // Range helpers
  const getDateValue = (d) => d ? d.getTime() : null
  const startTime = getDateValue(rangeStart)
  const endTime = getDateValue(rangeEnd)
  const actualStartTime = startTime && endTime ? Math.min(startTime, endTime) : startTime
  const actualEndTime = startTime && endTime ? Math.max(startTime, endTime) : endTime

  const getRangeClass = (date) => {
    if (!date || !startTime) return ''
    const t = date.getTime()
    if (actualEndTime) {
      if (t === actualStartTime && t === actualEndTime) return 'range-start range-end'
      if (t === actualStartTime) return 'range-start'
      if (t === actualEndTime) return 'range-end'
      if (t > actualStartTime && t < actualEndTime) return 'in-range'
    } else {
      if (t === startTime) return 'range-start range-end'
    }
    return ''
  }

  const handleHolidayHover = (e, holiday) => {
    if (!holiday) return
    const rect = e.currentTarget.getBoundingClientRect()
    onShowTooltip(`🎉 ${holiday}`, rect.left + rect.width / 2, rect.top - 8)
  }

  const handlePointerDown = (day) => (event) => {
    if (event.button !== undefined && event.button !== 0) return

    event.preventDefault()
    resetInteraction()

    interactionRef.current = {
      pointerId: event.pointerId,
      anchorDay: day,
      currentDay: day,
      rangeActive: false,
    }

    if (!isLowMotion) {
      gsap.fromTo(event.currentTarget, {
        scale: 0.92,
      }, {
        scale: 1,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
        clearProps: 'transform',
      })
    }

    pressTimerRef.current = window.setTimeout(() => {
      interactionRef.current.rangeActive = true
      onRangeSelect(day, day)

      if (!isLowMotion) {
        gsap.fromTo(event.currentTarget, {
          boxShadow: '0 0 0 rgba(46,134,171,0)',
        }, {
          boxShadow: '0 0 0 8px rgba(46,134,171,0.08)',
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto',
        })
      }
    }, 190)
  }

  return (
    <div className="calendar-section">
      <div className="calendar-grid" ref={gridRef}>
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
          <div key={d} className={`weekday-header ${i === 5 ? 'sat' : ''} ${i === 6 ? 'sun' : ''}`}>{d}</div>
        ))}

        {days.map((cell, idx) => {
          if (cell.isOther) {
            return <div key={`o-${idx}`} className="day-cell other-month">{cell.day}</div>
          }

          const rangeClass = getRangeClass(cell.date)
          const classes = [
            'day-cell',
            cell.isSaturday && 'saturday',
            cell.isSunday && 'sunday',
            cell.isToday && 'today',
            cell.holiday && 'holiday',
            rangeClass
          ].filter(Boolean).join(' ')
          
          return (
            <div
              key={`d-${cell.day}`}
              data-day={cell.day}
              className={classes}
              onPointerDown={handlePointerDown(cell.day)}
              onMouseEnter={(e) => handleHolidayHover(e, cell.holiday)}
              onMouseLeave={onHideTooltip}
            >
              <div className="day-number">
                <span className="day-number-label">{cell.day}</span>
              </div>
              
              {cell.eventColors && cell.eventColors.length > 0 && (
                <div className="event-dots-container">
                  {cell.eventColors.map((color, i) => (
                    <span
                      key={i}
                      className="event-dot"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
