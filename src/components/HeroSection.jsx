import { MONTH_NAMES, MONTH_IMAGES } from '../data/constants'

export default function HeroSection({ month, year, onAddEvent }) {
  return (
    <div className="hero-section">
      <div className="hero-image-wrapper">
        <img
          className="hero-image"
          src={MONTH_IMAGES[month]}
          alt={`${MONTH_NAMES[month]} landscape`}
          style={{ position: 'relative', zIndex: 2 }}
        />
        <div className="hero-overlay" style={{ zIndex: 4 }} />
        
        <div className="hero-controls">
          <button className="add-event-btn" onClick={onAddEvent}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Add Event
          </button>
        </div>

        <div className="hero-text" style={{ zIndex: 5 }}>
          <span className="hero-year">{year}</span>
          <span className="hero-month">{MONTH_NAMES[month].toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}
