import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Boxes, Check, Eye, Pencil, Plus, Search, Sparkles, Trash2, WashingMachine, X } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ClothingImage from '../components/ClothingImage'
import ConfirmModal from '../components/ConfirmModal'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/States'
import { useAuth } from '../auth/useAuth'
import { useToast } from '../context'
import { useResource } from '../hooks/useResource'
import { activityApi, categoriesApi, clothingApi, listAllClothing, outfitItemsApi, outfitsApi } from '../services/wardrobe'
import { clothingSeasons, clothingTypes, type Category, type Clothing, type ClothingInput, type Outfit, type OutfitInput, type OutfitItem } from '../services/types'

type FeedbackValue = { message: string; error?: boolean } | null

function Feedback({ value }: { value: FeedbackValue }) {
  if (!value) return null
  return <div className={`feedback ${value.error ? 'feedback-error' : ''}`} role={value.error ? 'alert' : 'status'}>{value.message}</div>
}

function Modal({ title, detail, onClose, children }: { title: string; detail: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return <div className="modal-backdrop"><section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{detail}</p></div><button className="icon-button" type="button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></div>{children}</section></div>
}

function Field({ label, children, full = false }: { label: string; children: ReactNode; full?: boolean }) {
  return <label className={`form-field ${full ? 'full' : ''}`}><span>{label}</span>{children}</label>
}

function ClothingForm({
  initial,
  categories,
  busy,
  onCancel,
  onSubmit,
}: {
  initial: Clothing | null
  categories: Category[]
  busy: boolean
  onCancel: () => void
  onSubmit: (data: ClothingInput) => Promise<void>
}) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const category_id = Number(form.get('category_id'))
    const seasonValue = String(form.get('season') ?? '')
    const typeValue = String(form.get('clothing_type') ?? '')
    const season = clothingSeasons.find((value) => value === seasonValue) ?? null
    const clothing_type = clothingTypes.find((value) => value === typeValue) ?? null
    if (!name || !category_id) {
      setMessage('Choose a name and category to continue.')
      return
    }
    if ((seasonValue && !season) || (typeValue && !clothing_type)) {
      setMessage('Choose a valid season and clothing type.')
      return
    }

    try {
      const selectedFile = form.get('image')
      let image_url = String(form.get('image_url') ?? '').trim() || null
      if (selectedFile instanceof File && selectedFile.size > 0) {
        if (selectedFile.size > 5 * 1024 * 1024) {
          setMessage('Choose an image smaller than 5 MB.')
          return
        }
        const uploaded = await clothingApi.uploadImage(selectedFile)
        image_url = uploaded.image_url
      }
      await onSubmit({
        category_id,
        name,
        color: String(form.get('color') ?? '').trim() || null,
        size: String(form.get('size') ?? '').trim() || null,
        image_url,
        season,
        clothing_type,
        care_instructions: String(form.get('care_instructions') ?? '').trim() || null,
        last_washed_at: String(form.get('last_washed_at') ?? '') || null,
        wash_after_wears: Number(form.get('wash_after_wears') ?? 3),
      })
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : 'Image upload failed.')
    }
  }

  return <form onSubmit={submit}><div className="form-grid"><Field label="Item name"><input name="name" required maxLength={100} defaultValue={initial?.name ?? ''} autoFocus /></Field><Field label="Category"><select name="category_id" required defaultValue={initial?.category_id ?? ''}><option value="" disabled>Select category</option>{categories.map((category) => <option value={category.category_id} key={category.category_id}>{category.name}</option>)}</select></Field><Field label="Color"><input name="color" maxLength={50} defaultValue={initial?.color ?? ''} placeholder="e.g. Charcoal" /></Field><Field label="Size"><input name="size" maxLength={20} defaultValue={initial?.size ?? ''} placeholder="e.g. M" /></Field><Field label="Season"><select name="season" defaultValue={initial?.season ?? ''}><option value="">Any season</option>{clothingSeasons.map((season) => <option value={season} key={season}>{season.replace('-', ' ')}</option>)}</select></Field><Field label="Clothing type"><select name="clothing_type" defaultValue={initial?.clothing_type ?? ''}><option value="">Unspecified</option>{clothingTypes.map((type) => <option value={type} key={type}>{type}</option>)}</select></Field><Field label="Image URL" full><input name="image_url" type="url" maxLength={500} defaultValue={initial?.image_url ?? ''} placeholder="https://..." /></Field><Field label="Upload an image (JPEG, PNG, WebP; max 5 MB)" full><input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></Field><Field label="Care instructions" full><textarea name="care_instructions" maxLength={2000} defaultValue={initial?.care_instructions ?? ''} placeholder="e.g. Hand wash cold, air dry" /></Field><Field label="Wash reminder after wears"><input name="wash_after_wears" type="number" min={1} max={30} defaultValue={initial?.wash_after_wears ?? 3} /></Field><Field label="Last washed"><input name="last_washed_at" type="date" defaultValue={initial?.last_washed_at?.slice(0, 10) ?? ''} /></Field></div>{message && <p className="form-error" role="alert">{message}</p>}{categories.length === 0 && <p className="form-error">Create a category before adding clothing.</p>}<div className="modal-actions"><button className="button-secondary button-small" type="button" onClick={onCancel}>Cancel</button><button className="button-primary button-small" type="submit" disabled={busy || categories.length === 0}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add to wardrobe'}</button></div></form>
}

