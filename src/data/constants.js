export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const IMAGE_CDN_BASE_URL = (import.meta.env.VITE_IMAGE_CDN_URL || '').trim().replace(/\/+$/, '')

const resolveAssetUrl = (path) => {
  if (!IMAGE_CDN_BASE_URL) {
    return path
  }

  return `${IMAGE_CDN_BASE_URL}${path}`
}

const MONTH_IMAGE_PATHS = [
  '/images/01-january.jpg',
  '/images/02-february.jpg',
  '/images/03-march.jpg',
  '/images/04-april.jpg',
  '/images/05-may.jpg',
  '/images/06-june.jpg',
  '/images/07-july.jpg',
  '/images/08-august.jpg',
  '/images/09-september.jpg',
  '/images/10-october.jpg',
  '/images/11-november.jpg',
  '/images/12-december.jpg',
]

export const MONTH_IMAGES = MONTH_IMAGE_PATHS.reduce((accumulator, imagePath, monthIndex) => {
  accumulator[monthIndex] = resolveAssetUrl(imagePath)
  return accumulator
}, {})

export const MONTH_IMAGE_LIST = MONTH_IMAGE_PATHS.map(resolveAssetUrl)

export const LOGO_IMAGE = resolveAssetUrl('/Logo.svg')

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

// India-focused 2026 holidays (month is 0-indexed)
export const HOLIDAYS = {
  '0-1': "New Year's Day",
  '0-14': 'Makar Sankranti',
  '0-26': 'Republic Day',
  '1-15': 'Maha Shivratri',
  '2-4': 'Holi',
  '2-19': 'Ugadi / Gudi Padwa',
  '2-21': 'Eid al-Fitr',
  '2-26': 'Ram Navami',
  '2-31': 'Mahavir Jayanti',
  '3-14': 'Ambedkar Jayanti',
  '4-1': 'Buddha Purnima',
  '4-27': 'Bakrid',
  '6-16': 'Rath Yatra',
  '7-15': 'Independence Day',
  '8-4': 'Janmashtami',
  '8-14': 'Ganesh Chaturthi',
  '9-2': 'Gandhi Jayanti',
  '9-20': 'Dussehra',
  '10-8': 'Diwali',
}
