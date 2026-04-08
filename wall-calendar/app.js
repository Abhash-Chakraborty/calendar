/**
 * Wall Calendar 2026
 * Interactive calendar with range selection, notes, seasonal hero images,
 * dark/light theme, holiday markers, and page-flip animations.
 */

(function () {
  'use strict';

  // ===== CONSTANTS =====
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const MONTH_IMAGES = {
    0: 'images/01-january.png',
    1: 'images/02-february.png',
    2: 'images/03-march.png',
    3: 'images/04-april.png',
    4: 'images/05-may.png',
    5: 'images/06-june.png',
    6: 'images/07-july.png',
    7: 'images/08-august.png',
    8: 'images/09-september.png',
    9: 'images/10-october.png',
    10: 'images/11-november.png',
    11: 'images/12-december.png',
  };

  // Popular holidays (month is 0-indexed)
  const HOLIDAYS = {
    '0-1': 'New Year\'s Day',
    '0-15': 'Martin Luther King Jr. Day',
    '0-26': 'Republic Day (India)',
    '1-14': 'Valentine\'s Day',
    '2-17': 'St. Patrick\'s Day',
    '2-28': 'Holi',
    '3-1': 'April Fools\' Day',
    '3-22': 'Earth Day',
    '4-1': 'May Day',
    '4-5': 'Cinco de Mayo',
    '4-12': 'Mother\'s Day',
    '5-16': 'Father\'s Day',
    '5-21': 'International Yoga Day',
    '6-4': 'Independence Day (US)',
    '7-15': 'Independence Day (India)',
    '8-1': 'Labor Day',
    '9-2': 'Gandhi Jayanti',
    '9-31': 'Halloween',
    '10-1': 'Diwali Season',
    '10-11': 'Veterans Day',
    '10-27': 'Thanksgiving',
    '11-25': 'Christmas Day',
    '11-31': 'New Year\'s Eve',
  };

  // ===== STATE =====
  const state = {
    currentMonth: 3,  // April (0-indexed)
    currentYear: 2026,
    rangeStart: null,
    rangeEnd: null,
    selecting: false,
    notes: JSON.parse(localStorage.getItem('wallCalendarNotes') || '[]'),
    theme: localStorage.getItem('wallCalendarTheme') || 'light',
  };

  // ===== DOM ELEMENTS =====
  const $ = (id) => document.getElementById(id);
  const heroImage = $('heroImage');
  const heroMonth = $('heroMonth');
  const heroYear = $('heroYear');
  const navMonthName = $('navMonthName');
  const navYear = $('navYear');
  const calendarGrid = $('calendarGrid');
  const selectionText = $('selectionText');
  const selectionBar = $('selectionBar');
  const noteInput = $('noteInput');
  const notesList = $('notesList');
  const notesCount = $('notesCount');
  const notesTitleText = $('notesTitleText');
  const holidayTooltip = $('holidayTooltip');

  // ===== INITIALIZATION =====
  function init() {
    // Set today
    const today = new Date();
    state.currentMonth = today.getMonth();
    state.currentYear = today.getFullYear();

    // Apply saved theme
    if (state.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Generate spiral rings
    generateSpiralRings();

    // Render calendar
    renderCalendar();
    renderNotes();

    // Bind events
    bindEvents();
  }

  // ===== SPIRAL BINDING =====
  function generateSpiralRings() {
    const spiral = $('spiralBinding');
    const ringCount = window.innerWidth < 500 ? 14 : 20;
    for (let i = 0; i < ringCount; i++) {
      const ring = document.createElement('div');
      ring.className = 'spiral-ring';
      spiral.appendChild(ring);
    }
  }

  // ===== CALENDAR RENDERING =====
  function renderCalendar() {
    // Update hero section
    updateHero();

    // Update navigation text
    navMonthName.textContent = MONTH_NAMES[state.currentMonth];
    navYear.textContent = state.currentYear;

    // Clear existing day cells (keep headers)
    const headers = calendarGrid.querySelectorAll('.day-header');
    calendarGrid.innerHTML = '';
    headers.forEach(h => calendarGrid.appendChild(h));

    // Build grid
    const firstDay = new Date(state.currentYear, state.currentMonth, 1);
    const lastDay = new Date(state.currentYear, state.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Monday-based: getDay() returns 0=Sun...6=Sat → convert to 0=Mon...6=Sun
    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    const today = new Date();
    const isCurrentMonth = today.getMonth() === state.currentMonth && today.getFullYear() === state.currentYear;

    // Previous month filler
    const prevMonthDays = new Date(state.currentYear, state.currentMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const cell = createDayCell(prevMonthDays - i, true);
      calendarGrid.appendChild(cell);
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(state.currentYear, state.currentMonth, day);
      const dow = date.getDay();

      const cell = createDayCell(day, false);

      // Weekend coloring
      if (dow === 6) cell.classList.add('saturday');
      if (dow === 0) cell.classList.add('sunday');

      // Today
      if (isCurrentMonth && day === today.getDate()) {
        cell.classList.add('today');
      }

      // Holidays
      const holidayKey = `${state.currentMonth}-${day}`;
      if (HOLIDAYS[holidayKey]) {
        cell.classList.add('holiday');
        cell.dataset.holiday = HOLIDAYS[holidayKey];
      }

      // Note indicator
      if (hasNoteOnDate(state.currentYear, state.currentMonth, day)) {
        cell.classList.add('has-note');
      }

      // Range selection classes
      applyRangeClasses(cell, date);

      // Click handler
      cell.addEventListener('click', () => handleDayClick(day));

      // Holiday tooltip
      cell.addEventListener('mouseenter', (e) => showHolidayTooltip(e, cell));
      cell.addEventListener('mouseleave', hideHolidayTooltip);

      calendarGrid.appendChild(cell);
    }

    // Next month filler
    const totalCells = startDow + daysInMonth;
    const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remaining; i++) {
      const cell = createDayCell(i, true);
      calendarGrid.appendChild(cell);
    }

    // Update selection bar
    updateSelectionBar();
  }

  function createDayCell(day, isOtherMonth) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.textContent = day;
    if (isOtherMonth) {
      cell.classList.add('other-month');
    }
    return cell;
  }

  function applyRangeClasses(cell, date) {
    if (!state.rangeStart) return;

    const start = state.rangeStart;
    const end = state.rangeEnd || state.rangeStart;
    const actualStart = start <= end ? start : end;
    const actualEnd = start <= end ? end : start;
    const dateTime = date.getTime();
    const startTime = actualStart.getTime();
    const endTime = actualEnd.getTime();

    if (dateTime === startTime && dateTime === endTime) {
      cell.classList.add('range-start', 'range-end');
    } else if (dateTime === startTime) {
      cell.classList.add('range-start');
    } else if (dateTime === endTime) {
      cell.classList.add('range-end');
    } else if (dateTime > startTime && dateTime < endTime) {
      cell.classList.add('in-range');
    }
  }

  // ===== HERO IMAGE =====
  function updateHero() {
    heroMonth.textContent = MONTH_NAMES[state.currentMonth].toUpperCase();
    heroYear.textContent = state.currentYear;

    const newSrc = MONTH_IMAGES[state.currentMonth];
    if (heroImage.src.indexOf(newSrc) === -1) {
      heroImage.classList.add('flipping');
      setTimeout(() => {
        heroImage.src = newSrc;
        heroImage.alt = `${MONTH_NAMES[state.currentMonth]} landscape`;
      }, 350);
      setTimeout(() => {
        heroImage.classList.remove('flipping');
      }, 700);
    }
  }

  // ===== DATE RANGE SELECTION =====
  function handleDayClick(day) {
    const clickedDate = new Date(state.currentYear, state.currentMonth, day);

    if (!state.rangeStart || (state.rangeStart && state.rangeEnd)) {
      // Start new selection
      state.rangeStart = clickedDate;
      state.rangeEnd = null;
      state.selecting = true;
    } else if (state.selecting) {
      // Set end date
      state.rangeEnd = clickedDate;
      state.selecting = false;

      // Ensure start <= end
      if (state.rangeStart > state.rangeEnd) {
        const tmp = state.rangeStart;
        state.rangeStart = state.rangeEnd;
        state.rangeEnd = tmp;
      }
    }

    renderCalendar();
    updateNotesTitle();
  }

  function clearSelection() {
    state.rangeStart = null;
    state.rangeEnd = null;
    state.selecting = false;
    renderCalendar();
    updateNotesTitle();
  }

  function updateSelectionBar() {
    if (!state.rangeStart) {
      selectionText.textContent = 'Click a date to start selecting a range';
      selectionBar.classList.remove('has-selection');
      return;
    }

    selectionBar.classList.add('has-selection');

    if (state.rangeEnd) {
      const startStr = formatDate(state.rangeStart);
      const endStr = formatDate(state.rangeEnd);
      if (startStr === endStr) {
        selectionText.textContent = `Selected: ${startStr}`;
      } else {
        selectionText.textContent = `${startStr}  →  ${endStr}`;
      }
    } else {
      selectionText.textContent = `Start: ${formatDate(state.rangeStart)} — click another date to set end`;
    }
  }

  function updateNotesTitle() {
    if (state.rangeStart && state.rangeEnd) {
      const s = formatDateShort(state.rangeStart);
      const e = formatDateShort(state.rangeEnd);
      notesTitleText.textContent = s === e ? `Notes — ${s}` : `Notes — ${s} to ${e}`;
    } else if (state.rangeStart) {
      notesTitleText.textContent = `Notes — ${formatDateShort(state.rangeStart)}`;
    } else {
      notesTitleText.textContent = 'Notes';
    }
  }

  // ===== HOLIDAY TOOLTIP =====
  function showHolidayTooltip(event, cell) {
    if (!cell.dataset.holiday) return;
    holidayTooltip.textContent = `🎉 ${cell.dataset.holiday}`;
    holidayTooltip.classList.add('visible');

    const rect = cell.getBoundingClientRect();
    holidayTooltip.style.left = `${rect.left + rect.width / 2 - holidayTooltip.offsetWidth / 2}px`;
    holidayTooltip.style.top = `${rect.top - 36}px`;
  }

  function hideHolidayTooltip() {
    holidayTooltip.classList.remove('visible');
  }

  // ===== NOTES =====
  function renderNotes() {
    const filtered = getFilteredNotes();
    notesList.innerHTML = '';

    if (filtered.length === 0) {
      notesList.innerHTML = `
        <div class="notes-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span>No notes yet.<br/>Select a date and add one!</span>
        </div>`;
      notesCount.textContent = '0 notes';
      return;
    }

    notesCount.textContent = `${filtered.length} note${filtered.length !== 1 ? 's' : ''}`;

    filtered.forEach((note, idx) => {
      const item = document.createElement('div');
      item.className = 'note-item';
      item.innerHTML = `
        <div class="note-date">📅 ${note.dateLabel}</div>
        <div class="note-content">${escapeHTML(note.text)}</div>
        <button class="note-delete" data-id="${note.id}" title="Delete note">✕</button>`;
      notesList.appendChild(item);
    });

    // Bind delete buttons
    notesList.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteNote(btn.dataset.id);
      });
    });
  }

  function getFilteredNotes() {
    // Show notes for the currently visible month, or filtered by selection
    return state.notes.filter(note => {
      const noteDate = new Date(note.year, note.month, note.day);

      if (state.rangeStart && state.rangeEnd) {
        const start = state.rangeStart <= state.rangeEnd ? state.rangeStart : state.rangeEnd;
        const end = state.rangeStart <= state.rangeEnd ? state.rangeEnd : state.rangeStart;
        return noteDate >= start && noteDate <= end;
      }

      if (state.rangeStart) {
        return noteDate.getTime() === state.rangeStart.getTime();
      }

      return note.month === state.currentMonth && note.year === state.currentYear;
    });
  }

  function addNote() {
    const text = noteInput.value.trim();
    if (!text) return;

    const targetDate = state.rangeStart || new Date(state.currentYear, state.currentMonth, 1);
    let dateLabel;

    if (state.rangeStart && state.rangeEnd) {
      const s = formatDateShort(state.rangeStart);
      const e = formatDateShort(state.rangeEnd);
      dateLabel = s === e ? s : `${s} — ${e}`;
    } else if (state.rangeStart) {
      dateLabel = formatDateShort(state.rangeStart);
    } else {
      dateLabel = `${MONTH_NAMES[state.currentMonth]} ${state.currentYear}`;
    }

    const note = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      text,
      year: targetDate.getFullYear(),
      month: targetDate.getMonth(),
      day: targetDate.getDate(),
      dateLabel,
      createdAt: new Date().toISOString(),
    };

    state.notes.unshift(note);
    saveNotes();
    noteInput.value = '';
    renderNotes();
    renderCalendar(); // Update note indicators
  }

  function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveNotes();
    renderNotes();
    renderCalendar();
  }

  function saveNotes() {
    localStorage.setItem('wallCalendarNotes', JSON.stringify(state.notes));
  }

  function hasNoteOnDate(year, month, day) {
    return state.notes.some(n => n.year === year && n.month === month && n.day === day);
  }

  // ===== THEME =====
  function toggleTheme() {
    const isDark = state.theme === 'dark';
    state.theme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('wallCalendarTheme', state.theme);
  }

  // ===== NAVIGATION =====
  function goToPrevMonth() {
    state.currentMonth--;
    if (state.currentMonth < 0) {
      state.currentMonth = 11;
      state.currentYear--;
    }
    renderCalendar();
    renderNotes();
    updateNotesTitle();
  }

  function goToNextMonth() {
    state.currentMonth++;
    if (state.currentMonth > 11) {
      state.currentMonth = 0;
      state.currentYear++;
    }
    renderCalendar();
    renderNotes();
    updateNotesTitle();
  }

  function goToToday() {
    const today = new Date();
    state.currentMonth = today.getMonth();
    state.currentYear = today.getFullYear();
    state.rangeStart = today;
    state.rangeEnd = today;
    state.selecting = false;
    renderCalendar();
    renderNotes();
    updateNotesTitle();
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    $('prevMonth').addEventListener('click', goToPrevMonth);
    $('nextMonth').addEventListener('click', goToNextMonth);
    $('todayBtn').addEventListener('click', goToToday);
    $('clearSelection').addEventListener('click', clearSelection);
    $('themeToggle').addEventListener('click', toggleTheme);
    $('addNoteBtn').addEventListener('click', addNote);

    noteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addNote();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

      if (e.key === 'ArrowLeft') { e.preventDefault(); goToPrevMonth(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goToNextMonth(); }
      if (e.key === 'Escape') { clearSelection(); }
      if (e.key === 't' || e.key === 'T') { goToToday(); }
      if (e.key === 'd' || e.key === 'D') { toggleTheme(); }
    });

    // Swipe support for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    const container = $('calendarContainer');

    container.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;

      // Only if horizontal swipe is dominant
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) goToPrevMonth();
        else goToNextMonth();
      }
    }, { passive: true });
  }

  // ===== UTILITIES =====
  function formatDate(date) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  function formatDateShort(date) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
    return `${month} ${day}`;
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ===== GO =====
  init();

})();
