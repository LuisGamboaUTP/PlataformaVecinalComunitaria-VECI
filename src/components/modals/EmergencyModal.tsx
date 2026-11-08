"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  MapPin,
  Navigation,
  ShieldCheck,
  Volume2,
  VolumeX,
  Wrench,
} from "lucide-react";
import { api } from '@/lib/api-client'

type Notice = {
  id: string;
  type: "need" | "resource";
  body: string;
  locationLabel?: string;
};

const key = "nexobarrio-emergency-notices-v2";

const contacts = [
  { number: "116", name: "Bomberos del Perú" },
  { number: "105", name: "Policía Nacional" },
  { number: "106", name: "SAMU (Ambulancia)" },
  { number: "115", name: "Defensa Civil / INDECI" },
];

const supportGroups = [
  {
    role: "Corte de tablero y riesgo eléctrico",
    provider: "Carlos Mendoza · Electricista verificado",
    zone: "A 450 m · Jr. Washington",
  },
  {
    role: "Cierre de llaves y fugas de matriz de agua",
    provider: "Luis Quispe · Gasfitero de urgencia",
    zone: "A 750 m · Paseo Colón",
  },
  {
    role: "Brigada Vecinal de Primeros Auxilios y Evacuación",
    provider: "Junta Vecinal Centro Cívico (8 voluntarios)",
    zone: "Punto de reunión: Parque de la Exposición",
  },
];

const starterNotices: Notice[] = [
  {
    id: "emg-1",
    type: "need",
    body: "Vecino vulnerable: Don Hernán (82 años, Piso 3) requiere apoyo para bajar escaleras en caso de réplica.",
    locationLabel: "Jr. Washington · A 250 m",
  },
  {
    id: "emg-2",
    type: "resource",
    body: "Botiquín de primeros auxilios, linternas recargables y 20L de agua potable disponibles para la cuadra.",
    locationLabel: "Pje. Velarde · A 300 m",
  },
];

