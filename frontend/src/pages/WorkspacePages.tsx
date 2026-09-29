import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeft, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import ClothingImage from '../components/ClothingImage'
import { EmptyState, ErrorState, LoadingState, PageHeading } from '../components/States'
import { useResource } from '../hooks/useResource'
import { categoriesApi, clothingApi, deleteClothingWithOutfitItems, deleteOutfitWithItems, outfitItemsApi, outfitsApi, usersApi } from '../services/wardrobe'
import type { Category, Clothing, ClothingInput, Outfit, OutfitInput, OutfitItem, User } from '../services/types'

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

function EmptyUsers() {
  return <p className="form-error">The API has no users to associate with this record. Add a user through the existing backend before creating it.</p>
}

function ClothingForm({
  initial,
  categories,
  users,
  busy,
  onCancel,
  onSubmit,
}: {
  initial: Clothing | null
  categories: Category[]
  users: User[]
  busy: boolean
  onCancel: () => void
  onSubmit: (data: ClothingInput) => Promise<void>
}) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const user_id = Number(form.get('user_id'))
    const category_id = Number(form.get('category_id'))
    if (!name || !user_id || !category_id) {
      setMessage('Choose a name, user and category to continue.')
      return
    }
    await onSubmit({
      user_id,
      category_id,
      name,
      color: String(form.get('color') ?? '').trim() || null,
      size: String(form.get('size') ?? '').trim() || null,
      image_url: String(form.get('image_url') ?? '').trim() || null,
    })
  }

  return <form onSubmit={submit}><div className="form-grid"><Field label="Item name"><input name="name" required maxLength={100} defaultValue={initial?.name ?? ''} autoFocus /></Field><Field label="Category"><select name="category_id" required defaultValue={initial?.category_id ?? ''}><option value="" disabled>Select category</option>{categories.map((category) => <option value={category.category_id} key={category.category_id}>{category.name}</option>)}</select></Field><Field label="Owner"><select name="user_id" required defaultValue={initial?.user_id ?? ''}><option value="" disabled>Select user</option>{users.map((user) => <option value={user.user_id} key={user.user_id}>{user.name}</option>)}</select></Field><Field label="Color"><input name="color" maxLength={50} defaultValue={initial?.color ?? ''} placeholder="e.g. Charcoal" /></Field><Field label="Size"><input name="size" maxLength={20} defaultValue={initial?.size ?? ''} placeholder="e.g. M" /></Field><Field label="Image URL" full><input name="image_url" type="url" maxLength={500} defaultValue={initial?.image_url ?? ''} placeholder="https://..." /></Field></div>{message && <p className="form-error">{message}</p>}{categories.length === 0 && <p className="form-error">Create a category before adding clothing.</p>}{users.length === 0 && <EmptyUsers />}<div className="modal-actions"><button className="button-secondary button-small" type="button" onClick={onCancel}>Cancel</button><button className="button-primary button-small" type="submit" disabled={busy || categories.length === 0 || users.length === 0}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add to wardrobe'}</button></div></form>
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

function OutfitForm({ initial, users, busy, onCancel, onSubmit }: { initial: Outfit | null; users: User[]; busy: boolean; onCancel: () => void; onSubmit: (data: OutfitInput) => Promise<void> }) {
  const [message, setMessage] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const user_id = Number(form.get('user_id'))
    if (!name || !user_id) { setMessage('Enter a name and choose a user.'); return }
    await onSubmit({ user_id, name, description: String(form.get('description') ?? '').trim() || null })
  }
  return <form onSubmit={submit}><div className="form-grid"><Field label="Outfit name" full><input name="name" required maxLength={100} defaultValue={initial?.name ?? ''} autoFocus /></Field><Field label="Owner" full><select name="user_id" required defaultValue={initial?.user_id ?? ''}><option value="" disabled>Select user</option>{users.map((user) => <option value={user.user_id} key={user.user_id}>{user.name}</option>)}</select></Field><Field label="Description" full><textarea name="description" defaultValue={initial?.description ?? ''} /></Field></div>{message && <p className="form-error">{message}</p>}{users.length === 0 && <EmptyUsers />}<div className="modal-actions"><button className="button-secondary button-small" type="button" onClick={onCancel}>Cancel</button><button className="button-primary button-small" type="submit" disabled={busy || users.length === 0}>{busy ? 'Saving…' : initial ? 'Save outfit' : 'Create outfit'}</button></div></form>
}

