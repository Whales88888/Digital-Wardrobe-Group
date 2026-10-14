import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export type CarouselImageProps = {
  text: string
  image: string
}

type CarouselProps = {
  images: CarouselImageProps[]
}

export function CarouselImage({ text, image }: CarouselImageProps) {
  return <div className="carousel-image">
    <img src={image} alt="" />
    <p className="carousel-caption">{text}</p>
  </div>
}

export default function Carousel({ images }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeImage = images[activeIndex]

  if (!activeImage) return null

  const showPrevious = () => setActiveIndex((index) => (index - 1 + images.length) % images.length)
  const showNext = () => setActiveIndex((index) => (index + 1) % images.length)

  return <div className="carousel" role="region" aria-roledescription="carousel" aria-label="Wardrobe inspiration">
    <CarouselImage {...activeImage} />
    {images.length > 1 && <>
      <div className="carousel-controls">
        <button type="button" onClick={showPrevious} aria-label="Previous image"><ChevronLeft size={18} aria-hidden="true" /></button>
        <div className="carousel-indicators" aria-label="Choose an image">
          {images.map((image, index) => <button
            type="button"
            key={`${image.image}-${index}`}
            className={index === activeIndex ? 'active' : ''}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show image ${index + 1}`}
            aria-current={index === activeIndex ? 'true' : undefined}
          />)}
        </div>
        <button type="button" onClick={showNext} aria-label="Next image"><ChevronRight size={18} aria-hidden="true" /></button>
      </div>
      <span className="sr-only" aria-live="polite">{activeImage.text}</span>
    </>}
  </div>
}
