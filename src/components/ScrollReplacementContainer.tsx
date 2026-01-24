import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ScrollReplacementContainerProps {
  children: ReactNode[]
  sectionTitles?: string[]
}

const ScrollReplacementContainer: React.FC<ScrollReplacementContainerProps> = ({
  children,
  sectionTitles = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const goToSection = (index: number) => {
    if (index < 0 || index >= children.length || isTransitioning) return
    
    setIsTransitioning(true)
    setCurrentIndex(index)
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 600) // Match transition duration
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let wheelTimeout: NodeJS.Timeout | null = null
    let lastWheelTime = 0
    const wheelCooldown = 600 // ms between section changes

    // Handle wheel events - convert vertical scroll to section navigation
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      if (isTransitioning) return

      const now = Date.now()
      if (now - lastWheelTime < wheelCooldown) return

      const delta = e.deltaY
      const threshold = 30 // Minimum scroll delta to trigger

      if (Math.abs(delta) < threshold) return

      if (delta > 0 && currentIndex < children.length - 1) {
        // Scroll down - next section
        lastWheelTime = now
        goToSection(currentIndex + 1)
      } else if (delta < 0 && currentIndex > 0) {
        // Scroll up - previous section
        lastWheelTime = now
        goToSection(currentIndex - 1)
      }
    }

    // Handle touch/swipe for mobile
    let touchStartY = 0
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return
      
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchStartY - touchEndY
      const threshold = 50

      if (Math.abs(deltaY) < threshold) return

      if (deltaY > 0 && currentIndex < children.length - 1) {
        // Swipe up - next section
        goToSection(currentIndex + 1)
      } else if (deltaY < 0 && currentIndex > 0) {
        // Swipe down - previous section
        goToSection(currentIndex - 1)
      }
    }

    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return

      if (e.key === 'ArrowDown' && currentIndex < children.length - 1) {
        e.preventDefault()
        goToSection(currentIndex + 1)
      } else if (e.key === 'ArrowUp' && currentIndex > 0) {
        e.preventDefault()
        goToSection(currentIndex - 1)
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      container.removeEventListener('wheel', handleWheel)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
      if (wheelTimeout) {
        clearTimeout(wheelTimeout)
      }
    }
  }, [currentIndex, isTransitioning, children.length])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
    >
      {/* Navigation Dots */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSection(index)}
            className={`transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 h-2 bg-blue-600 rounded-full'
                : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400'
            }`}
            aria-label={`Go to ${sectionTitles[index] || `section ${index + 1}`}`}
          />
        ))}
      </div>

      {/* Section Indicator */}
      {sectionTitles[currentIndex] && (
        <div className="fixed top-28 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-md border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">
              {sectionTitles[currentIndex]} <span className="text-gray-500 font-normal">({currentIndex + 1}/{children.length})</span>
            </span>
          </div>
        </div>
      )}

      {/* Scroll Hint */}
      {currentIndex < children.length - 1 && !isTransitioning && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <span className="text-xs font-medium">Scroll down</span>
            <ChevronDown className="h-6 w-6" />
          </div>
        </div>
      )}

      {currentIndex > 0 && !isTransitioning && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <ChevronUp className="h-6 w-6" />
            <span className="text-xs font-medium">Scroll up</span>
          </div>
        </div>
      )}

      {/* Sections Container - Each section replaces the previous */}
      <div className="relative w-full h-full">
        {children.map((child, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full ${
              index === currentIndex
                ? 'opacity-100 translate-x-0 z-10 pointer-events-auto'
                : index < currentIndex
                ? 'opacity-0 -translate-x-full z-0 pointer-events-none'
                : 'opacity-0 translate-x-full z-0 pointer-events-none'
            }`}
            style={{
              transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              willChange: index === currentIndex ? 'auto' : 'transform, opacity'
            }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ScrollReplacementContainer