function ClothingCard({ item, category, onEdit, onDelete }: { item: Clothing; category?: string; onEdit: () => void; onDelete: () => void }) {
  return <article className="clothing-card"><div className="clothing-card-image"><ClothingImage src={item.image_url} alt={item.name} /><div className="clothing-card-actions"><Link className="icon-button" to={`/app/wardrobe/${item.clothing_id}`} aria-label={`View ${item.name}`} title="View details"><Eye size={16} /></Link><button className="icon-button" type="button" aria-label={`Edit ${item.name}`} title="Edit clothing" onClick={onEdit}><Pencil size={15} /></button><button className="icon-button" type="button" aria-label={`Delete ${item.name}`} title="Delete clothing" onClick={onDelete}><Trash2 size={15} /></button></div></div><div className="clothing-card-copy"><h3>{item.name}</h3><p><span>{category ?? 'Uncategorised'}</span>{item.color && <><span className="color-swatch" style={{ backgroundColor: item.color }} aria-label={`Color ${item.color}`} /><span>{item.color}</span></>}{item.size && <span>· {item.size}</span>}</p></div></article>
}

export function WardrobePage() {
  const clothing = useResource(clothingApi.list)
  const categories = useResource(categoriesApi.list)
  const users = useResource(usersApi.list)
  const outfitItems = useResource(outfitItemsApi.list)
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('name')
  const [editing, setEditing] = useState<Clothing | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const selectedCategory = searchParams.get('category') ?? ''
  const categoryName = (id: number) => categories.data?.find((category) => category.category_id === id)?.name
  const filtered = (clothing.data ?? []).filter((item) => {
    const matchText = `${item.name} ${item.color ?? ''} ${item.size ?? ''} ${categoryName(item.category_id) ?? ''}`.toLowerCase().includes(query.toLowerCase())
    return matchText && (!selectedCategory || item.category_id === Number(selectedCategory))
  }).sort((a, b) => sort === 'color' ? (a.color ?? '').localeCompare(b.color ?? '') : a.name.localeCompare(b.name))

  async function save(data: ClothingInput) {
    setBusy(true)
    try {
      if (editing && editing !== 'new') await clothingApi.update(editing.clothing_id, data)
      else await clothingApi.create(data)
      setEditing(null)
      setFeedback({ message: editing === 'new' ? 'Piece added to your wardrobe.' : 'Clothing details updated.' })
      clothing.retry()
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not save this clothing item.', error: true })
    } finally { setBusy(false) }
  }

  async function remove(item: Clothing) {
    const linkedItems = (outfitItems.data ?? []).filter((link) => link.clothing_id === item.clothing_id)
    const detail = linkedItems.length ? ` It is linked to ${linkedItems.length} outfit item(s), which will also be removed.` : ''
    if (!window.confirm(`Delete “${item.name}” from your wardrobe?${detail}`)) return
    try {
      await deleteClothingWithOutfitItems(item.clothing_id, linkedItems)
      setFeedback({ message: 'Clothing item deleted.' })
      clothing.retry()
      outfitItems.retry()
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not delete this item.', error: true })
      clothing.retry()
      outfitItems.retry()
    }
  }

  const isLoading = clothing.loading || categories.loading || users.loading || outfitItems.loading
  const resourceError = clothing.error || categories.error || users.error || outfitItems.error
  const retryAll = () => { clothing.retry(); categories.retry(); users.retry(); outfitItems.retry() }
  return <><PageHeading eyebrow="The collection" title="My wardrobe" description={`${clothing.data?.length ?? 0} pieces currently returned by your wardrobe API.`} action={<button className="button-primary button-small" type="button" disabled={isLoading} onClick={() => setEditing('new')}><Plus size={15} /> Add clothing</button>} /><Feedback value={feedback} />{isLoading ? <LoadingState label="Loading your clothing" /> : resourceError ? <ErrorState message={resourceError.message} onRetry={retryAll} /> : <><div className="page-toolbar"><label className="search-control"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your collection" aria-label="Search clothing" /></label><label className="filter-control"><span className="sr-only">Filter by category</span><select value={selectedCategory} onChange={(event) => { const value = event.target.value; setSearchParams(value ? { category: value } : {}) }}><option value="">All categories</option>{categories.data?.map((category) => <option value={category.category_id} key={category.category_id}>{category.name}</option>)}</select></label><label className="filter-control"><span className="sr-only">Sort clothing</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name A–Z</option><option value="color">Color</option></select></label></div>{filtered.length ? <div className="clothing-grid">{filtered.map((item) => <ClothingCard key={item.clothing_id} item={item} category={categoryName(item.category_id)} onEdit={() => setEditing(item)} onDelete={() => void remove(item)} />)}</div> : <EmptyState title={query || selectedCategory ? 'No pieces match this view.' : 'No clothing items yet.'} detail={query || selectedCategory ? 'Try changing the search or category filter.' : 'Add a piece from your real wardrobe to get started.'} action={!query && !selectedCategory ? <button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add clothing</button> : undefined} />}</>}{editing && <Modal title={editing === 'new' ? 'Add a clothing piece' : 'Edit clothing'} detail="Details match fields supported by the current database." onClose={() => setEditing(null)}><ClothingForm initial={editing === 'new' ? null : editing} categories={categories.data ?? []} users={users.data ?? []} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} /></Modal>}</>
}

export function ClothingDetailPage() {
  const { id } = useParams()
  const loadItem = useCallback(() => clothingApi.get(Number(id)), [id])
  const item = useResource(loadItem)
  const categories = useResource(categoriesApi.list)
  const users = useResource(usersApi.list)
  const outfitItems = useResource(outfitItemsApi.list)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const navigate = useNavigate()

  async function save(data: ClothingInput) {
    if (!item.data) return
    setBusy(true)
    try { await clothingApi.update(item.data.clothing_id, data); setEditing(false); setFeedback({ message: 'Clothing details updated.' }); item.retry() }
    catch (error) { setFeedback({ message: error instanceof Error ? error.message : 'Could not save changes.', error: true }) }
    finally { setBusy(false) }
  }

  async function remove() {
    if (!item.data) return
    const linkedItems = (outfitItems.data ?? []).filter((link) => link.clothing_id === item.data?.clothing_id)
    const detail = linkedItems.length ? ` It is linked to ${linkedItems.length} outfit item(s), which will also be removed.` : ''
    if (!window.confirm(`Delete “${item.data.name}” from your wardrobe?${detail}`)) return
    try {
      await deleteClothingWithOutfitItems(item.data.clothing_id, linkedItems)
      navigate('/app/wardrobe', { replace: true })
    } catch (error) {
      setFeedback({ message: error instanceof Error ? error.message : 'Could not delete this item.', error: true })
      item.retry()
      outfitItems.retry()
    }
  }

  if (item.loading || categories.loading || users.loading || outfitItems.loading) return <LoadingState label="Loading clothing details" />
  const resourceError = item.error || categories.error || users.error || outfitItems.error
  if (resourceError) return <ErrorState message={resourceError.message} onRetry={() => { item.retry(); categories.retry(); users.retry(); outfitItems.retry() }} />
  if (!item.data) return <EmptyState title="Clothing item not found." detail="This item may have been removed from the collection." action={<Link className="button-secondary button-small" to="/app/wardrobe">Return to wardrobe</Link>} />
  const category = categories.data?.find((entry) => entry.category_id === item.data?.category_id)?.name ?? 'Uncategorised'
  return <><Link className="text-link back-link" to="/app/wardrobe"><ArrowLeft size={14} /> Back to wardrobe</Link><Feedback value={feedback} /><div className="detail-layout"><div className="detail-image"><ClothingImage src={item.data.image_url} alt={item.data.name} size={50} /></div><section className="detail-copy"><span className="eyebrow">{category}</span><h2>{item.data.name}</h2><dl className="detail-list"><div><dt>Color</dt><dd>{item.data.color || 'Not specified'}</dd></div><div><dt>Size</dt><dd>{item.data.size || 'Not specified'}</dd></div><div><dt>Owner ID</dt><dd>{item.data.user_id}</dd></div><div><dt>Clothing ID</dt><dd>{item.data.clothing_id}</dd></div></dl><div className="detail-actions"><button className="button-primary button-small" type="button" onClick={() => setEditing(true)}><Pencil size={15} /> Edit details</button><button className="button-secondary button-small button-danger" type="button" onClick={() => void remove()}><Trash2 size={15} /> Delete</button></div></section></div>{editing && <Modal title="Edit clothing" detail="Update fields supported by the current database." onClose={() => setEditing(false)}><ClothingForm initial={item.data} categories={categories.data ?? []} users={users.data ?? []} busy={busy} onCancel={() => setEditing(false)} onSubmit={save} /></Modal>}</>
}

export function CategoriesPage() {
  const categories = useResource(categoriesApi.list)
  const clothing = useResource(clothingApi.list)
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const navigate = useNavigate()

  async function save(name: string) {
    setBusy(true)
    try { if (editing && editing !== 'new') await categoriesApi.update(editing.category_id, name); else await categoriesApi.create(name); setEditing(null); setFeedback({ message: editing === 'new' ? 'Category created.' : 'Category updated.' }); categories.retry() }
    catch (error) { setFeedback({ message: error instanceof Error ? error.message : 'Could not save category.', error: true }) }
    finally { setBusy(false) }
  }
  async function remove(category: Category) {
    const assignedClothing = clothing.data?.filter((item) => item.category_id === category.category_id).length ?? 0
    if (assignedClothing > 0) {
      setFeedback({ message: `Cannot delete “${category.name}” while ${assignedClothing} clothing item(s) still use it. Reassign or remove those items first.`, error: true })
      return
    }
    if (!window.confirm(`Delete category “${category.name}”?`)) return
    try { await categoriesApi.remove(category.category_id); setFeedback({ message: 'Category deleted.' }); categories.retry(); clothing.retry() }
    catch (error) { setFeedback({ message: error instanceof Error ? error.message : 'Could not delete category. It may still be assigned to clothing.', error: true }) }
  }

  return <><PageHeading eyebrow="Organise" title="Categories" description="Browse the categories returned by the wardrobe API and filter their pieces." action={<button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add category</button>} /><Feedback value={feedback} />{categories.loading || clothing.loading ? <LoadingState label="Loading categories" /> : categories.error || clothing.error ? <ErrorState message={(categories.error || clothing.error)?.message ?? 'Could not load categories.'} onRetry={() => { categories.retry(); clothing.retry() }} /> : categories.data?.length ? <div className="category-list">{categories.data.map((category) => { const count = clothing.data?.filter((item) => item.category_id === category.category_id).length ?? 0; return <article className="category-card" key={category.category_id}><button className="category-card-main" type="button" onClick={() => navigate(`/app/wardrobe?category=${category.category_id}`)}><span className="category-count">{String(count).padStart(2, '0')} pieces</span><h3>{category.name}</h3><p>Category {category.category_id}</p></button><div className="category-actions"><button className="icon-button" type="button" title="Edit category" aria-label={`Edit ${category.name}`} onClick={() => setEditing(category)}><Pencil size={15} /></button><button className="icon-button" type="button" title="Delete category" aria-label={`Delete ${category.name}`} onClick={() => void remove(category)}><Trash2 size={15} /></button></div></article>})}</div> : <EmptyState title="No categories yet." detail="Create a category before adding clothing." action={<button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Add category</button>} />}{editing && <Modal title={editing === 'new' ? 'Add a category' : 'Edit category'} detail="Category names are stored by the existing categories API." onClose={() => setEditing(null)}><CategoryForm initial={editing === 'new' ? null : editing} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} /></Modal>}</>
}

