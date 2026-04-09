# Calendar - Frontend Engineering Challenge

This project is my submission for the Frontend Engineering Challenge to build an interactive calendar component inspired by a static reference design. I focused on translating the visual concept into a usable, responsive, and polished product.

## What I Built

- A wall-calendar-inspired layout with a hero image area, month grid, and integrated notes/events panel.
- Single-day and day-range selection with clear visual states for start, end, and in-range dates.
- Notes tied to the active selection context (single day, range, or month).
- Event management for selected dates (add/edit/delete) with event color markers in the calendar grid.
- Holiday markers with hover/touch-friendly contextual hints.

## How This Meets the Challenge Requirements

### 1) Calendar Aesthetic

- I designed the UI around a physical wall-calendar feel: prominent monthly imagery, layered paper styling, spiral binding treatment, and strong visual hierarchy.

### 2) Day Range Selector

- Click/tap a date for single-day selection.
- Press and drag to create a range selection.
- Distinct styles are applied for:
  - range start
  - range end
  - days in between

### 3) Integrated Notes Section

- The notes panel supports freeform notes and lightweight labels for organization.
- Notes update based on the currently selected date or range.

### 4) Fully Responsive Design

- Desktop: segmented layout with calendar and notes side by side.
- Mobile: stacked layout with touch-friendly controls and compact spacing to preserve usability.

## Creative Enhancements Added

- Animated month/page transitions to reinforce the wall-calendar interaction feel.
- Theme toggle with synchronized transitions.
- Event color dots and holiday indicators for quick scanability.
- Mobile-focused interaction tuning for navigation, spacing, and readability.

## Tech Stack

- React
- Vite
- GSAP (animations)
- CSS custom properties and responsive media queries

## Frontend-Only Scope

This submission is intentionally frontend-only as requested in the challenge. There is no backend/database/API. Data is persisted client-side using `localStorage`.

## Run Locally

```bash
npm install
npm run dev
```

## Lint and Build

```bash
npm run lint
npm run build
npm run preview
```

## Project Structure

- `src/App.jsx` - app state, page composition, and transitions
- `src/components/CalendarGrid.jsx` - calendar grid and range selection logic
- `src/components/NotesPanel.jsx` - notes editor, labels, and event listing
- `src/components/EventModal.jsx` - add/edit event modal
- `src/components/MonthNav.jsx` - month navigation controls
- `src/components/SpiralBinding.jsx` - wall-calendar binding visuals
- `src/data/constants.js` - month and holiday constants
- `src/App.css`, `src/index.css` - theme, layout, and responsive styles

## Submission Links

- Repository: `https://github.com/Abhash-Chakraborty/calendar`
- Video Demonstration (required): `https://drive.google.com/file/d/18AV6NcxN3AjZrTGO5gV2T107FUud_rFS/view?usp=sharing`
- Live Demo (optional): `https://calendar.abhashchakraborty.tech/`
