export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const MONTH_IMAGES = {
  0: '/images/01-january.png',
  1: '/images/02-february.png',
  2: '/images/03-march.png',
  3: '/images/04-april.png',
  4: '/images/05-may.png',
  5: '/images/06-june.png',
  6: '/images/07-july.png',
  7: '/images/08-august.png',
  8: '/images/09-september.png',
  9: '/images/10-october.png',
  10: '/images/11-november.png',
  11: '/images/12-december.png',
}

// Month accent color palettes (primary, light, dark) for dynamic theming
export const MONTH_COLORS = {
  0: { primary: '#5b9bd5', light: '#d6e9f8', dark: '#3a7cc0' },   // Jan - icy blue
  1: { primary: '#e8657a', light: '#fce0e5', dark: '#c94d63' },   // Feb - rose
  2: { primary: '#6bbf59', light: '#dff2da', dark: '#4ea340' },   // Mar - fresh green
  3: { primary: '#f0a04b', light: '#fcebd2', dark: '#d4872f' },   // Apr - warm amber
  4: { primary: '#e07cc1', light: '#f8e0f2', dark: '#c45da3' },   // May - bloom pink
  5: { primary: '#30b4c5', light: '#d0f0f5', dark: '#1e97a8' },   // Jun - ocean teal
  6: { primary: '#f7c948', light: '#fef3cc', dark: '#d9a82e' },   // Jul - sunflower
  7: { primary: '#9b7fd4', light: '#e8dff5', dark: '#7d5ebd' },   // Aug - lavender
  8: { primary: '#d4853f', light: '#f5e0cc', dark: '#b86c2a' },   // Sep - autumn amber
  9: { primary: '#d95534', light: '#f7d5cc', dark: '#bd3e1f' },   // Oct - foliage red
  10: { primary: '#8b7355', light: '#e8dfd4', dark: '#6e5a3f' },  // Nov - earth brown
  11: { primary: '#4a8bc2', light: '#d4e5f5', dark: '#336fa5' },  // Dec - winter blue
}

// Holidays (month is 0-indexed)
export const HOLIDAYS = {
  '0-1': "New Year's Day",
  '0-15': 'Martin Luther King Jr. Day',
  '0-26': 'Republic Day (India)',
  '1-14': "Valentine's Day",
  '2-17': "St. Patrick's Day",
  '2-28': 'Holi',
  '3-1': "April Fools' Day",
  '3-22': 'Earth Day',
  '4-1': 'May Day',
  '4-5': 'Cinco de Mayo',
  '4-12': "Mother's Day",
  '5-16': "Father's Day",
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
  '11-31': "New Year's Eve",
}