function CategoryForm({ initial, busy, onCancel, onSubmit }: { initial: Category | null; busy: boolean; onCancel: () => void; onSubmit: (name: string) => Promise<void> }) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = String(new FormData(event.currentTarget).get('name') ?? '').trim()
    if (!name) { setMessage('Enter a category name.'); return }
    await onSubmit(name)
  }
  return <form onSubmit={submit}><div className="form-grid"><Field label="Category name" full><input name="name" required maxLength={100} defaultValue={initial?.name ?? ''} autoFocus /></Field></div>{message && <p className="form-error">{message}</p>}<div className="modal-actions"><button className="button-secondary button-small" type="button" onClick={onCancel}>Cancel</button><button className="button-primary button-small" type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save category' : 'Create category'}</button></div></form>
}

function OutfitForm({ initial, busy, onCancel, onSubmit }: { initial: Outfit | null; busy: boolean; onCancel: () => void; onSubmit: (data: OutfitInput) => Promise<void> }) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    if (!name) { setMessage('Enter an outfit name.'); return }
    await onSubmit({ name, description: String(form.get('description') ?? '').trim() || null })
  }
  return <form onSubmit={submit}><div className="form-grid"><Field label="Outfit name" full><input name="name" required maxLength={100} defaultValue={initial?.name ?? ''} autoFocus /></Field><Field label="Description" full><textarea name="description" defaultValue={initial?.description ?? ''} /></Field></div>{message && <p className="form-error">{message}</p>}<div className="modal-actions"><button className="button-secondary button-small" type="button" onClick={onCancel}>Cancel</button><button className="button-primary button-small" type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save outfit' : 'Create outfit'}</button></div></form>
}

function ClothingCard({
  item,
  category,
  isCareDue,
  onEdit,
  onDelete,
}: {
  item: Clothing
  category?: string
  isCareDue?: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <article className="clothing-card">
      <div className="clothing-card-image">
        <ClothingImage src={item.image_url} alt={item.name} />
        <div className="clothing-card-badges">
          {item.season && (
            <span className="card-badge badge-season" title={`Season: ${item.season}`}>
              {item.season.replace('-', ' ')}
            </span>
          )}
          {item.clothing_type && (
            <span className="card-badge badge-type" title={`Type: ${item.clothing_type}`}>
              {item.clothing_type}
            </span>
          )}
          {isCareDue && (
            <span className="card-badge badge-care" title="Wash reminder threshold reached">
              <WashingMachine size={10} /> Wash due
            </span>
          )}
        </div>
        <div className="clothing-card-actions">
          <Link className="icon-button" to={`/app/wardrobe/${item.clothing_id}`} aria-label={`View ${item.name}`} title="View details">
            <Eye size={16} />
          </Link>
          <button className="icon-button" type="button" aria-label={`Edit ${item.name}`} title="Edit clothing" onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button className="icon-button" type="button" aria-label={`Delete ${item.name}`} title="Delete clothing" onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <div className="clothing-card-copy">
        <h3>{item.name}</h3>
        <p>
          <span>{category ?? 'Uncategorised'}</span>
          {item.color && (
            <>
              <span className="color-swatch" style={{ backgroundColor: item.color }} aria-label={`Color ${item.color}`} />
              <span>{item.color}</span>
            </>
          )}
          {item.size && <span>· {item.size}</span>}
        </p>
      </div>
    </article>
  )
}

