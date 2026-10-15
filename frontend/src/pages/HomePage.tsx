import { ArrowRight, CalendarDays, Layers3, ListChecks, Search, Shirt, Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, Card, Col, Container, Form, Row } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import ClothingImage from '../components/ClothingImage'
import { ErrorState, LoadingState } from '../components/States'
import { useResource } from '../hooks/useResource'
import { categoriesApi, clothingApi, listAllClothing, outfitItemsApi, outfitsApi } from '../services/wardrobe'
import { clothingTypes } from '../services/types'

function CollectionPreview() {
  const clothing = useResource(['clothing', 'preview'], () => clothingApi.list({ page_size: 3 }))
  const categories = useResource(['categories'], categoriesApi.list)
  const categoryName = (categoryId: number) => categories.data?.find((item) => item.category_id === categoryId)?.name ?? 'Uncategorised'

  return <section className="home-section preview-section" id="collection">
    <div className="section-heading">
      <div><span className="eyebrow">Your collection</span><h2>Pieces with a place.</h2></div>
      <Link className="text-link" to="/app/wardrobe">View wardrobe <ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
    {clothing.loading || categories.loading
      ? <LoadingState label="Loading your collection" />
      : clothing.error || categories.error
        ? <ErrorState message={(clothing.error || categories.error)?.message ?? 'Your collection could not be loaded.'} onRetry={() => { clothing.retry(); categories.retry() }} />
        : clothing.data?.items.length
            ? <div className="preview-grid">{clothing.data.items.map((item) => <article className="preview-clothing" key={item.clothing_id}>
            <Link className="preview-image" to={`/app/wardrobe/${item.clothing_id}`} aria-label={`View ${item.name}`}><ClothingImage src={item.image_url} alt={item.name} /></Link>
            <div className="preview-meta"><div><h3>{item.name}</h3><p>{categoryName(item.category_id)}</p></div><span>{item.color || item.size || ''}</span></div>
          </article>)}</div>
          : <div className="preview-message">No clothing items yet.</div>}
  </section>
}

function OutfitPreview() {
  const outfits = useResource(['outfits'], outfitsApi.list)
  const outfitItems = useResource(['outfit-items'], outfitItemsApi.list)
  const clothing = useResource(['clothing', 'outfit-preview'], () => listAllClothing())
  const error = outfits.error || outfitItems.error || clothing.error
  const retry = () => { outfits.retry(); outfitItems.retry(); clothing.retry() }

  return <section className="home-section" id="outfit-edit">
    <div className="section-heading">
      <div><span className="eyebrow">Made from your wardrobe</span><h2>Outfits, kept together.</h2></div>
      <Link className="text-link" to="/app/outfits">Explore outfits <ArrowRight size={14} aria-hidden="true" /></Link>
    </div>
    {outfits.loading || outfitItems.loading || clothing.loading
      ? <LoadingState label="Loading saved outfits" />
      : error
        ? <ErrorState message={error.message} onRetry={retry} />
        : outfits.data?.length
          ? <div className="outfit-preview-grid">{outfits.data.slice(0, 2).map((outfit) => {
            const pieces = (outfitItems.data ?? [])
              .filter((item) => item.outfit_id === outfit.outfit_id)
              .map((item) => clothing.data?.find((piece) => piece.clothing_id === item.clothing_id)?.name)
              .filter((name): name is string => Boolean(name))
            return <article className="outfit-preview" key={outfit.outfit_id}>
              <h3>{outfit.name}</h3>
              <p>{outfit.description || 'A saved combination from your collection.'}</p>
              <div className="outfit-piece-list">{pieces.length
                ? pieces.slice(0, 4).map((piece, index) => <span className="outfit-piece" key={`${piece}-${index}`}>{piece}</span>)
                : <span className="outfit-piece">No linked pieces</span>}</div>
            </article>
          })}</div>
          : <div className="preview-message">No saved outfits yet.</div>}
  </section>
}

