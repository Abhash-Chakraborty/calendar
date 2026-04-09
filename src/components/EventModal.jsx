import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const EVENT_COLORS = ['#e8657a', '#6bbf59', '#30b4c5', '#9b7fd4', '#f0a04b', '#8b7355']

export default function EventModal({ date, onSave, onCloseComplete, initialEvent }) {
  const overlayRef = useRef(null)
  const modalRef = useRef(null)
  const closingRef = useRef(false)
  const [title, setTitle] = useState(() => initialEvent?.title || '')
  const [time, setTime] = useState(() => initialEvent?.time || '')
  const [color, setColor] = useState(() => initialEvent?.color || EVENT_COLORS[0])

  useLayoutEffect(() => {
    const overlay = overlayRef.current
    const modal = modalRef.current
    if (!overlay || !modal) return

    gsap.set(overlay, { opacity: 0 })
    gsap.set(modal, { opacity: 0, y: 24, scale: 0.94, willChange: 'transform, opacity' })

    gsap.timeline()
      .to(overlay, {
        opacity: 1,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: 'auto',
      })
      .to(modal, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: 'back.out(1.4)',
        overwrite: 'auto',
        force3D: true,
        onComplete: () => {
          gsap.set(modal, { clearProps: 'willChange' })
        },
      }, 0)

    return () => {
      gsap.killTweensOf([overlay, modal])
      gsap.set(modal, { clearProps: 'willChange' })
    }
  }, [])

  const requestClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    const overlay = overlayRef.current
    const modal = modalRef.current
    if (!overlay || !modal) {
      onCloseComplete?.()
      return
    }

    gsap.killTweensOf([overlay, modal])
    gsap.set(modal, { willChange: 'transform, opacity' })

    gsap.timeline({
      onComplete: () => {
        gsap.set(modal, { clearProps: 'willChange' })
        onCloseComplete?.()
      },
    })
      .to(modal, {
        opacity: 0,
        y: 16,
        scale: 0.97,
        duration: 0.18,
        ease: 'power2.in',
        overwrite: 'auto',
        force3D: true,
      })
      .to(overlay, {
        opacity: 0,
        duration: 0.14,
        ease: 'power2.in',
        overwrite: 'auto',
      }, 0.02)
  }

  const handleSave = () => {
    if (!title.trim()) return
    onSave({
      id: initialEvent ? initialEvent.id : Date.now().toString(),
      title: title.trim(),
      time,
      color,
    }, !!initialEvent)
    requestClose()
  }

  const formattedDate = date ? `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}` : ''

  return (
    <div className="event-modal-overlay" ref={overlayRef} onClick={requestClose}>
      <div className="event-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="event-modal-header">
          <h3>{initialEvent ? 'Edit Event' : 'Add Event'}</h3>
          <button className="close-btn" onClick={requestClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="event-modal-body">
          <p className="event-modal-date">{formattedDate}</p>
          <div className="input-group">
            <label>Event Title</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Doctor's Appointment"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="input-group">
            <label>Time (Optional)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="input-group">
            <label>Event Color</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {EVENT_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  onClick={() => setColor(swatch)}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%', backgroundColor: swatch,
                    border: color === swatch ? '2px solid var(--text-primary)' : '2px solid transparent',
                    cursor: 'pointer', padding: 0, transition: 'transform 0.1s'
                  }}
                  title={`Select color ${swatch}`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="event-modal-footer">
          <button className="btn-cancel" onClick={requestClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave} disabled={!title.trim()}>Save Event</button>
        </div>
      </div>
    </div>
  )
}
