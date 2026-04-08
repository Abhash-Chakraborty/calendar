import { MONTH_NAMES, MONTH_IMAGES } from '../data/constants'

export default function HeroSection({ month, year }) {
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
        <div className="hero-text" style={{ zIndex: 5 }}>
          <span className="hero-year">{year}</span>
          <span className="hero-month">{MONTH_NAMES[month].toUpperCase()}</span>
        </div>
      </div>
    </div>
  )
}