export function EmergencyModal() {
  const [section, setSection] = useState<"contacts" | "board">("contacts");
  const [notices, setNotices] = useState<Notice[]>(starterNotices);
  const [type, setType] = useState<"need" | "resource">("resource");
  const [body, setBody] = useState("");
  const [ready, setReady] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "null");
      if (Array.isArray(saved) && saved.length > 0) {
        setNotices(saved);
      }
    } catch {
      /* Keep the emergency directory available. */
    }
    setReady(true);
    void api.getEmergencyItems().then((items) => {
      if (items && items.length > 0) {
        setNotices((current) => {
          const existingIds = new Set(current.map((n) => n.id))
          const mapped: Notice[] = items
            .filter((item) => !existingIds.has(item.id))
            .map((item) => ({
              id: item.id,
              type: item.kind === 'need' ? 'need' : 'resource',
              body: item.title,
              locationLabel: item.zoneName || 'Centro Cívico',
            }))
          return [...mapped, ...current]
        })
      }
    })

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(key, JSON.stringify(notices));
  }, [notices, ready]);

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const text = contacts
      .map(
        ({ number, name }) =>
          `${name}: llamar al ${number.split("").join(" ")}`,
      )
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-PE";
    utterance.rate = 0.95;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const addNotice = async () => {
    const cleanBody = body.trim()
    if (cleanBody.length < 5) return
    setBody('')
    const remote = await api.createEmergencyItem({
      kind: type,
      title: cleanBody,
      zoneName: 'Centro Cívico',
      source: 'Reporte vecinal',
    })
    const nextNotice: Notice = {
      id: remote?.id || crypto.randomUUID(),
      type,
      body: cleanBody,
      locationLabel: 'Centro Cívico · Reportado hace unos segundos',
    }
    setNotices((current) => [nextNotice, ...current])
  }

  return (
    <div className="emergency-view">
      <div className="emergency-header">
        <span>
          <AlertTriangle size={25} />
        </span>
        <div>
          <small>Atención responsable · Funciona Online y Offline</small>
          <h1>Emergencia y soporte vecinal</h1>
        </div>
      </div>

      <div className="warning-box">
        <strong>
          Ante peligro inmediato, llama primero a una línea oficial.
        </strong>
        <p>
          Esta vista coordina oficios críticos de la zona, brigadas barriales y
          recursos humanitarios entre vecinos.
        </p>
      </div>

      <div className="segmented">
        <button
          className={section === "contacts" ? "is-active" : ""}
          onClick={() => setSection("contacts")}
        >
          Líneas y Oficios de Soporte
        </button>
        <button
          className={section === "board" ? "is-active" : ""}
          onClick={() => setSection("board")}
        >
          Tablero de Ayuda Humanitaria
        </button>
      </div>

      {section === "contacts" ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: "4px 0 12px",
            }}
          >
            <button
              type="button"
              className="secondary-button"
              onClick={toggleSpeak}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                minHeight: "40px",
                padding: "6px 14px",
                borderRadius: "999px",
                fontWeight: 650,
                fontSize: "13px",
                borderColor: isSpeaking ? "#b91c1c" : undefined,
                color: isSpeaking ? "#b91c1c" : undefined,
              }}
              aria-label={
                isSpeaking
                  ? "Detener lectura de números"
                  : "Escuchar números de emergencia"
              }
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={17} /> Detener lectura
                </>
              ) : (
                <>
                  <Volume2 size={17} /> Escuchar números (Voz)
                </>
              )}
            </button>
          </div>

          <div className="emergency-list">
            {contacts.map(({ number, name }) => (
              <a key={number} href={`tel:${number}`}>
                <span>{number}</span>
                <div>
                  <strong>{name}</strong>
                  <small>Llamada directa gratuita</small>
                </div>
                <Navigation size={18} />
              </a>
            ))}
          </div>

          <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
            <strong
              style={{
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Wrench size={16} color="#0f766e" /> Oficios y Grupos de Apoyo en
              Emergencia (Zona)
            </strong>
            {supportGroups.map((group) => (
              <article
                key={group.role}
                style={{
                  padding: "12px 14px",
                  borderRadius: "14px",
                  background: "white",
                  border: "1px solid var(--line)",
                  display: "grid",
                  gap: "3px",
                }}
              >
                <strong style={{ fontSize: "13.5px", color: "var(--ink)" }}>
                  {group.role}
                </strong>
                <span
                  style={{
                    fontSize: "12.5px",
                    color: "#0f766e",
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck
                    size={13}
                    style={{ display: "inline", marginRight: "4px" }}
                  />
                  {group.provider}
                </span>
                <small style={{ color: "var(--muted)", fontSize: "11.5px" }}>
                  {group.zone}
                </small>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="active-community">
          <div className="board-summary">
            <span>
              <strong>
                {notices.filter((notice) => notice.type === "need").length}
              </strong>
              <small>Vecinos vulnerables</small>
            </span>
            <span>
              <strong>
                {notices.filter((notice) => notice.type === "resource").length}
              </strong>
              <small>Recursos críticos</small>
            </span>
            <span>
              <strong>3</strong>
              <small>Brigadas y soporte</small>
            </span>
          </div>

          <div className="emergency-compose">
            <label>
              Tipo de reporte humanitario
              <select
                value={type}
                onChange={(event) =>
                  setType(event.target.value as "need" | "resource")
                }
              >
                <option value="resource">
                  Ofrezco recurso crítico (agua, botiquín, abrigo)
                </option>
                <option value="need">
                  Reporto vecino en situación de vulnerabilidad
                </option>
              </select>
            </label>
            <label>
              Detalle y ubicación referencial
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Ej. Agua potable, botiquín o adulto mayor que necesita apoyo en piso alto…"
                rows={3}
              />
            </label>
            <button
              className="primary-button"
              onClick={addNotice}
              disabled={body.trim().length < 5}
            >
              Publicar en el tablero de emergencia
            </button>
          </div>

          {notices.map((notice) => (
            <article key={notice.id}>
              <span
                className={`kind-tag kind-tag--${notice.type === "need" ? "help" : "gift"}`}
              >
                {notice.type === "need"
                  ? "Vecino vulnerable / Necesidad"
                  : "Recurso solidario"}
              </span>
              <h3>{notice.body}</h3>
              <small
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <MapPin size={12} /> {notice.locationLabel || "Centro Cívico"}
              </small>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
