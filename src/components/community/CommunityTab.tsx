'use client'

import { useEffect, useState } from 'react'
import { HandHeart, MessageCircle, Plus, Wrench } from 'lucide-react'
import { api } from '@/lib/api-client'
import { currentUser } from '@/lib/local-store'

type Post = { id: string; authorName?: string; body: string; comments: string[] }
const storageKey = 'nexobarrio-community-v1'

export function CommunityTab({ onOpenListing }: { onOpenListing: () => void }) {
  const [section, setSection] = useState<'wall' | 'groups' | 'routes'>('wall')
  const [circles, setCircles] = useState([
    'Centro Cívico',
    'Herramientas compartidas',
    'Mascotas del barrio',
  ])
  const [posts, setPosts] = useState<Post[]>([])
  const [joined, setJoined] = useState<string[]>([])
  const [routes, setRoutes] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [comment, setComment] = useState<Record<string, string>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '{}')
      if (Array.isArray(stored.circles)) setCircles(stored.circles)
      if (Array.isArray(stored.posts)) setPosts(stored.posts)
      if (Array.isArray(stored.joined)) setJoined(stored.joined)
      if (Array.isArray(stored.routes)) setRoutes(stored.routes)
    } catch {
      /* Start with the built-in view if local data is damaged. */
    }
    setReady(true)
    void api.getCommunityPosts().then((remotePosts) => {
      if (remotePosts && remotePosts.length > 0) {
        setPosts((current) => {
          const existingIds = new Set(current.map((p) => p.id))
          const mapped: Post[] = remotePosts
            .filter((p) => !existingIds.has(p.id))
            .map((p) => ({
              id: p.id,
              authorName: p.authorName || 'Vecino de tu barrio',
              body: p.body,
              comments: Array.isArray(p.comments) ? p.comments : [],
            }))
          return [...mapped, ...current]
        })
      }
    })
  }, [])
  useEffect(() => {
    if (ready) localStorage.setItem(storageKey, JSON.stringify({ circles, posts, joined, routes }))
  }, [circles, posts, joined, routes, ready])

  const addCircle = () => {
    const name = window.prompt('Nombre del nuevo círculo')?.trim()
    if (name && !circles.includes(name)) setCircles([...circles, name.slice(0, 60)])
  }
  const addPost = async () => {
    const text = draft.trim()
    if (text.length < 5) return
    const user = currentUser()
    const authorName = user?.displayName || 'Vecino de tu barrio'
    const authorInitials = authorName.slice(0, 2).toUpperCase()
    setDraft('')

    const remote = await api.createCommunityPost({
      circleName: circles[0] || 'Centro Cívico',
      authorName,
      authorInitials,
      body: text,
      hasSharedListing: false,
    })

    setPosts((current) => [
      {
        id: remote?.id || crypto.randomUUID(),
        authorName,
        body: text,
        comments: [],
      },
      ...current,
    ])
  }
  const addComment = (id: string) => {
    const body = comment[id]?.trim()
    if (!body) return
    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, comments: [...post.comments, body] } : post,
      ),
    )
    setComment({ ...comment, [id]: '' })
  }
  const groups = ['Mantenimiento de intercomunicadores', 'Recarga de extintores']
  const routeOptions = ['Compras pesadas del mercado', 'Traslado de medicinas']

  return (
    <section className="content-page community-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Comunidad</span>
          <h1>Nos organizamos cerca</h1>
          <p>Comparte, coordina pedidos y acompaña a tus vecinos.</p>
        </div>
      </div>
      <div className="community-tabs" role="tablist" aria-label="Secciones de comunidad">
        <button
          className={section === 'wall' ? 'is-active' : ''}
          onClick={() => setSection('wall')}
        >
          Círculos y Muro Vecinal
        </button>
        <button
          className={section === 'groups' ? 'is-active' : ''}
          onClick={() => setSection('groups')}
        >
          Pedidos y Servicios en Grupo
        </button>
        <button
          className={section === 'routes' ? 'is-active' : ''}
          onClick={() => setSection('routes')}
        >
          Rutas Solidarias
        </button>
      </div>
      {section === 'wall' && (
        <div className="community-layout">
          <aside className="circle-list">
            <h2>Tus círculos</h2>
            {circles.map((name) => (
              <div className="community-circle" key={name}>
                <span>{name.slice(0, 2).toUpperCase()}</span>
                <strong>{name}</strong>
              </div>
            ))}
            <button className="secondary-button" onClick={addCircle}>
              <Plus size={17} /> Crear círculo
            </button>
          </aside>
          <div className="community-feed">
            <div className="composer">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Pregunta, recomienda o comparte algo…"
                aria-label="Nueva publicación"
                rows={3}
              />
              <button
                className="primary-button"
                onClick={addPost}
                disabled={draft.trim().length < 5}
              >
                Publicar en el muro
              </button>
            </div>
            {posts.map((post) => (
              <article className="feed-post" key={post.id}>
                <strong>{post.authorName || 'Vecino de tu barrio'}</strong>
                <p>{post.body}</p>
                {post.comments.map((body, index) => (
                  <p className="community-comment" key={`${post.id}-${index}`}>
                    {body}
                  </p>
                ))}
                <div className="community-comment-form">
                  <input
                    value={comment[post.id] || ''}
                    onChange={(event) => setComment({ ...comment, [post.id]: event.target.value })}
                    placeholder="Responder"
                    aria-label="Responder comentario"
                  />
                  <button onClick={() => addComment(post.id)}>
                    <MessageCircle size={17} /> Responder
                  </button>
                </div>
              </article>
            ))}
            <article className="feed-post">
              <strong>María P. · Centro Cívico</strong>
              <p>¿Alguien recomienda un electricista para revisar una instalación antigua?</p>
              <button className="shared-listing" onClick={onOpenListing}>
                <Wrench size={22} />
                <span>
                  <strong>Electricista domiciliario</strong>
                  <em>Ver ficha</em>
                </span>
              </button>
            </article>
          </div>
        </div>
      )}
      {section === 'groups' && (
        <div className="community-options">
          {groups.map((name) => (
            <article key={name}>
              <h2>{name}</h2>
              <p>Contratación colectiva entre vecinos de la cuadra.</p>
              <button
                className="secondary-button"
                onClick={() =>
                  setJoined(
                    joined.includes(name)
                      ? joined.filter((item) => item !== name)
                      : [...joined, name],
                  )
                }
              >
                {joined.includes(name) ? 'Salir del grupo' : 'Unirme (+1)'}
              </button>
              <small>
                {joined.includes(name) ? 'Te uniste a este pedido' : 'Puedes unirte sin costo'}
              </small>
            </article>
          ))}
        </div>
      )}
      {section === 'routes' && (
        <div className="community-options">
          {routeOptions.map((name) => (
            <article key={name}>
              <HandHeart size={25} />
              <h2>{name}</h2>
              <p>Solicita apoyo para coordinar un trayecto habitual.</p>
              <button
                className="secondary-button"
                onClick={() =>
                  setRoutes(
                    routes.includes(name)
                      ? routes.filter((item) => item !== name)
                      : [...routes, name],
                  )
                }
              >
                {routes.includes(name) ? 'Cancelar solicitud' : 'Solicitar apoyo'}
              </button>
              {routes.includes(name) && <small>Solicitud guardada en este dispositivo</small>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
