'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'

type GalleryBlockProps = {
  images: string[]
  title: string
  theme: {
    primary: string
    secondary: string
    background: string
    fontHeading: string
    fontBody: string
  }
}

export function GalleryBlock({ images, title, theme }: GalleryBlockProps) {
  const t = useTranslations('gallery')
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState<number | null>(null)
  const [zoom, setZoom] = useState(1)

  const openPreview = (index: number) => {
    setSelectedImage(index)
    setZoom(1)
  }
  
  const closePreview = () => {
    setSelectedImage(null)
    setZoom(1)
  }
  
  const nextImage = useCallback(() => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length)
      setZoom(1)
    }
  }, [selectedImage, images.length])
  
  const prevImage = useCallback(() => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage - 1 + images.length) % images.length)
      setZoom(1)
    }
  }, [selectedImage, images.length])

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.5, 3))
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.5, 0.5))
  const resetZoom = () => setZoom(1)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedImage === null) return
      
      switch (e.key) {
        case 'ArrowRight':
          nextImage()
          break
        case 'ArrowLeft':
          prevImage()
          break
        case 'Escape':
          closePreview()
          break
        case '+':
        case '=':
          zoomIn()
          break
        case '-':
          zoomOut()
          break
        case '0':
          resetZoom()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, nextImage, prevImage])

  if (!images.length) return null

  return (
    <>
      <section style={{ padding: '4rem 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <h2 style={{ 
            fontFamily: theme.fontHeading, 
            fontSize: '2rem', 
            marginBottom: '2rem',
            fontWeight: 700,
          }}>
            {title}
          </h2>
          
          {/* Gallery wrapper with side fade overlays */}
          <div style={{ position: 'relative' }}>
            {/* Left fade overlay */}
            <div style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '80px',
              background: `linear-gradient(to right, ${theme.background}, transparent)`,
              zIndex: 20,
              pointerEvents: 'none',
            }} />
            
            {/* Right fade overlay */}
            <div style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '80px',
              background: `linear-gradient(to left, ${theme.background}, transparent)`,
              zIndex: 20,
              pointerEvents: 'none',
            }} />
            
            {/* Modern carousel with proper spacing for shadows */}
            <div 
              style={{ 
                display: 'flex',
                gap: '1.25rem',
                overflowX: 'auto',
                overflowY: 'visible',
                scrollSnapType: 'x mandatory',
                scrollBehavior: 'smooth',
                padding: '2rem 4rem 3rem 4rem', // Extra padding for shadows and side fades
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="gallery-scroll"
            >
            {images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => openPreview(idx)}
                onMouseEnter={() => setIsHovering(idx)}
                onMouseLeave={() => setIsHovering(null)}
                style={{
                  flex: '0 0 auto',
                  width: 'clamp(240px, 28vw, 360px)',
                  aspectRatio: '16/10',
                  borderRadius: '1rem',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  scrollSnapAlign: 'start',
                  position: 'relative',
                  transform: isHovering === idx ? 'scale(1.08) translateY(-8px)' : 'scale(1) translateY(0)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isHovering === idx 
                    ? `0 12px 24px -8px rgba(0,0,0,0.25), 0 0 0 2px ${theme.primary}30` 
                    : '0 4px 12px -4px rgba(0,0,0,0.1)',
                  zIndex: isHovering === idx ? 10 : 1,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transform: isHovering === idx ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: isHovering === idx 
                    ? 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)',
                  transition: 'all 0.4s ease',
                }} />
                {/* Content overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transform: isHovering === idx ? 'translateY(0)' : 'translateY(8px)',
                  opacity: isHovering === idx ? 1 : 0.8,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  <span style={{ 
                    color: '#fff', 
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}>
                    {idx + 1} / {images.length}
                  </span>
                  <div style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '2rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: '#fff',
                    opacity: isHovering === idx ? 1 : 0,
                    transform: isHovering === idx ? 'scale(1)' : 'scale(0.9)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    {t('clickToView')}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
          
          {/* Scroll indicator dots */}
          {images.length > 3 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
            }}>
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => openPreview(idx)}
                  style={{
                    width: isHovering === idx ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: isHovering === idx ? theme.primary : `${theme.primary}40`,
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Glass morphism lightbox */}
      {selectedImage !== null && (
        <div
          onClick={closePreview}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Top bar with close and zoom controls */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: '1.5rem 2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
          }}>
            {/* Zoom controls */}
            <div style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '2rem',
              padding: '0.25rem',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); zoomOut(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'background 0.2s ease',
                }}
              >
                <ZoomOut size={20} />
              </button>
              <span style={{ 
                color: '#fff', 
                fontSize: '0.875rem', 
                fontWeight: 500,
                minWidth: '50px',
                textAlign: 'center',
              }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); zoomIn(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'background 0.2s ease',
                }}
              >
                <ZoomIn size={20} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); resetZoom(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#fff',
                  transition: 'background 0.2s ease',
                }}
              >
                <RotateCcw size={18} />
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={closePreview}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            >
              <X size={24} />
            </button>
          </div>

          {/* Previous button */}
          <button
            onClick={(e) => { e.stopPropagation(); prevImage(); }}
            style={{
              position: 'absolute',
              left: '1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronLeft size={28} />
          </button>

          {/* Image container - BIGGER with scroll on zoom */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '95vw',
              height: '85vh',
              overflow: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{
              minWidth: zoom > 1 ? `${zoom * 100}%` : 'auto',
              minHeight: zoom > 1 ? `${zoom * 100}%` : 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: zoom > 1 ? '2rem' : 0,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImage]}
                alt={`Gallery ${selectedImage + 1}`}
                style={{
                  maxWidth: zoom === 1 ? '95vw' : 'none',
                  maxHeight: zoom === 1 ? '85vh' : 'none',
                  width: zoom > 1 ? `${zoom * 95}vw` : 'auto',
                  height: zoom > 1 ? 'auto' : 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>

          {/* Next button */}
          <button
            onClick={(e) => { e.stopPropagation(); nextImage(); }}
            style={{
              position: 'absolute',
              right: '1.5rem',
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
              transition: 'all 0.2s ease',
            }}
          >
            <ChevronRight size={28} />
          </button>

          {/* Bottom bar with counter */}
          <div style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '2rem',
            padding: '0.75rem 2rem',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}>
            <span>{selectedImage + 1} / {images.length}</span>
            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>
              {t('navigateHint')}
            </span>
          </div>
        </div>
      )}

      <style jsx global>{`
        .gallery-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}
