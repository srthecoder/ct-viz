import React, { useRef, useEffect, useState, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HorizontalScrollContainerProps {
  children: ReactNode[]
  sectionTitles?: string[]
}

const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  sectionTitles = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  const scrollToSection = (index: number) => {
    if (!containerRef.current) return
    const section = containerRef.current.children[index] as HTMLElement
    if (section) {
      setIsScrolling(true)
      section.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
      setTimeout(() => setIsScrolling(false), 500)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      if (isScrolling) return

      const scrollLeft = container.scrollLeft
      const containerWidth = container.clientWidth
      const newIndex = Math.round(scrollLeft / containerWidth)
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex < children.length) {
        setCurrentIndex(newIndex)
      }
    }

    // Convert vertical wheel scroll to horizontal scroll
    const handleWheel = (e: WheelEvent) => {
      // Only intercept if scrolling vertically (not already scrolling horizontally)
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        // Smooth horizontal scrolling based on vertical scroll
        const scrollAmount = e.deltaY * 1.5 // Multiply for more responsive scrolling
        container.scrollBy({
          left: scrollAmount,
          behavior: 'smooth'
        })
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('wheel', handleWheel)
    }
  }, [currentIndex, isScrolling, children.length])

  const goToPrevious = () => {
    if (currentIndex > 0) {
      scrollToSection(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < children.length - 1) {
      scrollToSection(currentIndex + 1)
    }
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Navigation Dots */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {children.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-blue-600 w-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border border-gray-200 transition-all"
          aria-label="Previous section"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
      )}

      {currentIndex < children.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg border border-gray-200 transition-all"
          aria-label="Next section"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      )}

      {/* Section Indicator */}
      {sectionTitles[currentIndex] && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-gray-200">
            <span className="text-sm font-medium text-gray-700">
              {sectionTitles[currentIndex]} ({currentIndex + 1}/{children.length})
            </span>
          </div>
        </div>
      )}

      {/* Horizontal Scroll Container */}
      <div
        ref={containerRef}
        className="flex overflow-x-auto overflow-y-hidden h-full snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full h-full snap-start"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

export default HorizontalScrollContainer
