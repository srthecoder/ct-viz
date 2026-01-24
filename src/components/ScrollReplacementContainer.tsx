import React, { useRef, useEffect, useState, ReactNode, useCallback } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ScrollReplacementContainerProps {
  children: ReactNode[]
  sectionTitles?: string[]
}

const ScrollReplacementContainer: React.FC<ScrollReplacementContainerProps> = ({
  children,
  sectionTitles = []
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const goToSection = useCallback((index: number) => {
    if (index < 0 || index >= children.length || isTransitioning || index === currentIndex) {
      return
    }
    
    setIsTransitioning(true)
    setCurrentIndex(index)
    
    setTimeout(() => {
      setIsTransitioning(false)
    }, 500)
  }, [children.length, isTransitioning, currentIndex])

  useEffect(() => {
    // Prevent body scroll
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    let lastWheelTime = 0
    const wheelCooldown = 600

    const handleWheel = (e: WheelEvent) => {
      // Only handle vertical scroll
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      
      if (isTransitioning) return

      const now = Date.now()
      if (now - lastWheelTime < wheelCooldown) return

      const delta = e.deltaY
      
      // Check if we're inside a scrollable element that can still scroll
      const target = e.target as HTMLElement
      const scrollableElement = target.closest('[data-scrollable-content]') as HTMLElement
      
      if (scrollableElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableElement
        const isAtTop = scrollTop <= 5
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
        
        // If scrolling down and not at bottom, allow normal scroll
        if (delta > 0 && !isAtBottom) {
          return // Let it scroll normally
        }
        // If scrolling up and not at top, allow normal scroll
        if (delta < 0 && !isAtTop) {
          return // Let it scroll normally
        }
      }
      
      // Otherwise, prevent default and trigger section change
      e.preventDefault()
      e.stopPropagation()
      
      if (delta > 30 && currentIndex < children.length - 1) {
        lastWheelTime = now
        goToSection(currentIndex + 1)
      } else if (delta < -30 && currentIndex > 0) {
        lastWheelTime = now
        goToSection(currentIndex - 1)
      }
    }

    // Touch/swipe handling
    let touchStartY = 0
    let touchStartTime = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchStartTime = Date.now()
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (isTransitioning) return
      
      const touchEndY = e.changedTouches[0].clientY
      const deltaY = touchStartY - touchEndY
      const deltaTime = Date.now() - touchStartTime
      
      if (Math.abs(deltaY) < 50 || deltaTime > 300) return

      if (deltaY > 0 && currentIndex < children.length - 1) {
        goToSection(currentIndex + 1)
      } else if (deltaY < 0 && currentIndex > 0) {
        goToSection(currentIndex - 1)
      }
    }

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning) return

      if ((e.key === 'ArrowDown' || e.key === 'PageDown') && currentIndex < children.length - 1) {
        e.preventDefault()
        goToSection(currentIndex + 1)
      } else if ((e.key === 'ArrowUp' || e.key === 'PageUp') && currentIndex > 0) {
        e.preventDefault()
        goToSection(currentIndex - 1)
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [currentIndex, isTransitioning, children.length, goToSection])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* Navigation Dots */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 flex gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200">
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

      {/* Scroll Hints */}
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

      {/* Sections - Only current one visible */}
      <div className="relative w-full h-full">
        {children.map((child, index) => (
          <div
            key={index}
            className={`absolute inset-0 w-full h-full ${
              index === currentIndex
                ? 'opacity-100 translate-y-0 z-10'
                : index < currentIndex
                ? 'opacity-0 -translate-y-full z-0'
                : 'opacity-0 translate-y-full z-0'
            }`}
            style={{
              transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
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
