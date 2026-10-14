import { ArrowRight, Layers3, ListChecks, Scissors } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import Carousel from '../components/Carousel'
import ClothingImage from '../components/ClothingImage'
import { ErrorState, LoadingState } from '../components/States'
import { useResource } from '../hooks/useResource'
import { categoriesApi, clothingApi, listAllClothing, outfitItemsApi, outfitsApi } from '../services/wardrobe'

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

const bannerImages = [
  {
    text: 'A wardrobe that feels like you',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2100&q=88',
  },
  {
    text: 'Find new ways to wear what you own',
    image: 'https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/176898/Originals/anh-bia-thoi-trang%20(14).jpg',
  },
  {
    text: 'Make every piece part of your story',
    image: 'https://cdn2.fptshop.com.vn/unsafe/Uploads/images/tin-tuc/176898/Originals/anh-bia-thoi-trang%20(2).jpg',
  },
]

export default function HomePage() {
  const { isAuthenticated } = useAuth()

  return <main>
    <section className="home-hero" aria-labelledby="home-title">
      <Carousel images={bannerImages} />
      <div className="hero-content">
        <span className="eyebrow">A considered closet</span>
        <h1 id="home-title">Your wardrobe,<span>reimagined.</span></h1>
        <p>Bring every piece into view. Keep your collection considered, your combinations close, and your everyday style unmistakably yours.</p>
        <Link className="button-primary" to={isAuthenticated ? '/app/wardrobe' : '/register'}>
          {isAuthenticated ? 'Explore My Wardrobe' : 'Create your account'} <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <span className="hero-note">A more thoughtful way to get dressed</span>
    </section>
    <section className="home-section" id="approach">
      <div className="section-heading">
        <div><span className="eyebrow">Designed around what you own</span><h2>Less searching.<br />More wearing.</h2></div>
        <p>A quiet place for the pieces you reach for, the combinations you love, and the details that make getting dressed feel effortless.</p>
      </div>
      <div className="feature-band">
        <article className="feature-item"><span className="feature-icon"><Layers3 size={18} aria-hidden="true" /></span><h3>One considered collection</h3><p>Keep clothing and categories together, with useful details close at hand.</p></article>
        <article className="feature-item"><span className="feature-icon"><ListChecks size={18} aria-hidden="true" /></span><h3>See what you reach for</h3><p>Search and filter your collection to find the right piece without the rummage.</p></article>
        <article className="feature-item"><span className="feature-icon"><Scissors size={18} aria-hidden="true" /></span><h3>Keep outfits in view</h3><p>Save combinations from the clothing already in your wardrobe.</p></article>
      </div>
    </section>
    {isAuthenticated
      ? <><CollectionPreview /><OutfitPreview /></>
      : <section className="home-section preview-section" id="collection">
        <div className="section-heading"><div><span className="eyebrow">Your collection</span><h2>Pieces with a place.</h2></div></div>
        <div className="preview-message">Sign in to see your collection. <Link to="/login">Sign in <ArrowRight size={14} aria-hidden="true" /></Link></div>
      </section>}
  </main>
}