function OutfitCard({ outfit, links, clothing, onEdit, onDelete, onAdd, onRemove }: { outfit: Outfit; links: OutfitItem[]; clothing: Clothing[]; onEdit: () => void; onDelete: () => void; onAdd: (clothingId: number) => Promise<void>; onRemove: (item: OutfitItem) => void }) {
  const [selected, setSelected] = useState('')
  const linkedIds = new Set(links.map((link) => link.clothing_id))
  async function addItem() { if (!selected) return; await onAdd(Number(selected)); setSelected('') }
  return <article className="outfit-card"><div className="outfit-card-header"><div><span className="eyebrow">Saved outfit</span><h3>{outfit.name}</h3></div><div className="card-actions"><button className="icon-button" type="button" title="Edit outfit" aria-label={`Edit ${outfit.name}`} onClick={onEdit}><Pencil size={15} /></button><button className="icon-button" type="button" title="Delete outfit" aria-label={`Delete ${outfit.name}`} onClick={onDelete}><Trash2 size={15} /></button></div></div><p className="outfit-card-description">{outfit.description || 'No description added.'}</p><div className="outfit-items">{links.length ? links.map((link) => { const item = clothing.find((entry) => entry.clothing_id === link.clothing_id); return <div className="outfit-item-row" key={link.outfit_item_id}><span><span className="outfit-item-thumb"><ClothingImage src={item?.image_url} alt={item?.name ?? ''} size={16} /></span>{item?.name ?? `Clothing item ${link.clothing_id}`}</span><button className="icon-button" type="button" aria-label={`Remove ${item?.name ?? 'item'} from outfit`} title="Remove item" onClick={() => onRemove(link)}><X size={15} /></button></div>}) : <p className="table-row-subtitle">No clothing items linked yet.</p>}</div><div className="add-outfit-item"><label htmlFor={`piece-${outfit.outfit_id}`}>Add a piece</label><select id={`piece-${outfit.outfit_id}`} value={selected} onChange={(event) => setSelected(event.target.value)}><option value="">Choose clothing</option>{clothing.filter((item) => !linkedIds.has(item.clothing_id)).map((item) => <option value={item.clothing_id} key={item.clothing_id}>{item.name}</option>)}</select><button className="button-secondary button-small" type="button" disabled={!selected} onClick={() => void addItem()}><Plus size={14} /> Add</button></div></article>
}

