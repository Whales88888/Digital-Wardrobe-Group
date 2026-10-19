import { useState, useRef, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/States'
import { useToast } from '../context'
import { useResource } from '../hooks/useResource'
import { activityApi, listAllClothing, outfitsApi } from '../services/wardrobe'
import type { OutfitPlan } from '../services/types'

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDate(value: string): string {
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function ActivityPage({ view }: { view: 'wear' | 'plan' }) {
  const clothing = useResource(['clothing', 'activity'], () => listAllClothing())
  const outfits = useResource(['outfits'], outfitsApi.list)
  const logs = useResource(['activity', 'logs'], activityApi.logs)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [busy, setBusy] = useState(false)
  const [editingLog, setEditingLog] = useState<number | null>(null)
  const [editingPlan, setEditingPlan] = useState<number | null>(null)
  const [deleteTargetLog, setDeleteTargetLog] = useState<number | null>(null)
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<number | null>(null)
  const [selectedDayPlans, setSelectedDayPlans] = useState<{ date: string; plans: OutfitPlan[] } | null>(null)
  const [plannedForDate, setPlannedForDate] = useState(() => localDate(new Date()))

  const planFormRef = useRef<HTMLFormElement>(null)
  const toast = useToast()

  const today = localDate(new Date())
  const firstOffset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const monthStart = `${monthPrefix}-01`
  const monthEnd = localDate(new Date(month.getFullYear(), month.getMonth() + 1, 0))

  const plans = useResource(['activity', 'plans', monthStart, monthEnd], () => activityApi.plans({ from: monthStart, to: monthEnd }))
  const recommendations = useResource(['activity', 'recommendations'], activityApi.recommendations)

  const loading = [clothing, outfits, logs, plans, recommendations].some((resource) => resource.loading)
  const error = [clothing, outfits, logs, plans, recommendations].find((resource) => resource.error)?.error
  const reload = () => [clothing, outfits, logs, plans, recommendations].forEach((resource) => resource.retry())

  async function submitWearLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const clothing_ids = Array.from(
      (formElement.elements.namedItem('clothing_ids') as HTMLSelectElement).selectedOptions,
    ).map((option) => Number(option.value))
    const outfitValue = String(form.get('outfit_id') ?? '')
    if (!clothing_ids.length && !outfitValue) {
      toast.error('Choose clothing pieces or a saved outfit to log.')
      return
    }
    setBusy(true)
    try {
      await activityApi.createLog({
        worn_on: String(form.get('worn_on') ?? ''),
        clothing_ids,
        outfit_id: outfitValue ? Number(outfitValue) : null,
        note: String(form.get('note') ?? '').trim() || null,
      })
      formElement.reset()
      toast.success('Wear logged successfully.')
      logs.retry()
      recommendations.retry()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not save this wear log.')
    } finally {
      setBusy(false)
    }
  }

  async function submitPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setBusy(true)
    try {
      await activityApi.createPlan({
        outfit_id: Number(form.get('outfit_id')),
        planned_for: String(form.get('planned_for') ?? ''),
        occasion: String(form.get('occasion') ?? '').trim() || null,
        note: String(form.get('note') ?? '').trim() || null,
      })
      formElement.reset()
      setPlannedForDate(today)
      toast.success('Outfit added to your calendar.')
      plans.retry()
      if (selectedDayPlans) {
        setSelectedDayPlans(null)
      }
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not schedule this outfit.')
    } finally {
      setBusy(false)
    }
  }

  async function executeDeleteLog() {
    if (!deleteTargetLog) return
    setBusy(true)
    try {
      await activityApi.removeLog(deleteTargetLog)
      toast.success('Wear log deleted.')
      logs.retry()
      recommendations.retry()
      setDeleteTargetLog(null)
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not delete this wear log.')
    } finally {
      setBusy(false)
    }
  }

  async function updateLog(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const clothing_ids = Array.from(
      (formElement.elements.namedItem('clothing_ids') as HTMLSelectElement).selectedOptions,
    ).map((option) => Number(option.value))
    const outfitValue = String(form.get('outfit_id') ?? '')
    setBusy(true)
    try {
      await activityApi.updateLog(id, {
        worn_on: String(form.get('worn_on') ?? ''),
        clothing_ids,
        outfit_id: outfitValue ? Number(outfitValue) : null,
        note: String(form.get('note') ?? '').trim() || null,
      })
      setEditingLog(null)
      toast.success('Wear log updated.')
      logs.retry()
      recommendations.retry()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not update this wear log.')
    } finally {
      setBusy(false)
    }
  }

  async function executeDeletePlan() {
    if (!deleteTargetPlan) return
    setBusy(true)
    try {
      await activityApi.removePlan(deleteTargetPlan)
      toast.success('Calendar plan removed.')
      plans.retry()
      setDeleteTargetPlan(null)
      if (selectedDayPlans) {
        const remaining = selectedDayPlans.plans.filter((p) => p.outfit_plan_id !== deleteTargetPlan)
        if (remaining.length) {
          setSelectedDayPlans({ ...selectedDayPlans, plans: remaining })
        } else {
          setSelectedDayPlans(null)
        }
      }
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not remove this plan.')
    } finally {
      setBusy(false)
    }
  }

  async function updatePlan(event: FormEvent<HTMLFormElement>, id: number) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true)
    try {
      await activityApi.updatePlan(id, {
        outfit_id: Number(form.get('outfit_id')),
        planned_for: String(form.get('planned_for') ?? ''),
        occasion: String(form.get('occasion') ?? '').trim() || null,
        note: String(form.get('note') ?? '').trim() || null,
      })
      setEditingPlan(null)
      toast.success('Calendar plan updated.')
      plans.retry()
    } catch (reason) {
      toast.error(reason instanceof Error ? reason.message : 'Could not update this plan.')
    } finally {
      setBusy(false)
    }
  }

  function handleDayClick(date: string, dayPlans: OutfitPlan[]) {
    if (dayPlans.length > 0) {
      setSelectedDayPlans({ date, plans: dayPlans })
    } else {
      setPlannedForDate(date)
      toast.info(`Selected ${formatDate(date)} for outfit planning.`)
      planFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Make it intentional"
        title={view === 'wear' ? 'Wear' : 'Plan'}
        description={view === 'wear'
          ? 'Record what you wear and review your wardrobe history.'
          : 'Schedule saved outfits and manage your calendar.'}
      />

      {loading ? (
        <LoadingState label="Loading your wardrobe activity" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : (
        <>
          <div className="activity-grid">
            {view === 'wear' && (
            <section className="dashboard-section activity-panel">
              <div className="dashboard-section-heading"><h3>Log what you wore</h3></div>
              <p className="table-row-subtitle">Choose individual pieces, a saved outfit, or both. Logs power your wardrobe insights.</p>
              <form className="planner-form" onSubmit={(event) => void submitWearLog(event)}>
                <label className="form-field">
                  <span>Date worn</span>
                  <input type="date" name="worn_on" defaultValue={today} required max={today} />
                </label>
                <label className="form-field">
                  <span>Saved outfit (optional)</span>
                  <select name="outfit_id" defaultValue="">
                    <option value="">No saved outfit</option>
                    {outfits.data?.map((outfit) => (
                      <option value={outfit.outfit_id} key={outfit.outfit_id}>{outfit.name}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field full">
                  <span>Clothing pieces (select multiple; optional when choosing an outfit)</span>
                  <select name="clothing_ids" multiple size={Math.min(5, Math.max(2, clothing.data?.length ?? 2))}>
                    {clothing.data?.map((item) => (
                      <option value={item.clothing_id} key={item.clothing_id}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field full">
                  <span>Note</span>
                  <textarea name="note" maxLength={1000} placeholder="Where did you wear this? How did it feel?" />
                </label>
                <button className="button-primary button-small" type="submit" disabled={busy || !clothing.data?.length}>
                  {busy ? 'Saving…' : 'Save wear log'}
                </button>
              </form>
            </section>

            )}
            {view === 'plan' && (
            <section className="dashboard-section activity-panel">
              <div className="dashboard-section-heading"><h3>Plan an outfit</h3></div>
              <p className="table-row-subtitle">Schedule one of your saved outfits for an upcoming date or event.</p>
              <form ref={planFormRef} className="planner-form" onSubmit={(event) => void submitPlan(event)}>
                <label className="form-field">
                  <span>Outfit</span>
                  <select name="outfit_id" required defaultValue="">
                    <option value="" disabled>Choose an outfit</option>
                    {outfits.data?.map((outfit) => (
                      <option value={outfit.outfit_id} key={outfit.outfit_id}>{outfit.name}</option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  <span>Date</span>
                  <input
                    type="date"
                    name="planned_for"
                    required
                    value={plannedForDate}
                    onChange={(e) => setPlannedForDate(e.target.value)}
                  />
                </label>
                <label className="form-field full">
                  <span>Occasion</span>
                  <input name="occasion" maxLength={100} placeholder="e.g. Work, dinner, weekend getaway" />
                </label>
                <label className="form-field full">
                  <span>Note</span>
                  <textarea name="note" maxLength={1000} placeholder="Style cues, weather notes, or styling reminders" />
                </label>
                <button className="button-primary button-small" type="submit" disabled={busy || !outfits.data?.length}>
                  {busy ? 'Saving…' : 'Add to calendar'}
                </button>
                {!outfits.data?.length && (
                  <Link className="text-link" to="/app/outfits">
                    Create an outfit first <ArrowRight size={14} />
                  </Link>
                )}
              </form>
            </section>
            )}
          </div>

          {view === 'plan' && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <h3><CalendarDays size={19} aria-hidden="true" /> Outfit calendar</h3>
              <div className="calendar-month-controls">
                <button className="icon-button" type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
                  <ArrowLeft size={16} />
                </button>
                <strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong>
                <button className="icon-button" type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <p className="calendar-hint">Click any day to view scheduled outfits or select the date for planning.</p>

            <div className="calendar-grid" role="grid" aria-label="Outfit plans calendar">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div className="calendar-weekday" role="columnheader" key={day}>{day}</div>
              ))}
              {Array.from({ length: firstOffset }, (_, index) => (
                <div className="calendar-day calendar-day-empty" role="gridcell" key={`empty-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1
                const date = `${monthPrefix}-${String(day).padStart(2, '0')}`
                const dayPlans = (plans.data ?? []).filter((plan) => plan.planned_for.slice(0, 10) === date)
                const hasPlans = dayPlans.length > 0

                return (
                  <button
                    key={date}
                    type="button"
                    className={`calendar-day calendar-day-interactive ${date === today ? 'calendar-day-today' : ''} ${hasPlans ? 'calendar-day-has-plans' : ''}`}
                    role="gridcell"
                    aria-label={`${formatDate(date)}${hasPlans ? `, ${dayPlans.length} outfit planned` : ''}`}
                    onClick={() => handleDayClick(date, dayPlans)}
                  >
                    <div className="calendar-day-header">
                      <span>{day}</span>
                      {hasPlans && <span className="calendar-day-count">{dayPlans.length}</span>}
                    </div>
                    {dayPlans.map((plan) => (
                      <div className="calendar-event" key={plan.outfit_plan_id} title={plan.occasion ?? plan.outfit_name}>
                        {plan.outfit_name}
                      </div>
                    ))}
                  </button>
                )
              })}
            </div>
          </section>
          )}

          {view === 'wear' && (
          <section className="dashboard-section">
            <div className="dashboard-section-heading">
              <h3>Seasonal outfit ideas</h3>
              <span className="eyebrow">Based on your {recommendations.data?.season} wardrobe</span>
            </div>
            {recommendations.data?.recommendations.length ? (
              <div className="recommendation-grid">
                {recommendations.data.recommendations.map((recommendation, index) => (
                  <article className="recommendation-card" key={`${recommendation.items.map((item) => item.clothing_id).join('-')}-${index}`}>
                    <span className="eyebrow">Combination #{index + 1}</span>
                    <ul>
                      {recommendation.items.map((item) => (
                        <li key={item.clothing_id}>
                          <Link to={`/app/wardrobe/${item.clothing_id}`}>{item.name}</Link>
                          {item.color && <span>{item.color}</span>}
                        </li>
                      ))}
                    </ul>
                    <p>{recommendation.reason}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Not enough pieces for a suggestion yet."
                detail="Add tops and bottoms or a dress, and set their season and type to get more relevant ideas."
              />
            )}
          </section>
          )}

          {view === 'wear' && (
          <section className="dashboard-section activity-history">
            <div className="dashboard-section-heading">
              <h3>Wear history</h3>
              <span className="eyebrow">{logs.data?.length ?? 0} recent entries</span>
            </div>
            {logs.data?.length ? (
              <div className="activity-list">
                {logs.data.map((log) => (
                  <article className="activity-row" key={log.wear_log_id}>
                    <div>
                      <strong>{formatDate(log.worn_on)}</strong>
                      <p>{[log.outfit_name, log.clothing_names].filter(Boolean).join(' · ')}</p>
                      {log.note && <span>{log.note}</span>}
                      {editingLog === log.wear_log_id && (
                        <form className="planner-form" onSubmit={(event) => void updateLog(event, log.wear_log_id)}>
                          <label className="form-field">
                            <span>Date worn</span>
                            <input name="worn_on" type="date" required max={today} defaultValue={log.worn_on.slice(0, 10)} />
                          </label>
                          <label className="form-field">
                            <span>Outfit</span>
                            <select name="outfit_id" defaultValue={log.outfit_id ?? ''}>
                              <option value="">No saved outfit</option>
                              {outfits.data?.map((outfit) => (
                                <option value={outfit.outfit_id} key={outfit.outfit_id}>{outfit.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field full">
                            <span>Pieces</span>
                            <select name="clothing_ids" multiple size={4} defaultValue={log.clothing_ids ? log.clothing_ids.split(',').filter(Boolean) : []}>
                              {clothing.data?.map((item) => (
                                <option value={item.clothing_id} key={item.clothing_id}>{item.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field full">
                            <span>Note</span>
                            <textarea name="note" maxLength={1000} defaultValue={log.note ?? ''} />
                          </label>
                          <div className="modal-actions">
                            <button className="button-secondary button-small" type="button" onClick={() => setEditingLog(null)}>Cancel</button>
                            <button className="button-primary button-small" type="submit" disabled={busy}>Save changes</button>
                          </div>
                        </form>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="icon-button" type="button" title="Edit wear log" aria-label="Edit wear log" onClick={() => setEditingLog(editingLog === log.wear_log_id ? null : log.wear_log_id)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button" type="button" title="Delete wear log" aria-label="Delete wear log" onClick={() => setDeleteTargetLog(log.wear_log_id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="No wear logs yet." detail="Record what you wore to start seeing useful wardrobe statistics." />
            )}
          </section>
          )}

          {view === 'plan' && (
          <section className="dashboard-section activity-history">
            <div className="dashboard-section-heading">
              <h3>Scheduled outfits</h3>
              <span className="eyebrow">{plans.data?.length ?? 0} calendar entries</span>
            </div>
            {plans.data?.length ? (
              <div className="activity-list">
                {plans.data.map((plan) => (
                  <article className="activity-row" key={plan.outfit_plan_id}>
                    <div>
                      <strong>{formatDate(plan.planned_for)} · {plan.outfit_name}</strong>
                      {plan.occasion && <p>{plan.occasion}</p>}
                      {plan.note && <span>{plan.note}</span>}
                      {editingPlan === plan.outfit_plan_id && (
                        <form className="planner-form" onSubmit={(event) => void updatePlan(event, plan.outfit_plan_id)}>
                          <label className="form-field">
                            <span>Outfit</span>
                            <select name="outfit_id" required defaultValue={plan.outfit_id}>
                              {outfits.data?.map((outfit) => (
                                <option value={outfit.outfit_id} key={outfit.outfit_id}>{outfit.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="form-field">
                            <span>Date</span>
                            <input name="planned_for" type="date" required defaultValue={plan.planned_for.slice(0, 10)} />
                          </label>
                          <label className="form-field full">
                            <span>Occasion</span>
                            <input name="occasion" maxLength={100} defaultValue={plan.occasion ?? ''} />
                          </label>
                          <label className="form-field full">
                            <span>Note</span>
                            <textarea name="note" maxLength={1000} defaultValue={plan.note ?? ''} />
                          </label>
                          <div className="modal-actions">
                            <button className="button-secondary button-small" type="button" onClick={() => setEditingPlan(null)}>Cancel</button>
                            <button className="button-primary button-small" type="submit" disabled={busy}>Save changes</button>
                          </div>
                        </form>
                      )}
                    </div>
                    <div className="card-actions">
                      <button className="icon-button" type="button" title="Edit calendar entry" aria-label={`Edit ${plan.outfit_name}`} onClick={() => setEditingPlan(editingPlan === plan.outfit_plan_id ? null : plan.outfit_plan_id)}>
                        <Pencil size={15} />
                      </button>
                      <button className="icon-button" type="button" title="Remove calendar entry" aria-label={`Remove ${plan.outfit_name} from calendar`} onClick={() => setDeleteTargetPlan(plan.outfit_plan_id)}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Your calendar is clear." detail="Plan a saved outfit above to see it here." />
            )}
          </section>
          )}
        </>
      )}

      {selectedDayPlans && (
        <div className="modal-backdrop">
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="day-modal-title">
            <div className="modal-heading">
              <div>
                <h2 id="day-modal-title">Outfits on {formatDate(selectedDayPlans.date)}</h2>
                <p>{selectedDayPlans.plans.length} outfit(s) planned for this day.</p>
              </div>
              <button className="icon-button" type="button" aria-label="Close dialog" onClick={() => setSelectedDayPlans(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="day-modal-content">
              {selectedDayPlans.plans.map((plan) => (
                <div key={plan.outfit_plan_id} className="day-plan-item">
                  <div>
                    <strong>{plan.outfit_name}</strong>
                    {plan.occasion && <span className="day-plan-tag">{plan.occasion}</span>}
                    {plan.note && <p className="day-plan-note">{plan.note}</p>}
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    title="Remove from calendar"
                    aria-label={`Remove ${plan.outfit_name}`}
                    onClick={() => {
                      setDeleteTargetPlan(plan.outfit_plan_id)
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button
                className="button-primary button-small"
                type="button"
                onClick={() => {
                  setPlannedForDate(selectedDayPlans.date)
                  setSelectedDayPlans(null)
                  planFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }}
              >
                <Plus size={14} /> Plan another outfit for this date
              </button>
            </div>
          </section>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTargetLog)}
        title="Delete wear log?"
        message="This entry will be permanently removed from your wear history and statistics."
        confirmText="Delete log"
        busy={busy}
        onClose={() => setDeleteTargetLog(null)}
        onConfirm={() => void executeDeleteLog()}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTargetPlan)}
        title="Remove outfit from calendar?"
        message="This planned entry will be removed from your scheduled outfits."
        confirmText="Remove entry"
        busy={busy}
        onClose={() => setDeleteTargetPlan(null)}
        onConfirm={() => void executeDeletePlan()}
      />
    </>
  )
}
