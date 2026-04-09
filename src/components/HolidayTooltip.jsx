export default function HolidayTooltip({ visible, text, x, y }) {
  return (
    <div
      className={`holiday-tooltip ${visible ? 'visible' : ''}`}
      style={{
        left: `${x}px`,
        top: `${y - 28}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {text}
    </div>
  )
}
