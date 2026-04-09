import { useMemo } from 'react'

export default function SpiralBinding({ renderMaskStyles = true }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 720
  const holeOffset = 0
  const holeRadius = isMobile ? 4 : 4.5
  const holeY = isMobile ? 14 : 15

  const rings = useMemo(() => {
    const count = typeof window !== 'undefined' && window.innerWidth <= 720 ? 14 : 30
    return Array.from({ length: count }, (_, i) => {
      // Predictable spacing
      const percentage = ((i + 1) / (count + 1)) * 100
      return Math.round(percentage * 100) / 100 // round strictly to 2 decimal places
    })
  }, [])

  // Robust SVG mask for the TOP binder area ONLY
  const svgMask = useMemo(() => {
    // 1000x40 viewbox for the top binder strip
    let pathD = "M 0 0 H 1000 V 40 H 0 Z" 
    
    // Minimalist hanging notch (semi-circle at top)
    pathD += ` M 500 0 m -20 0 a 20 20 0 1 0 40 0` 
    
    // Spiral holes
    rings.forEach(percent => {
      pathD += ` M ${(percent + holeOffset / 100) * 10} ${holeY} m -${holeRadius} 0 a ${holeRadius} ${holeRadius} 0 1 0 ${holeRadius * 2} 0 a ${holeRadius} ${holeRadius} 0 1 0 -${holeRadius * 2} 0`
    })

    const svgStr = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 40" preserveAspectRatio="none">
      <path fill="black" fill-rule="evenodd" d="${pathD}" />
    </svg>`
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`
  }, [holeOffset, holeRadius, holeY, rings])

  return (
    <>
      {renderMaskStyles && (
        <style>{`
          .calendar-container,
          .binding-hole-mask {
            -webkit-mask-image: url("${svgMask}"), linear-gradient(black, black);
            mask-image: url("${svgMask}"), linear-gradient(black, black);
            
            -webkit-mask-size: 100% 40px, 100% calc(100% - 40px);
            mask-size: 100% 40px, 100% calc(100% - 40px);
            
            -webkit-mask-position: 0 top, 0 40px;
            mask-position: 0 top, 0 40px;
            
            -webkit-mask-repeat: no-repeat;
            mask-repeat: no-repeat;
          }

          .hanger-hook {
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            width: 12px;
            height: 24px;
            border: 2.5px solid #444;
            border-bottom: none;
            border-radius: 20px 20px 0 0;
            box-shadow: 1px 1px 2px rgba(0,0,0,0.2);
            z-index: -1;
          }
        `}</style>
      )}
      <div className="spiral-container" style={{ pointerEvents: 'none' }}>
        <div className="hanger-hook" />
        {rings.map(percent => (
          <div 
            key={percent} 
            className="spiral-ring" 
            style={{ 
              position: 'absolute', 
              left: `${percent}%`, 
              transform: 'translateX(-50%)',
              pointerEvents: 'auto'
            }} 
          />
        ))}
      </div>
    </>
  )
}
