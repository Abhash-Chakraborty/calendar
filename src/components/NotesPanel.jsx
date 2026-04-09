import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const LABEL_COLORS = ['#e76f92', '#f2a65a', '#6bbf59', '#30b4c5', '#7f88ff', '#9b7fd4']

export default function NotesPanel({
  title,
  subtitle = '',
  text,
  labels = [],
  onChange,
  onLabelsChange,
  events = [],
  onDeleteEvent,
  onEditEvent,
}) {
  const eventsShellRef = useRef(null)
  const eventsInnerRef = useRef(null)
  const notesTitleRef = useRef(null)
  const hasMountedRef = useRef(false)
  const wasVisibleRef = useRef(events.length > 0)
  const previousCountRef = useRef(events.length)
  const paletteWrapRef = useRef(null)
  const paletteListRef = useRef(null)
  const addBtnRef = useRef(null)
  const [draftLabelName, setDraftLabelName] = useState('')
  const [draftLabelColor, setDraftLabelColor] = useState(LABEL_COLORS[0])
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(() => (
    typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches
  ))
  const canAddLabel = draftLabelName.trim().length > 0 && labels.length < 2
  const previousCanAddRef = useRef(canAddLabel)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const mediaQuery = window.matchMedia('(max-width: 720px)')
    const syncMobileView = () => {
      setIsMobileView(mediaQuery.matches)
    }

    syncMobileView()

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncMobileView)
      return () => {
        mediaQuery.removeEventListener('change', syncMobileView)
      }
    }

    mediaQuery.addListener(syncMobileView)
    return () => {
      mediaQuery.removeListener(syncMobileView)
    }
  }, [])

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.time && !b.time) return 0
    if (!a.time) return 1
    if (!b.time) return -1
    return a.time.localeCompare(b.time)
  })

  useLayoutEffect(() => {
    const shell = eventsShellRef.current
    const inner = eventsInnerRef.current
    const notesTitle = notesTitleRef.current
    const hasEvents = sortedEvents.length > 0
    const countChanged = previousCountRef.current !== sortedEvents.length

    if (!shell || !inner || !notesTitle) return

    gsap.killTweensOf(shell)
    gsap.killTweensOf(inner)
    gsap.killTweensOf(notesTitle)

    if (!hasMountedRef.current) {
      gsap.set(shell, {
        height: hasEvents ? 'auto' : 0,
        pointerEvents: hasEvents ? 'auto' : 'none',
      })
      gsap.set(inner, {
        y: hasEvents ? 0 : -18,
        opacity: hasEvents ? 1 : 0,
      })
      hasMountedRef.current = true
      wasVisibleRef.current = hasEvents
      previousCountRef.current = sortedEvents.length
      return
    }

    if (countChanged) {
      gsap.set(notesTitle, { willChange: 'transform' })
      gsap.fromTo(notesTitle, {
        y: sortedEvents.length > previousCountRef.current ? -8 : 8,
        scale: 0.985,
      }, {
        y: 0,
        scale: 1,
        duration: 0.56,
        ease: 'elastic.out(1, 0.7)',
        overwrite: 'auto',
        force3D: true,
        clearProps: 'transform,willChange',
      })
    }

    if (hasEvents && !wasVisibleRef.current) {
      const nextHeight = inner.scrollHeight
      gsap.set(shell, { height: 0, pointerEvents: 'auto' })
      gsap.set(shell, { willChange: 'height' })
      gsap.set(inner, { y: -18, opacity: 0, willChange: 'transform, opacity' })

      gsap.timeline({
        onComplete: () => {
          shell.style.height = 'auto'
          gsap.set(shell, { clearProps: 'willChange' })
          gsap.set(inner, { clearProps: 'willChange' })
        },
      })
        .to(shell, {
          height: nextHeight,
          duration: 0.42,
          ease: 'power2.out',
          overwrite: 'auto',
        })
        .to(inner, {
          y: 0,
          opacity: 1,
          duration: 0.34,
          ease: 'power2.out',
          overwrite: 'auto',
          force3D: true,
        }, 0.06)
    } else if (!hasEvents && wasVisibleRef.current) {
      gsap.set(shell, { height: shell.offsetHeight })
      gsap.set(shell, { willChange: 'height' })
      gsap.set(inner, { willChange: 'transform, opacity' })

      gsap.timeline({
        onComplete: () => {
          gsap.set(shell, { height: 0, pointerEvents: 'none' })
          gsap.set(shell, { clearProps: 'willChange' })
          gsap.set(inner, { clearProps: 'willChange' })
        },
      })
        .to(inner, {
          y: -18,
          opacity: 0,
          duration: 0.24,
          ease: 'power2.in',
          overwrite: 'auto',
          force3D: true,
        })
        .to(shell, {
          height: 0,
          duration: 0.34,
          ease: 'power2.inOut',
          overwrite: 'auto',
        }, 0)
    } else if (hasEvents) {
      const nextHeight = inner.scrollHeight
      gsap.set(shell, { willChange: 'height' })
      gsap.to(shell, {
        height: nextHeight,
        duration: 0.22,
        ease: 'power2.out',
        overwrite: 'auto',
        onComplete: () => {
          shell.style.height = 'auto'
          gsap.set(shell, { clearProps: 'willChange' })
        },
      })
      gsap.set(inner, { y: 0, opacity: 1 })
    }

    wasVisibleRef.current = hasEvents
    previousCountRef.current = sortedEvents.length

    return () => {
      gsap.killTweensOf(shell)
      gsap.killTweensOf(inner)
      gsap.killTweensOf(notesTitle)
    }
  }, [sortedEvents.length])

  useLayoutEffect(() => {
    const palette = paletteListRef.current
    if (!palette) return

    const swatches = palette.querySelectorAll('.notes-label-swatch')
    gsap.killTweensOf([palette, swatches])

    if (isPaletteOpen) {
      gsap.set(palette, { display: 'flex', pointerEvents: 'auto' })
      gsap.set(palette, { willChange: 'transform, opacity' })
      gsap.set(swatches, { willChange: 'transform, opacity' })

      const openTimeline = gsap.timeline({
        onComplete: () => {
          gsap.set(palette, { clearProps: 'willChange' })
          gsap.set(swatches, { clearProps: 'willChange' })
        },
      })
        .fromTo(palette, {
          autoAlpha: 0,
          y: 8,
          scale: 0.92,
        }, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: 'auto',
          force3D: true,
        })
        .fromTo(swatches, {
          autoAlpha: 0,
          y: 6,
        }, {
          autoAlpha: 1,
          y: 0,
          duration: 0.18,
          stagger: 0.02,
          ease: 'power2.out',
          overwrite: 'auto',
          force3D: true,
        }, 0.03)

      return () => {
        openTimeline.kill()
        gsap.killTweensOf([palette, swatches])
      }
    }

    gsap.to(palette, {
      autoAlpha: 0,
      y: 8,
      scale: 0.92,
      duration: 0.14,
      ease: 'power2.in',
      overwrite: 'auto',
      force3D: true,
      onComplete: () => {
        gsap.set(palette, { display: 'none', pointerEvents: 'none' })
        gsap.set(palette, { clearProps: 'willChange' })
        gsap.set(swatches, { clearProps: 'willChange' })
      },
    })

    return () => {
      gsap.killTweensOf([palette, swatches])
    }
  }, [isPaletteOpen])

  useEffect(() => {
    if (!isPaletteOpen) return

    const onPointerDown = (event) => {
      if (!paletteWrapRef.current?.contains(event.target)) {
        setIsPaletteOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPaletteOpen(false)
      }
    }

    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isPaletteOpen])

  useEffect(() => {
    const button = addBtnRef.current
    if (!button) return

    if (canAddLabel && !previousCanAddRef.current) {
      gsap.killTweensOf(button)
      gsap.set(button, { willChange: 'transform, box-shadow' })
      gsap.fromTo(button, {
        scale: 0.88,
        boxShadow: '0 0 0 rgba(46, 134, 171, 0)',
      }, {
        scale: 1,
        boxShadow: '0 8px 18px rgba(46, 134, 171, 0.3)',
        duration: 0.24,
        ease: 'back.out(2.3)',
        overwrite: 'auto',
        force3D: true,
        clearProps: 'willChange',
      })
    }

    previousCanAddRef.current = canAddLabel
  }, [canAddLabel])

  const addLabel = () => {
    const trimmed = draftLabelName.trim()
    if (!trimmed || labels.length >= 2) return

    onLabelsChange?.([
      ...labels,
      { name: trimmed.slice(0, 10), color: draftLabelColor },
    ])

    setDraftLabelName('')
    setIsPaletteOpen(false)
  }

  const removeLabel = (indexToRemove) => {
    onLabelsChange?.(labels.filter((_, index) => index !== indexToRemove))
  }

  const renderLabelControls = (className) => (
    <div className={`notes-labels-controls ${className}`.trim()}>
      <div className="notes-label-input-wrap" ref={paletteWrapRef}>
        <input
          className="notes-label-input"
          type="text"
          value={draftLabelName}
          maxLength={10}
          onChange={(e) => setDraftLabelName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addLabel()
            }
          }}
          placeholder="Add label"
        />

        <button
          type="button"
          className={`notes-label-color-trigger ${isPaletteOpen ? 'open' : ''}`}
          onClick={() => setIsPaletteOpen((open) => !open)}
          title="Choose label color"
        >
          <span className="notes-label-color-preview" style={{ backgroundColor: draftLabelColor }} />
        </button>

        <div className="notes-label-palette-list" ref={paletteListRef}>
          {LABEL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`notes-label-swatch ${draftLabelColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => {
                setDraftLabelColor(color)
                setIsPaletteOpen(false)
              }}
              title={`Use ${color} label color`}
            />
          ))}
        </div>
      </div>

      <button
        className={`notes-label-add-btn ${canAddLabel ? 'is-ready' : ''}`}
        type="button"
        ref={addBtnRef}
        onClick={addLabel}
        disabled={!canAddLabel}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )

  return (
    <div className="notes-panel">
      <div ref={eventsShellRef} className="notes-events-shell" aria-hidden={sortedEvents.length === 0}>
        <section ref={eventsInnerRef} className="notes-events-section">
          <div className="notes-panel-header notes-section-header">
            <h3 className="notes-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Events</span>
            </h3>
          </div>

          <div className="notes-events-body custom-scrollbar">
            {sortedEvents.map((evt) => (
              <div
                key={evt.id}
                className="note-event-item"
                style={evt.isReadOnly ? { backgroundColor: 'rgba(155, 127, 212, 0.1)', borderColor: 'rgba(155, 127, 212, 0.3)' } : {}}
              >
                <div className="note-event-time" style={evt.color ? { color: evt.color } : (evt.isReadOnly ? { color: '#9b7fd4' } : {})}>
                  {evt.time || 'All Day'}
                </div>
                <div
                  className="note-event-title"
                  style={evt.isReadOnly ? { color: '#9b7fd4', fontWeight: '700' } : undefined}
                  title={evt.title}
                >
                  {evt.title}
                </div>

                {evt.isReadOnly ? (
                  <div className="note-event-actions note-event-readonly-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                ) : (
                  <div className="note-event-actions">
                    <button className="note-event-edit" onClick={() => onEditEvent?.(evt)} title="Edit Event">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button className="note-event-delete" onClick={() => onDeleteEvent?.(evt.id)} title="Delete Event">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="notes-editor-section">
        <div className="notes-panel-header notes-section-header">
          <div className="notes-editor-header-row">
            <h3 className="notes-title" ref={notesTitleRef}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              <span className="notes-title-main">{title}</span>
              {subtitle && <span className="notes-title-subtitle">{subtitle}</span>}
            </h3>

            {labels.length < 2 && isMobileView && renderLabelControls('notes-header-label-controls')}
          </div>
        </div>

        <div className="notes-editor-body">
          <div className="notes-ruled-container">
            <textarea
              className="ruled-textarea handwriting-font custom-scrollbar"
              value={text}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Jot down notes here..."
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
          </div>

          <div className="notes-labels-area">
            <div className="notes-labels-list">
              {labels.map((label, index) => (
                <div key={`${label.name}-${label.color}-${index}`} className="notes-label-chip">
                  <svg className="notes-label-icon" style={{ color: label.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.59 13.41 13.4 20.6a2 2 0 0 1-2.82 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  <span className="notes-label-name">{label.name}</span>
                  <button className="notes-label-remove" onClick={() => removeLabel(index)} title="Remove label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {labels.length < 2 && !isMobileView && renderLabelControls('notes-inline-label-controls')}
          </div>
        </div>
      </section>
    </div>
  )
}
