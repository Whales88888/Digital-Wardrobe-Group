import { ArrowRight, Boxes, Shirt, Tags } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { ErrorState, LoadingState, PageHeading } from '../components/States'
import { useResource } from '../hooks/useResource'
import { categoriesApi, clothingApi, outfitsApi } from '../services/wardrobe'

export default function DashboardPage() {
  const clothing = useResource(clothingApi.list)
  const categories = useResource(categoriesApi.list)
  const outfits = useResource(outfitsApi.list)
  const sources = [clothing, categories, outfits]
  const loading = sources.some((source) => source.loading)
  const error = sources.find((source) => source.error)?.error

  return <><PageHeading eyebrow="Your space" title="A clear view of your closet." description="A considered overview of the pieces and combinations in your wardrobe." />{loading ? <LoadingState label="Gathering your wardrobe overview" /> : error ? <ErrorState message={error.message} onRetry={() => sources.forEach((source) => source.retry())} /> : <><div className="data-card-grid"><MetricCard label="Clothing pieces" value={clothing.data?.length ?? 0} icon={<Shirt size={18} />} /><MetricCard label="Categories" value={categories.data?.length ?? 0} icon={<Tags size={18} />} /><MetricCard label="Saved outfits" value={outfits.data?.length ?? 0} icon={<Boxes size={18} />} /></div><section className="dashboard-section"><div className="dashboard-section-heading"><h3>Collection at a glance</h3><Link className="text-link" to="/app/wardrobe">Open wardrobe <ArrowRight size={14} aria-hidden="true" /></Link></div>{clothing.data?.length ? <div className="category-bars">{(categories.data ?? []).map((category) => { const count = clothing.data?.filter((item) => item.category_id === category.category_id).length ?? 0; const maximum = Math.max(1,...((categories.data ?? []).map((entry) => clothing.data?.filter((item) => item.category_id === entry.category_id).length ?? 0))); return <div className="category-bar-row" key={category.category_id}><span>{category.name}</span><div className="category-bar-track"><div className="category-bar-fill" style={{ width: `${(count / maximum) * 100}%` }} /></div><span>{count}</span></div>})}{categories.data?.length === 0 && <p>No categories are available.</p>}</div> : <div className="preview-message">Your wardrobe is ready for its first piece.</div>}</section><section className="dashboard-section"><div className="dashboard-section-heading"><h3>Outfit planner</h3><Link className="text-link" to="/app/outfits">View outfits <ArrowRight size={14} aria-hidden="true" /></Link></div><p className="table-row-subtitle">Saved outfit count reflects records currently returned by the wardrobe API.</p></section></>}</>
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-card-top"><span>{label}</span>{icon}</div><strong>{value}</strong></article>
}