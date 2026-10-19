import { useState, type ReactNode } from 'react'
import { ArrowRight, Boxes, CalendarDays, Check, Shirt, Sparkles, Tags, WashingMachine } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ErrorState, EmptyState, LoadingState, PageHeading } from '../components/States'
import { useResource } from '../hooks/useResource'
import { activityApi, outfitsApi } from '../services/wardrobe'

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric',
  })
}

import { useToast } from '../context'

export default function DashboardPage() {
  const dashboard = useResource(['activity', 'dashboard'], activityApi.dashboard)
  const outfits = useResource(['outfits'], outfitsApi.list)
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null)
  const toast = useToast()
  const sources = [dashboard, outfits]
  const loading = sources.some((source) => source.loading)
  const error = sources.find((source) => source.error)?.error
  const insights = dashboard.data
  const maximumCategoryCount = Math.max(1, ...(insights?.categories.map((category) => Number(category.count)) ?? [0]))

  async function markWashed(clothingId: number) {
    setFeedback(null)
    try {
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      await activityApi.updateCare(clothingId, { last_washed_at: date })
      const msg = 'Care log updated; the wash reminder has been reset.'
      setFeedback({ message: msg, error: false })
      toast.success(msg)
      dashboard.retry()
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Could not update the care log.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    }
  }

  return <>
    <PageHeading eyebrow="Your space" title="A clear view of your closet." description="See what you own, what you wear, what is coming up and what needs care." action={<Link className="button-primary button-small" to="/app/planner/plan"><CalendarDays size={15} /> Open planner</Link>} />
    {feedback && <p className={`feedback ${feedback.error ? 'feedback-error' : ''}`} role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}
    {loading ? <LoadingState label="Gathering your wardrobe overview" /> : error ? <ErrorState message={error.message} onRetry={() => sources.forEach((source) => source.retry())} /> : <>
      <div className="data-card-grid">
        <MetricCard label="Clothing pieces" value={insights?.total_clothing ?? 0} icon={<Shirt size={18} />} />
        <MetricCard label="Saved outfits" value={outfits.data?.length ?? 0} icon={<Boxes size={18} />} />
        <MetricCard label="Never worn" value={insights?.unworn_count ?? 0} detail={`${insights?.unworn_percent ?? 0}% of your closet`} icon={<Sparkles size={18} />} />
        <MetricCard label="Wash reminders" value={insights?.care_due.length ?? 0} icon={<WashingMachine size={18} />} />
      </div>

      <section className="dashboard-section">
        <div className="dashboard-section-heading"><h3><Tags size={18} /> Collection by category</h3><Link className="text-link" to="/app/wardrobe">Open wardrobe <ArrowRight size={14} aria-hidden="true" /></Link></div>
        {insights?.categories.length ? <div className="category-bars">{insights.categories.map((category) => <div className="category-bar-row" key={category.category_id}><span>{category.name}</span><div className="category-bar-track"><div className="category-bar-fill" style={{ width: `${(Number(category.count) / maximumCategoryCount) * 100}%` }} /></div><span>{category.count}</span></div>)}</div> : <EmptyState title="No categories available." detail="Create categories to organise your wardrobe." />}
        <div className="season-summary">{insights?.seasons.map((season) => <span key={season.season}>{season.season}: <strong>{season.count}</strong></span>)}</div>
      </section>

      <div className="dashboard-insight-grid">
        <section className="dashboard-section insight-card">
          <div className="dashboard-section-heading"><h3>Wear insights</h3><Link className="text-link" to="/app/planner/wear">View history <ArrowRight size={14} /></Link></div>
          {insights?.most_worn ? <div className="wear-stat"><div><span className="eyebrow">Most worn</span><Link to={`/app/wardrobe/${insights.most_worn.clothing_id}`}>{insights.most_worn.name}</Link></div><strong>{insights.most_worn.wear_count}×</strong></div> : <p className="table-row-subtitle">Log what you wear to see your most-used pieces.</p>}
          {insights?.least_worn && <div className="wear-stat"><div><span className="eyebrow">Least worn (among logged pieces)</span><Link to={`/app/wardrobe/${insights.least_worn.clothing_id}`}>{insights.least_worn.name}</Link></div><strong>{insights.least_worn.wear_count}×</strong></div>}
          <p className="table-row-subtitle">{insights?.unworn_count ?? 0} items have no wear history yet.</p>
        </section>
        <section className="dashboard-section insight-card">
          <div className="dashboard-section-heading"><h3>Upcoming outfits</h3><Link className="text-link" to="/app/planner/plan">Calendar <ArrowRight size={14} /></Link></div>
          {insights?.upcoming_plans.length ? <div className="compact-list">{insights.upcoming_plans.map((plan) => <div className="compact-row" key={plan.outfit_plan_id}><span>{formatDate(plan.planned_for)}</span><strong>{plan.outfit_name}</strong>{plan.occasion && <small>{plan.occasion}</small>}</div>)}</div> : <p className="table-row-subtitle">Nothing planned yet. Schedule a saved outfit on your calendar.</p>}
        </section>
      </div>

      <div className="dashboard-insight-grid">
        <section className="dashboard-section insight-card">
          <div className="dashboard-section-heading"><h3>Recently worn</h3><Link className="text-link" to="/app/planner/wear">Log an outfit <ArrowRight size={14} /></Link></div>
          {insights?.recent_logs.length ? <div className="compact-list">{insights.recent_logs.map((log) => <div className="compact-row" key={log.wear_log_id}><span>{formatDate(log.worn_on)}</span><strong>{[log.outfit_name, log.clothing_names].filter(Boolean).join(' · ') || 'Wardrobe item'}</strong>{log.note && <small>{log.note}</small>}</div>)}</div> : <p className="table-row-subtitle">Your wear history will appear here when you start logging outfits.</p>}
        </section>
        <section className="dashboard-section insight-card">
          <div className="dashboard-section-heading"><h3>Care reminders</h3><Link className="text-link" to="/app/wardrobe">Wardrobe <ArrowRight size={14} /></Link></div>
          {insights?.care_due.length ? <div className="compact-list">{insights.care_due.map((item) => <div className="compact-row care-row" key={item.clothing_id}><div><Link to={`/app/wardrobe/${item.clothing_id}`}>{item.name}</Link><small>{item.wears_since_wash} wears since wash (reminder at {item.wash_after_wears})</small></div><button className="button-secondary button-small" type="button" onClick={() => void markWashed(item.clothing_id)}><Check size={14} /> Mark washed</button></div>)}</div> : <p className="table-row-subtitle">No care reminders right now. Set wash intervals when editing a clothing piece.</p>}
        </section>
      </div>
    </>}
  </>
}

function MetricCard({ label, value, detail, icon }: { label: string; value: number; detail?: string; icon: ReactNode }) {
  return <article className="metric-card"><div className="metric-card-top"><span>{label}</span>{icon}</div><strong>{value}</strong>{detail && <span className="metric-detail">{detail}</span>}</article>
}
