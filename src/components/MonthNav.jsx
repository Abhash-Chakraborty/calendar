import { useRef } from 'react'
import { gsap } from 'gsap'

export default function MonthNav({ monthName, year, onPrev, onNext, disablePrev, disableNext }) {
  const titleRef = useRef(null)
  const prevRef = useRef(null)
  const nextRef = useRef(null)

  const handleNav = (cb, disabled, direction) => {
    if (disabled) return

    const button = direction < 0 ? prevRef.current : nextRef.current
    const titleShift = direction < 0 ? 6 : -6
    const buttonKick = direction < 0 ? -1.5 : 1.5

    gsap.killTweensOf([titleRef.current, button])

    gsap.timeline()
      .fromTo(titleRef.current, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
      }, {
        opacity: 0.72,
        y: titleShift,
        filter: 'blur(2px)',
        duration: 0.14,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
        clearProps: 'y,filter',
      }, 0)
      .fromTo(button, {
        scale: 1,
        y: 0,
      }, {
        scale: 1.04,
        y: buttonKick,
        duration: 0.12,
        ease: 'power2.out',
        yoyo: true,
        repeat: 1,
      }, 0)

    cb()
  }

  return (
    <div className="month-nav">
      <button
        ref={prevRef}
        className={`nav-btn nav-btn-prev ${disablePrev ? 'nav-btn-disabled' : ''}`}
        onClick={() => handleNav(onPrev, disablePrev, -1)}
        aria-label="Previous month"
        disabled={disablePrev}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
      </button>
      <div className="nav-title" ref={titleRef}>
        <span className="nav-month-name">{monthName}</span>
        <span className="nav-year">{year}</span>
      </div>
      <button
        ref={nextRef}
        className={`nav-btn nav-btn-next ${disableNext ? 'nav-btn-disabled' : ''}`}
        onClick={() => handleNav(onNext, disableNext, 1)}
        aria-label="Next month"
        disabled={disableNext}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
    </div>
  )
}
