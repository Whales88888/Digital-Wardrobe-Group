import { ArrowRight, Boxes, Database, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import './AboutPage.css'

export default function AboutPage() {
  return <main className="about-page">
    <section className="about-intro">
      <span className="eyebrow">A more considered closet</span>
      <h1>Make room for the pieces that feel like you.</h1>
      <p>Digital Wardrobe brings your clothing collection, categories and saved outfits into one calm, useful place.</p>
      <Link className="button-primary" to="/app/wardrobe">Explore your wardrobe <ArrowRight size={15} aria-hidden="true" /></Link>
    </section>
    <section className="about-details" aria-label="About Digital Wardrobe">
      <article><span className="about-icon"><Database size={19} aria-hidden="true" /></span><span className="eyebrow">A real collection</span><h2>Your pieces, not placeholders.</h2><p>The wardrobe view reads clothing, color, size, category and image URL from the existing project API and database.</p></article>
      <article><span className="about-icon"><Tags size={19} aria-hidden="true" /></span><span className="eyebrow">A little more order</span><h2>Categories that stay useful.</h2><p>Categories organize the pieces you already have and filter your wardrobe without inventing additional fields.</p></article>
      <article><span className="about-icon"><Boxes size={19} aria-hidden="true" /></span><span className="eyebrow">Outfits, connected</span><h2>Combinations from your own closet.</h2><p>Saved outfits are shown with their linked clothing through the existing Outfit Item relationship.</p></article>
    </section>
    <section className="about-note"><span className="eyebrow">Built for everyday use</span><p>Digital Wardrobe is a practical clothing-management project. Authentication is not available in the current backend, so this app does not simulate sign-in or user privacy.</p></section>
  </main>
}