const typeCards = [
  { type: 'top', title: 'Tops', image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=720&q=85' },
  { type: 'bottom', title: 'Bottoms', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=720&q=85' },
  { type: 'outerwear', title: 'Outerwear', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=720&q=85' },
  { type: 'dress', title: 'Dresses', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=720&q=85' },
  { type: 'shoes', title: 'Shoes', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=720&q=85' },
  { type: 'accessory', title: 'Accessories', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=720&q=85' },
]

const heroImages = [
  { src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1100&q=88', alt: 'Friends exploring personal style together' },
  { src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1100&q=88', alt: 'A colorful street-style outfit' },
  { src: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1100&q=88', alt: 'A thoughtfully styled fashion look' },
]

function HomeHeroCarousel() {
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const interval = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % heroImages.length)
    }, 4500)
    return () => window.clearInterval(interval)
  }, [])

  return <div className="search-hero-image" role="region" aria-roledescription="carousel" aria-label="Wardrobe inspiration">
    {heroImages.map((image, index) => <img
      key={image.src}
      className={`search-hero-slide ${index === activeImage ? 'is-active' : ''}`}
      src={image.src}
      alt={image.alt}
      aria-hidden={index !== activeImage}
    />)}
    <div className="search-hero-carousel-controls" role="group" aria-label="Choose banner image">
      <div className="search-hero-indicators">
        {heroImages.map((image, index) => <button
          key={image.src}
          type="button"
          className={index === activeImage ? 'is-active' : ''}
          aria-label={`Show banner image ${index + 1}`}
          aria-pressed={index === activeImage}
          onClick={() => setActiveImage(index)}
        />)}
      </div>
    </div>
  </div>
}

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('')

  function wardrobePath(selectedType = type) {
    const params = new URLSearchParams()
    if (query.trim()) params.set('search', query.trim())
    if (selectedType) params.set('type', selectedType)
    const suffix = params.size ? `?${params.toString()}` : ''
    return `/app/wardrobe${suffix}`
  }

  function searchWardrobe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate(isAuthenticated ? wardrobePath() : '/login')
  }

  return <main className="search-home">
    <section className="search-home-hero" aria-labelledby="home-title">
      <Container className="search-home-container">
        <Row className="align-items-center g-4 g-lg-1 search-hero-row">
          <Col xs={12} lg={5}>
            <div className="search-hero-copy">
              <span className="home-kicker"><Sparkles size={14} aria-hidden="true" /> A wardrobe that works for you</span>
              <h1 id="home-title">Get dressed with <span>what you love.</span></h1>
              <p>Keep every piece close, find fresh combinations, and make getting ready feel easy.</p>
              <Link className="hero-text-link" to={isAuthenticated ? '/app/wardrobe' : '/register'}>
                {isAuthenticated ? 'Open my wardrobe' : 'Start your wardrobe'} <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Col>
          <Col xs={12} lg={7}>
            <HomeHeroCarousel />
          </Col>
        </Row>

        <Form className="wardrobe-search" onSubmit={searchWardrobe}>
          <Row className="g-2 g-lg-0 align-items-end">
            <Col xs={12} md={6} lg={6}>
              <Form.Group className="home-search-field">
                <Form.Label htmlFor="wardrobe-search-query">What are you looking for?</Form.Label>
                <div className="home-search-input">
                  <Search size={19} aria-hidden="true" />
                  <Form.Control id="wardrobe-search-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘linen shirt’ or ‘black jacket’" />
                </div>
              </Form.Group>
            </Col>
            <Col xs={12} md={4} lg={3}>
              <Form.Group className="home-search-field">
                <Form.Label htmlFor="wardrobe-search-type">Clothing type</Form.Label>
                <div className="home-search-select">
                  <Shirt size={18} aria-hidden="true" />
                  <Form.Select id="wardrobe-search-type" value={type} onChange={(event) => setType(event.target.value)}>
                    <option value="">All pieces</option>
                    {clothingTypes.map((option) => <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>)}
                  </Form.Select>
                </div>
              </Form.Group>
            </Col>
            <Col xs={12} md={2} lg={3}>
              <Button type="submit" className="home-search-submit">
                <Search size={17} aria-hidden="true" /> {isAuthenticated ? 'Search wardrobe' : 'Sign in to search'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Container>
    </section>

    <section className="home-section home-category-section" id="approach">
      <Container className="search-home-container">
        <div className="home-section-heading">
          <div><span className="eyebrow">Start exploring</span><h2>Browse your wardrobe</h2><p>Go straight to the pieces you want to wear.</p></div>
          <Link className="text-link" to={isAuthenticated ? '/app/wardrobe' : '/login'}>View all pieces <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        <Row className="g-3 g-md-4 home-type-grid">
          {typeCards.map((item) => <Col xs={6} md={4} lg={2} key={item.type}>
            <Link className="home-type-link" to={isAuthenticated ? wardrobePath(item.type) : '/login'}>
              <Card className="home-type-card">
                <Card.Img variant="top" src={item.image} alt={item.title} />
                <Card.Body><Card.Title>{item.title}</Card.Title></Card.Body>
              </Card>
            </Link>
          </Col>)}
        </Row>
      </Container>
    </section>

    <section className="home-value-band">
      <Container className="search-home-container">
        <Row className="g-4">
          <Col xs={12} md={4}><article className="home-value-item"><span><Layers3 size={19} aria-hidden="true" /></span><div><h3>One place for every piece</h3><p>Keep details, categories, and care notes together.</p></div></article></Col>
          <Col xs={12} md={4}><article className="home-value-item"><span><ListChecks size={19} aria-hidden="true" /></span><div><h3>Find it in a moment</h3><p>Search and filter your collection without the rummage.</p></div></article></Col>
          <Col xs={12} md={4}><article className="home-value-item"><span><CalendarDays size={19} aria-hidden="true" /></span><div><h3>Plan what to wear</h3><p>Save combinations and keep your outfit ideas close.</p></div></article></Col>
        </Row>
      </Container>
    </section>

    {isAuthenticated
      ? <div id="collection"><CollectionPreview /><div id="outfits"><OutfitPreview /></div></div>
      : <section className="home-section preview-section" id="collection">
        <Container className="search-home-container">
          <div className="home-signin-strip"><div><span className="eyebrow">Make it yours</span><h2>Your collection starts here.</h2><p>Add the pieces you own and discover new ways to wear them.</p></div><Link className="button-primary" to="/register">Create your wardrobe <ArrowRight size={15} aria-hidden="true" /></Link></div>
        </Container>
      </section>}
  </main>
}