export function OutfitsPage() {
  const outfits = useResource(outfitsApi.list)
  const outfitItems = useResource(outfitItemsApi.list)
  const clothing = useResource(clothingApi.list)
  const users = useResource(usersApi.list)
  const [editing, setEditing] = useState<Outfit | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackValue>(null)
  const sources = [outfits, outfitItems, clothing, users]
  const loading = sources.some((source) => source.loading)
  const error = sources.find((source) => source.error)?.error
  const retryAll = () => sources.forEach((source) => source.retry())

  async function save(data: OutfitInput) {
    setBusy(true)
    try { if (editing && editing !== 'new') await outfitsApi.update(editing.outfit_id, data); else await outfitsApi.create(data); setEditing(null); setFeedback({ message: editing === 'new' ? 'Outfit created.' : 'Outfit updated.' }); outfits.retry() }
    catch (reason) { setFeedback({ message: reason instanceof Error ? reason.message : 'Could not save outfit.', error: true }) }
    finally { setBusy(false) }
  }
  async function remove(outfit: Outfit) {
    const linkedItems = (outfitItems.data ?? []).filter((item) => item.outfit_id === outfit.outfit_id)
    const detail = linkedItems.length ? ` Its ${linkedItems.length} outfit item link(s) will also be removed.` : ''
    if (!window.confirm(`Delete outfit “${outfit.name}”?${detail}`)) return
    try {
      await deleteOutfitWithItems(outfit.outfit_id, linkedItems)
      setFeedback({ message: 'Outfit deleted.' })
      outfits.retry()
      outfitItems.retry()
    } catch (reason) {
      setFeedback({ message: reason instanceof Error ? reason.message : 'Could not delete outfit.', error: true })
      outfits.retry()
      outfitItems.retry()
    }
  }
  async function addItem(outfitId: number, clothingId: number) {
    try { await outfitItemsApi.create(outfitId, clothingId); setFeedback({ message: 'Piece added to outfit.' }); outfitItems.retry() }
    catch (reason) { setFeedback({ message: reason instanceof Error ? reason.message : 'Could not add this piece.', error: true }) }
  }
  async function removeItem(item: OutfitItem) {
    if (!window.confirm('Remove this piece from the outfit?')) return
    try { await outfitItemsApi.remove(item.outfit_item_id); setFeedback({ message: 'Piece removed from outfit.' }); outfitItems.retry() }
    catch (reason) { setFeedback({ message: reason instanceof Error ? reason.message : 'Could not remove this piece.', error: true }) }
  }

  return <><PageHeading eyebrow="Combinations" title="Outfit planner" description="Outfits and their linked clothing pieces, joined from the existing API." action={<button className="button-primary button-small" type="button" disabled={loading} onClick={() => setEditing('new')}><Plus size={15} /> Create outfit</button>} /><Feedback value={feedback} />{loading ? <LoadingState label="Loading outfits and linked pieces" /> : error ? <ErrorState message={error.message} onRetry={retryAll} /> : outfits.data?.length ? <div className="outfit-grid">{outfits.data.map((outfit) => <OutfitCard key={outfit.outfit_id} outfit={outfit} links={(outfitItems.data ?? []).filter((item) => item.outfit_id === outfit.outfit_id)} clothing={clothing.data ?? []} onEdit={() => setEditing(outfit)} onDelete={() => void remove(outfit)} onAdd={(clothingId) => addItem(outfit.outfit_id, clothingId)} onRemove={(item) => void removeItem(item)} />)}</div> : <EmptyState title="No saved outfits yet." detail="Create an outfit, then add pieces from your wardrobe." action={<button className="button-primary button-small" type="button" onClick={() => setEditing('new')}><Plus size={15} /> Create outfit</button>} />}{editing && <Modal title={editing === 'new' ? 'Create an outfit' : 'Edit outfit'} detail="Outfits support a name, description and existing user association." onClose={() => setEditing(null)}><OutfitForm initial={editing === 'new' ? null : editing} users={users.data ?? []} busy={busy} onCancel={() => setEditing(null)} onSubmit={save} /></Modal>}</>
}