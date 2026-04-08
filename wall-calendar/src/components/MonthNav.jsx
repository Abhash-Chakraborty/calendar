import { useRef } from 'react'
import anime from 'animejs'

export default function MonthNav({ monthName, year, onPrev, onNext }) {
  const titleRef = useRef(null)

  const handleNav = (cb) => {
    anime({
      targets: titleRef.current,
      opacity: [1, 0, 1],
      translateY: [0, -8, 0],
      duration: 400,
      easing: 'easeInOutQuad',
    })
    cb()
  }

  return (
    <div className="month-nav">
      <button className="nav-btn" onClick={() => handleNav(onPrev)} aria-label="Previous month">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
      </button>
      <div className="nav-title" ref={titleRef}>
        <span className="nav-month-name">{monthName}</span>
        <span className="nav-year">{year}</span>
      </div>
      <button className="nav-btn" onClick={() => handleNav(onNext)} aria-label="Next month">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
      </button>
    </div>
  )
}
