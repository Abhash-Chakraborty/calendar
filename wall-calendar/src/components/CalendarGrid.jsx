import { useEffect, useRef, useMemo } from 'react'
import anime from 'animejs'
import { HOLIDAYS } from '../data/constants'

export default function CalendarGrid({
  month, year, rangeStart, rangeEnd, direction,
  onDayClick, onToday, onShowTooltip, onHideTooltip
}) {
  const gridRef = useRef(null)
  const prevMonth = useRef(month)

  const today = new Date()
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year

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
      cells.push({
        day: d,
        isOther: false,
        isSaturday: dow === 6,
        isSunday: dow === 0,
        isToday: isCurrentMonth && d === today.getDate(),
        holiday: HOLIDAYS[holidayKey] || null,
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
  }, [month, year, isCurrentMonth])

  // Stagger animation on month change
  useEffect(() => {
    if (prevMonth.current === month) return
    prevMonth.current = month

    const dayCells = gridRef.current?.querySelectorAll('.day-cell:not(.other-month)')
    if (dayCells && dayCells.length) {
      anime({
        targets: dayCells,
        scale: [0.6, 1],
        opacity: [0, 1],
        delay: anime.stagger(15, { grid: [7, Math.ceil(dayCells.length / 7)], from: direction >= 0 ? 'first' : 'last' }),
        duration: 350,
        easing: 'easeOutBack',
      })
    }
  }, [month, direction])

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
              className={classes}
              onClick={() => onDayClick(cell.day)}
              onMouseEnter={(e) => handleHolidayHover(e, cell.holiday)}
              onMouseLeave={onHideTooltip}
            >
              {cell.day}
            </div>
          )
        })}
      </div>

      <button className="today-btn" onClick={onToday} style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        Today
      </button>
    </div>
  )
}
