'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import {
  Check,
  HandHeart,
  PackageOpen,
  Plus,
  Search,
  Send,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react'
const kindLabel: Record<string, string> = {
  product: 'Producto',
  service: 'Servicio',
  skill: 'Habilidad',
  barter: 'Trueque',
  gift: 'Regalo',
  loan: 'Préstamo',
  need: 'Necesidad',
  help: 'Ayuda',
}
const kindIcon: Record<string, typeof Wrench> = {
  service: Wrench,
  product: PackageOpen,
  barter: Sparkles,
  loan: PackageOpen,
  gift: HandHeart,
  help: HandHeart,
  need: Search,
  skill: Users,
}
const publishKinds = ['product', 'service', 'skill', 'barter', 'gift', 'loan', 'need', 'help']
type Props = {
  publishKind: string
  setPublishKind: (value: string) => void
  draft: Record<string, string> | null
  published: boolean
  setPublished: (value: boolean) => void
  publishMessage: string
  publishing: boolean
  photoName: string
  setPhotoName: (value: string) => void
  signedIn: boolean
  submitListing: (event: FormEvent<HTMLFormElement>) => void
  saveDraft: (form: HTMLFormElement, announce?: boolean) => void
}
export function PublishTab({
  publishKind,
  setPublishKind,
  draft,
  published,
  setPublished,
  publishMessage,
  publishing,
  photoName,
  setPhotoName,
  signedIn,
  submitListing,
  saveDraft,
}: Props) {
  const [preview, setPreview] = useState<{ title: string; description: string } | null>(null)
  return (
    <section className="publish-page">
      <div className="publish-intro">
        <span className="eyebrow">Publicación rápida · 2 de 3 acciones</span>
        <h1>¿Qué quieres mover en tu barrio?</h1>
        <p>Elige modalidad, completa aquí y publica. La vista previa es opcional.</p>
      </div>
      <div className="publish-layout">
        <div className="publish-kinds" aria-label="Modalidad">
          {publishKinds.map((kind) => {
            const Icon = kindIcon[kind] ?? Plus
            return (
              <button
                key={kind}
                type="button"
                data-kind={kind}
                className={`publish-kind-btn publish-kind-btn--${kind} ${publishKind === kind ? 'is-active' : ''}`}
                onClick={() => {
                  setPublishKind(kind)
                  const savedDraft = JSON.parse(localStorage.getItem('nexobarrio-draft') || '{}')
                  localStorage.setItem('nexobarrio-draft', JSON.stringify({ ...savedDraft, kind }))
                }}
              >
                <i className={`kind-dot kind-dot--${kind}`} aria-hidden="true" />
                <Icon size={20} />
                <span>{kindLabel[kind]}</span>
                {publishKind === kind && <Check size={16} />}
              </button>
            )
          })}
        </div>
        {!publishKind ? (
          <div className="publish-form publish-choice">
            <h2>Elige una modalidad para continuar</h2>
            <p>
              Después completa el título y la descripción. La foto y la vista previa son opcionales.
            </p>
          </div>
        ) : (
          <form
            className="publish-form"
            onSubmit={submitListing}
            onInput={(event) => saveDraft(event.currentTarget, false)}
          >
            {published ? (
              <div className="success-state">
                <span>
                  <Check size={28} />
                </span>
                <h2>Publicación guardada</h2>
                <p>
                  {publishMessage || 'La publicación ya puede aparecer en el mapa y en la lista.'}
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPublished(false)}
                >
                  Crear otra
                </button>
              </div>
            ) : (
              <>
                <div className="form-section-heading">
                  <span>{kindLabel[publishKind]}</span>
                  <small>Campos esenciales</small>
                </div>
                <label>
                  Título
                  <input
                    name="title"
                    required
                    defaultValue={draft?.title || ''}
                    placeholder={
                      publishKind === 'service'
                        ? 'Ej. Reparación eléctrica a domicilio'
                        : 'Describe qué ofreces o necesitas'
                    }
                  />
                </label>
                <label>
                  Descripción
                  <textarea
                    name="description"
                    required
                    rows={4}
                    defaultValue={draft?.description || ''}
                    placeholder="Incluye condiciones, disponibilidad y detalles útiles."
                  />
                </label>
                <div className="form-row">
                  <label>
                    Categoría
                    <select name="category" defaultValue={draft?.category || 'Hogar'}>
                      <option>Hogar</option>
                      <option>Reparaciones</option>
                      <option>Tecnología</option>
                      <option>Transporte</option>
                      <option>Clases</option>
                    </select>
                  </label>
                  <label>
                    {publishKind === 'gift' || publishKind === 'help'
                      ? 'Costo'
                      : 'Costo orientativo'}
                    <input
                      name="priceLabel"
                      defaultValue={draft?.priceLabel || ''}
                      placeholder={
                        publishKind === 'gift' || publishKind === 'help'
                          ? 'Sin costo'
                          : 'Ej. S/ 45 por visita'
                      }
                    />
                  </label>
                </div>
                <label className="upload-zone">
                  <input
                    name="photo"
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(event) => setPhotoName(event.target.files?.[0]?.name || '')}
                  />
                  <Plus size={22} />
                  <span>
                    <strong>{photoName || 'Añadir una foto'}</strong>
                    <small>{photoName ? 'Toca para cambiarla' : 'JPG o PNG · máximo 5 MB'}</small>
                  </span>
                </label>
                <label className="checkbox-row">
                  <input name="acceptsBarter" type="checkbox" />
                  <span>También acepto trueque compatible</span>
                </label>
                {publishMessage && (
                  <p className="form-feedback" role="status">
                    {publishMessage}
                    {!signedIn && (
                      <>
                        {' '}
                        <Link href="/login">Ingresar o crear cuenta</Link>
                      </>
                    )}
                  </p>
                )}
                <div className="publish-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={(event) => {
                      const form = event.currentTarget.form
                      if (!form) return
                      const data = new FormData(form)
                      setPreview({
                        title: String(data.get('title') || 'Sin título'),
                        description: String(data.get('description') || 'Sin descripción'),
                      })
                    }}
                  >
                    Vista previa
                  </button>
                  <button
                    type="button"
                    className="text-button"
                    onClick={(event) => saveDraft(event.currentTarget.form!)}
                  >
                    Guardar borrador local
                  </button>
                  <button className="primary-button" disabled={publishing}>
                    {publishing ? 'Confirmando…' : 'Publicar ahora'} <Send size={17} />
                  </button>
                </div>
                {preview && (
                  <article className="publish-preview" aria-label="Vista previa de la publicación">
                    <small>{kindLabel[publishKind]}</small>
                    <h2>{preview.title}</h2>
                    <p>{preview.description}</p>
                    <button type="button" className="text-button" onClick={() => setPreview(null)}>
                      Cerrar vista previa
                    </button>
                  </article>
                )}
              </>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