export function WardrobePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(() => searchParams.get('search') ?? '')
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '')
  const [sort, setSort] = useState<'name' | 'color'>('name')
  const [editing, setEditing] = useState<Clothing | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const [deleteTarget, setDeleteTarget] = useState<Clothing | null>(null)
  const toast = useToast()

  const selectedCategory = searchParams.get('category') ?? ''
  const selectedSeason = clothingSeasons.find((value) => value === searchParams.get('season')) ?? ''
  const selectedType = clothingTypes.find((value) => value === searchParams.get('type')) ?? ''
  const rawPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(rawPage) && rawPage > 0 ? rawPage : 1
  const categoryId = /^[1-9]\d*$/.test(selectedCategory) ? Number(selectedCategory) : undefined

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(query.trim()), 250)
    return () => window.clearTimeout(timeout)
  }, [query])

  const clothing = useResource(
    ['clothing', page, selectedCategory, selectedSeason, selectedType, search, sort],
    () => clothingApi.list({
      page,
      page_size: 24,
      category_id: categoryId,
      season: selectedSeason || undefined,
      clothing_type: selectedType || undefined,
      search: search || undefined,
      sort,
    }),
  )
  const categories = useResource(['categories'], categoriesApi.list)
  const outfitItems = useResource(['outfit-items'], outfitItemsApi.list)
  const dashboard = useResource(['activity', 'dashboard'], activityApi.dashboard)

  const careDueIds = new Set(dashboard.data?.care_due.map((i) => i.clothing_id) ?? [])
  const categoryName = (id: number) => categories.data?.find((category) => category.category_id === id)?.name
  const filtered = clothing.data?.items ?? []

  function updateSearchParam(key: string, value: string) {
    const nextParams = new URLSearchParams(searchParams)
    if (value) nextParams.set(key, value)
    else nextParams.delete(key)
    nextParams.delete('page')
    setSearchParams(nextParams)
  }

  function changePage(nextPage: number) {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('page', String(nextPage))
    setSearchParams(nextParams)
  }

  async function save(data: ClothingInput) {
    setBusy(true)
    try {
      if (editing && editing !== 'new') await clothingApi.update(editing.clothing_id, data)
      else await clothingApi.create(data)
      const msg = editing === 'new' ? 'Piece added to your wardrobe.' : 'Clothing details updated.'
      setEditing(null)
      setFeedback({ message: msg })
      toast.success(msg)
      clothing.retry()
      dashboard.retry()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save this clothing item.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function confirmRemove() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      await clothingApi.remove(deleteTarget.clothing_id)
      const msg = `“${deleteTarget.name}” deleted from wardrobe.`
      setFeedback({ message: msg })
      toast.success(msg)
      clothing.retry()
      outfitItems.retry()
      dashboard.retry()
      setDeleteTarget(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not delete this item.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
      clothing.retry()
      outfitItems.retry()
    } finally {
      setBusy(false)
    }
  }

  const isLoading = clothing.loading || categories.loading || outfitItems.loading
  const resourceError = clothing.error || categories.error || outfitItems.error
  const retryAll = () => { clothing.retry(); categories.retry(); outfitItems.retry(); dashboard.retry() }

  return (
    <>
      <PageHeading
        eyebrow="The collection"
        title="My wardrobe"
        description={`${clothing.data?.total ?? 0} pieces in your account.`}
        action={<button className="button-primary button-small" type="button" disabled={isLoading} onClick={() => setEditing('new')}><Plus size={15} /> Add clothing</button>}
      />
      <Feedback value={feedback} />
      {isLoading ? <LoadingState label="Loading your clothing" /> : resourceError ? <ErrorState message={resourceError.message} onRetry={retryAll} /> : <>
        <div className="page-toolbar">
          <label className="search-control">
            <Search size={16} aria-hidden="true" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); if (page !== 1) changePage(1) }} placeholder="Search your wardrobe" aria-label="Search clothing across your wardrobe" />
          </label>
          <label className="filter-control">
            <span className="sr-only">Filter by category</span>
            <select value={selectedCategory} onChange={(event) => updateSearchParam('category', event.target.value)}>
              <option value="">All categories</option>
              {categories.data?.map((category) => <option value={category.category_id} key={category.category_id}>{category.name}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span className="sr-only">Filter by season</span>
            <select value={selectedSeason} onChange={(event) => updateSearchParam('season', event.target.value)}>
              <option value="">All seasons</option>
              {clothingSeasons.map((season) => <option value={season} key={season}>{season.replace('-', ' ')}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span className="sr-only">Filter by clothing type</span>
            <select value={selectedType} onChange={(event) => updateSearchParam('type', event.target.value)}>
              <option value="">All types</option>
              {clothingTypes.map((type) => <option value={type} key={type}>{type}</option>)}
            </select>
          </label>
          <label className="filter-control">
            <span className="sr-only">Sort your wardrobe</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value === 'color' ? 'color' : 'name'); if (page !== 1) changePage(1) }}>
              <option value="name">Name A–Z</option>
              <option value="color">Color</option>
            </select>
          </label>
        </div>
        {filtered.length
          ? <div className="clothing-grid">
              {filtered.map((item) => (
                <ClothingCard
                  key={item.clothing_id}
                  item={item}
                  category={categoryName(item.category_id)}
                  isCareDue={careDueIds.has(item.clothing_id)}
                  onEdit={() => setEditing(item)}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))}
            </div>
          : <EmptyState
              title={query || selectedCategory || selectedSeason || selectedType ? 'No pieces match this view.' : 'No clothing items yet.'}
              detail={query ? 'Try changing the search or filters.' : 'Add a piece from your real wardrobe to get started.'}
              action={!query && !selectedCategory && !selectedSeason && !selectedType ? <button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add clothing</button> : undefined}
            />}
        {(clothing.data?.total_pages ?? 0) > 1 && (
          <nav className="pagination-controls" aria-label="Wardrobe pages">
            <button className="button-secondary button-small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
            <span>Page {clothing.data?.page} of {clothing.data?.total_pages}</span>
            <button className="button-secondary button-small" type="button" disabled={page >= (clothing.data?.total_pages ?? 0)} onClick={() => changePage(page + 1)}>Next</button>
          </nav>
        )}
      </>}
      {editing && (
        <Modal title={editing === 'new' ? 'Add a clothing piece' : 'Edit clothing'} detail="Images are stored locally in development. Configure Cloudinary on the server for production uploads; an image URL can also be used." onClose={() => setEditing(null)}>
          <ClothingForm initial={editing === 'new' ? null : editing} categories={categories.data ?? []} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} />
        </Modal>
      )}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title={`Delete “${deleteTarget?.name}”?`}
        message="This piece will be permanently removed from your wardrobe and any linked outfits."
        confirmText="Delete piece"
        busy={busy}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void confirmRemove()}
      />
    </>
  )
}

