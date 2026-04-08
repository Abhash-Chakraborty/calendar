import { useState, useRef, useEffect } from 'react'
import anime from 'animejs'

export default function NotesPanel({ title, text, onChange }) {
  return (
    <div className="notes-panel">
      <div className="notes-panel-header">
        <h3 className="notes-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          <span>{title}</span>
        </h3>
      </div>
      
      <div className="notes-ruled-container">
        <textarea
          className="ruled-textarea"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jot down notes here..."
        />
      </div>
    </div>
  )
}