export function ClothingDetailPage() {
  const { id } = useParams()
  const loadItem = useCallback(() => clothingApi.get(Number(id)), [id])
  const item = useResource(['clothing', id], loadItem)
  const categories = useResource(['categories'], categoriesApi.list)
  const outfitItems = useResource(['outfit-items'], outfitItemsApi.list)
  const outfits = useResource(['outfits'], outfitsApi.list)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const toast = useToast()
  const navigate = useNavigate()

  async function save(data: ClothingInput) {
    if (!item.data) return
    setBusy(true)
    try {
      await clothingApi.update(item.data.clothing_id, data)
      setEditing(false)
      const msg = 'Clothing details updated.'
      setFeedback({ message: msg })
      toast.success(msg)
      item.retry()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save changes.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function markWashed() {
    if (!item.data) return
    setBusy(true)
    try {
      const now = new Date()
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      await activityApi.updateCare(item.data.clothing_id, { last_washed_at: date })
      const msg = 'Marked as washed. Wash reminder interval has been reset.'
      setFeedback({ message: msg })
      toast.success(msg)
      item.retry()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not update care log.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function executeRemove() {
    if (!item.data) return
    setBusy(true)
    try {
      await clothingApi.remove(item.data.clothing_id)
      toast.success(`“${item.data.name}” deleted.`)
      navigate('/app/wardrobe', { replace: true })
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not delete this item.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
      item.retry()
      outfitItems.retry()
      setConfirmDelete(false)
    } finally {
      setBusy(false)
    }
  }

  if (item.loading || categories.loading || outfitItems.loading) return <LoadingState label="Loading clothing details" />
  const resourceError = item.error || categories.error || outfitItems.error
  if (resourceError) return <ErrorState message={resourceError.message} onRetry={() => { item.retry(); categories.retry(); outfitItems.retry() }} />
  if (!item.data) return <EmptyState title="Clothing item not found." detail="This item may have been removed from the collection." action={<Link className="button-secondary button-small" to="/app/wardrobe">Return to wardrobe</Link>} />

  const category = categories.data?.find((entry) => entry.category_id === item.data?.category_id)?.name ?? 'Uncategorised'
  const linkedOutfits = (outfitItems.data ?? [])
    .filter((link) => link.clothing_id === item.data?.clothing_id)
    .map((link) => outfits.data?.find((o) => o.outfit_id === link.outfit_id))
    .filter((o): o is Outfit => Boolean(o))

  return (
    <>
      <Link className="text-link back-link" to="/app/wardrobe">
        <ArrowLeft size={14} /> Back to wardrobe
      </Link>
      <Feedback value={feedback} />
      <div className="detail-layout">
        <div className="detail-image">
          <ClothingImage src={item.data.image_url} alt={item.data.name} size={50} />
        </div>
        <section className="detail-copy">
          <div className="detail-header-badges">
            <span className="eyebrow">{category}</span>
            {item.data.season && (
              <span className="card-badge badge-season">
                {item.data.season.replace('-', ' ')}
              </span>
            )}
            {item.data.clothing_type && (
              <span className="card-badge badge-type">
                {item.data.clothing_type}
              </span>
            )}
          </div>
          <h2>{item.data.name}</h2>
          
          <dl className="detail-list">
            <div>
              <dt>Color</dt>
              <dd>
                {item.data.color ? (
                  <span className="detail-color-val">
                    <span className="color-swatch" style={{ backgroundColor: item.data.color }} />
                    {item.data.color}
                  </span>
                ) : (
                  'Not specified'
                )}
              </dd>
            </div>
            <div><dt>Size</dt><dd>{item.data.size || 'Not specified'}</dd></div>
            <div><dt>Season</dt><dd>{item.data.season ? item.data.season.replace('-', ' ') : 'All seasons'}</dd></div>
            <div><dt>Clothing Type</dt><dd>{item.data.clothing_type || 'Unspecified'}</dd></div>
            <div><dt>Care Instructions</dt><dd>{item.data.care_instructions || 'Standard care'}</dd></div>
            <div><dt>Last Washed</dt><dd>{item.data.last_washed_at ? item.data.last_washed_at.slice(0, 10) : 'Never recorded'}</dd></div>
            <div><dt>Wash Reminder</dt><dd>Every {item.data.wash_after_wears} wears</dd></div>
            <div><dt>Item Reference ID</dt><dd>#{item.data.clothing_id}</dd></div>
          </dl>

          <div className="detail-actions">
            <button className="button-primary button-small" type="button" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit details
            </button>
            <button className="button-secondary button-small" type="button" disabled={busy} onClick={() => void markWashed()}>
              <Check size={14} /> Mark washed
            </button>
            <button className="button-secondary button-small button-danger" type="button" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={15} /> Delete
            </button>
          </div>

          <div className="detail-outfits-section">
            <h3><Boxes size={17} /> Included in Outfits</h3>
            {linkedOutfits.length ? (
              <div className="detail-outfit-tags">
                {linkedOutfits.map((outfit) => (
                  <Link key={outfit.outfit_id} to="/app/outfits" className="detail-outfit-pill">
                    <Boxes size={13} /> {outfit.name}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="table-row-subtitle">
                This piece isn't part of any saved outfit yet.{' '}
                <Link to="/app/outfits" className="text-link">Create or update an outfit</Link>.
              </p>
            )}
          </div>
        </section>
      </div>

      {editing && (
        <Modal title="Edit clothing" detail="Update all clothing, season, and care details." onClose={() => setEditing(false)}>
          <ClothingForm initial={item.data} categories={categories.data ?? []} busy={busy} onCancel={() => setEditing(false)} onSubmit={save} />
        </Modal>
      )}

      <ConfirmModal
        isOpen={confirmDelete}
        title={`Delete “${item.data.name}”?`}
        message="This piece will be permanently removed from your wardrobe and any linked outfits."
        confirmText="Delete piece"
        busy={busy}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => void executeRemove()}
      />
    </>
  )
}

export function CategoriesPage() {
  const { user } = useAuth()
  const canManageCategories = user?.role === 'admin'
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(currentPage) && currentPage > 0 ? currentPage : 1
  const categories = useResource(['categories', 'page', page], () => categoriesApi.page(page))
  const usage = useResource(['category-usage'], categoriesApi.usage)
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const toast = useToast()
  const navigate = useNavigate()
  const categoryItems = categories.data?.items ?? []

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
  }

  async function save(name: string) {
    setBusy(true)
    try {
      if (editing && editing !== 'new') await categoriesApi.update(editing.category_id, name)
      else await categoriesApi.create(name)
      const msg = editing === 'new' ? 'Category created.' : 'Category updated.'
      setEditing(null)
      setFeedback({ message: msg })
      toast.success(msg)
      categories.retry()
      usage.retry()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not save category.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function executeRemoveCategory() {
    if (!deleteCategory) return
    setBusy(true)
    try {
      await categoriesApi.remove(deleteCategory.category_id)
      const msg = `Category “${deleteCategory.name}” deleted.`
      setFeedback({ message: msg })
      toast.success(msg)
      categories.retry()
      usage.retry()
      setDeleteCategory(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not delete category. It may still be assigned to clothing.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Organise"
        title="Categories"
        description={canManageCategories ? 'Manage the shared catalog and filter your pieces by category.' : 'Browse the shared catalog and filter your pieces by category.'}
        action={canManageCategories ? <button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add category</button> : undefined}
      />
      <Feedback value={feedback} />
      {categories.loading || usage.loading ? <LoadingState label="Loading categories" /> : categories.error || usage.error ? <ErrorState message={(categories.error || usage.error)?.message ?? 'Could not load categories.'} onRetry={() => { categories.retry(); usage.retry() }} /> : categoryItems.length ? (
        <div className="category-list">
          {categoryItems.map((category) => {
            const count = usage.data?.find((entry) => entry.category_id === category.category_id)?.count ?? 0
            return (
              <article className="category-card" key={category.category_id}>
                <button className="category-card-main" type="button" onClick={() => navigate(`/app/wardrobe?category=${category.category_id}`)}>
                  <span className="category-count">{String(count).padStart(2, '0')} pieces</span>
                  <h3>{category.name}</h3>
                  <p>Category #{category.category_id}</p>
                </button>
                {canManageCategories && (
                  <div className="category-actions">
                    <button className="icon-button" type="button" title="Edit category" aria-label={`Edit ${category.name}`} onClick={() => setEditing(category)}>
                      <Pencil size={15} />
                    </button>
                    <button className="icon-button" type="button" title="Delete category" aria-label={`Delete ${category.name}`} onClick={() => setDeleteCategory(category)}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No categories yet."
          detail={canManageCategories ? 'Create a category before adding clothing.' : 'An administrator must add categories before clothing can be added.'}
          action={canManageCategories ? <button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add category</button> : undefined}
        />
      )}

      {categories.data && categories.data.total_pages > 1 && (
        <nav className="pagination-controls" aria-label="Category pages">
          <button className="button-secondary button-small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
          <span>Page {categories.data.page} of {categories.data.total_pages}</span>
          <button className="button-secondary button-small" type="button" disabled={page >= categories.data.total_pages} onClick={() => changePage(page + 1)}>Next</button>
        </nav>
      )}

      {canManageCategories && editing && (
        <Modal title={editing === 'new' ? 'Add a category' : 'Edit category'} detail="Shared categories organize clothing across all collections." onClose={() => setEditing(null)}>
          <CategoryForm initial={editing === 'new' ? null : editing} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} />
        </Modal>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteCategory)}
        title={`Delete category “${deleteCategory?.name}”?`}
        message="This category will be permanently removed. Items in this category must be reassigned first."
        confirmText="Delete category"
        busy={busy}
        onClose={() => setDeleteCategory(null)}
        onConfirm={() => void executeRemoveCategory()}
      />
    </>
  )
}

function OutfitCard({
  outfit,
  links,
  clothing,
  onEdit,
  onDelete,
  onAdd,
  onRemove,
}: {
  outfit: Outfit
  links: OutfitItem[]
  clothing: Clothing[]
  onEdit: () => void
  onDelete: () => void
  onAdd: (clothingId: number) => Promise<void>
  onRemove: (item: OutfitItem) => void
}) {
  const [selected, setSelected] = useState('')
  const linkedIds = new Set(links.map((link) => link.clothing_id))
  async function addItem() {
    if (!selected) return
    await onAdd(Number(selected))
    setSelected('')
  }

  return (
    <article className="outfit-card">
      <div className="outfit-card-header">
        <div>
          <span className="eyebrow"><Sparkles size={11} /> Saved outfit</span>
          <h3>{outfit.name}</h3>
        </div>
        <div className="card-actions">
          <button className="icon-button" type="button" title="Edit outfit" aria-label={`Edit ${outfit.name}`} onClick={onEdit}>
            <Pencil size={15} />
          </button>
          <button className="icon-button" type="button" title="Delete outfit" aria-label={`Delete ${outfit.name}`} onClick={onDelete}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <p className="outfit-card-description">{outfit.description || 'No description added.'}</p>
      <div className="outfit-items">
        {links.length ? (
          links.map((link) => {
            const item = clothing.find((entry) => entry.clothing_id === link.clothing_id)
            return (
              <div className="outfit-item-row" key={link.outfit_item_id}>
                <span>
                  <span className="outfit-item-thumb">
                    <ClothingImage src={item?.image_url} alt={item?.name ?? ''} size={16} />
                  </span>
                  {item ? (
                    <Link to={`/app/wardrobe/${item.clothing_id}`} className="outfit-item-link">
                      {item.name}
                    </Link>
                  ) : (
                    `Clothing item #${link.clothing_id}`
                  )}
                </span>
                <button className="icon-button" type="button" aria-label={`Remove ${item?.name ?? 'item'} from outfit`} title="Remove item" onClick={() => onRemove(link)}>
                  <X size={15} />
                </button>
              </div>
            )
          })
        ) : (
          <p className="table-row-subtitle">No clothing items linked yet.</p>
        )}
      </div>
      <div className="add-outfit-item">
        <label htmlFor={`piece-${outfit.outfit_id}`}>Add a piece</label>
        <select id={`piece-${outfit.outfit_id}`} value={selected} onChange={(event) => setSelected(event.target.value)}>
          <option value="">Choose clothing piece</option>
          {clothing.filter((item) => !linkedIds.has(item.clothing_id)).map((item) => (
            <option value={item.clothing_id} key={item.clothing_id}>{item.name}</option>
          ))}
        </select>
        <button className="button-secondary button-small" type="button" disabled={!selected} onClick={() => void addItem()}>
          <Plus size={14} /> Add
        </button>
      </div>
    </article>
  )
}

export function OutfitsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = Number(searchParams.get('page') ?? 1)
  const page = Number.isSafeInteger(currentPage) && currentPage > 0 ? currentPage : 1
  const outfits = useResource(['outfits', 'page', page], () => outfitsApi.page(page))
  const outfitItems = useResource(['outfit-items'], outfitItemsApi.list)
  const clothing = useResource(['clothing', 'outfits'], () => listAllClothing())
  const [editing, setEditing] = useState<Outfit | 'new' | null>(null)
  const [deleteOutfit, setDeleteOutfit] = useState<Outfit | null>(null)
  const [removePiece, setRemovePiece] = useState<OutfitItem | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const toast = useToast()

  const sources = [outfits, outfitItems, clothing]
  const loading = sources.some((source) => source.loading)
  const error = sources.find((source) => source.error)?.error
  const retryAll = () => sources.forEach((source) => source.retry())

  function changePage(nextPage: number) {
    const params = new URLSearchParams(searchParams)
    if (nextPage === 1) params.delete('page')
    else params.set('page', String(nextPage))
    setSearchParams(params)
  }

  async function save(data: OutfitInput) {
    setBusy(true)
    try {
      if (editing && editing !== 'new') await outfitsApi.update(editing.outfit_id, data)
      else await outfitsApi.create(data)
      const msg = editing === 'new' ? 'Outfit created.' : 'Outfit updated.'
      setEditing(null)
      setFeedback({ message: msg })
      toast.success(msg)
      outfits.retry()
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Could not save outfit.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function executeRemoveOutfit() {
    if (!deleteOutfit) return
    setBusy(true)
    try {
      await outfitsApi.remove(deleteOutfit.outfit_id)
      const msg = `Outfit “${deleteOutfit.name}” deleted.`
      setFeedback({ message: msg })
      toast.success(msg)
      outfits.retry()
      outfitItems.retry()
      setDeleteOutfit(null)
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Could not delete outfit.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  async function addItem(outfitId: number, clothingId: number) {
    try {
      await outfitItemsApi.create(outfitId, clothingId)
      toast.success('Piece added to outfit.')
      outfitItems.retry()
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Could not add this piece.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    }
  }

  async function executeRemovePiece() {
    if (!removePiece) return
    setBusy(true)
    try {
      await outfitItemsApi.remove(removePiece.outfit_item_id)
      toast.success('Piece removed from outfit.')
      outfitItems.retry()
      setRemovePiece(null)
    } catch (reason) {
      const msg = reason instanceof Error ? reason.message : 'Could not remove this piece.'
      setFeedback({ message: msg, error: true })
      toast.error(msg)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="Combinations"
        title="Outfit planner"
        description="Outfits and their linked clothing pieces from your account."
        action={<button className="button-primary button-small" type="button" disabled={loading} onClick={() => setEditing('new')}><Plus size={15} /> Create outfit</button>}
      />
      <Feedback value={feedback} />
      {loading ? <LoadingState label="Loading outfits and linked pieces" /> : error ? <ErrorState message={error.message} onRetry={retryAll} /> : outfits.data?.items.length ? (
        <div className="outfit-grid">
          {outfits.data.items.map((outfit) => (
            <OutfitCard
              key={outfit.outfit_id}
              outfit={outfit}
              links={(outfitItems.data ?? []).filter((item) => item.outfit_id === outfit.outfit_id)}
              clothing={clothing.data ?? []}
              onEdit={() => setEditing(outfit)}
              onDelete={() => setDeleteOutfit(outfit)}
              onAdd={(clothingId) => addItem(outfit.outfit_id, clothingId)}
              onRemove={(item) => setRemovePiece(item)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved outfits yet."
          detail="Create an outfit, then add pieces from your wardrobe."
          action={<button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Create outfit</button>}
        />
      )}

      {outfits.data && outfits.data.total_pages > 1 && (
        <nav className="pagination-controls" aria-label="Outfit pages">
          <button className="button-secondary button-small" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
          <span>Page {outfits.data.page} of {outfits.data.total_pages}</span>
          <button className="button-secondary button-small" type="button" disabled={page >= outfits.data.total_pages} onClick={() => changePage(page + 1)}>Next</button>
        </nav>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Create an outfit' : 'Edit outfit'} detail="Organize complementary pieces into a named style." onClose={() => setEditing(null)}>
          <OutfitForm initial={editing === 'new' ? null : editing} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} />
        </Modal>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteOutfit)}
        title={`Delete “${deleteOutfit?.name}”?`}
        message="This outfit and its item linkages will be permanently deleted. Your clothing pieces will remain safe."
        confirmText="Delete outfit"
        busy={busy}
        onClose={() => setDeleteOutfit(null)}
        onConfirm={() => void executeRemoveOutfit()}
      />

      <ConfirmModal
        isOpen={Boolean(removePiece)}
        title="Remove piece from outfit?"
        message="This will unlink the piece from this outfit. The piece will stay in your wardrobe."
        confirmText="Remove piece"
        busy={busy}
        onClose={() => setRemovePiece(null)}
        onConfirm={() => void executeRemovePiece()}
      />
    </>
  )
}