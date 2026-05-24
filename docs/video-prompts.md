# AUDA — Prompts de video parallax (Fase 1)

Documento de referencia. **No se renderiza en el sitio.**
Para Dan: generar cada video en Sora / Runway / Kling / Veo y dejar archivos en `/public/video/`.

## Convenciones técnicas

- **Aspect**: 16:9
- **Resolución target**: 1920×1080 (mínimo)
- **Duración**: 8–12 segundos en loop perfecto (último frame = primer frame)
- **Formato a entregar (DaVinci)**: `.mp4` (H.264). El script `npm run media` lo convierte automáticamente a `.webm` (VP9, ~3 Mbps) y lo deja al lado.
- **Sin texto on-screen** (el overlay HTML lo aporta)
- **Sin caras reconocibles** (manos parciales OK, fuera de foco si aparecen)
- **Audio**: muted (los videos nunca llevan audio en el sitio — el script descarta la pista de audio en la conversión)
- **Posters opcionales**: si quieres una imagen estática de fallback, déjala como `.jpg` o `.png` en `/public/video/posters/{slot}.{jpg,png}`. El script la convierte a `.webp` y los componentes la consumen.
- **Naming**: `/public/video/{slot}.mp4` (tú) + `/public/video/{slot}.webm` (script) + `/public/video/posters/{slot}.webp` (script, opcional).

### Paleta global (mantener en todos los videos)

| Token | Hex | Uso |
|-------|-----|-----|
| paper | `#ede6d6` | fondo cálido base |
| paper-soft | `#f4eee1` | highlights cálidos |
| ink | `#2b2b2b` | tinta carbón |
| ink-deep | `#161616` | fondo oscuro |
| orange | `#e8825a` | terracota acento |
| orange-deep | `#d06a44` | terracota saturada |
| green | `#5c7c5a` | verde salvia (LEDs servidor) |
| blue | `#3e5c76` | azul polvoso (cool sections) |

---

## 1. `hero.{webm,mp4}` — Loop 12s

**Slot**: Hero principal (primer fold).
**Prompt**:
> Slow orbital camera over an architect's wooden desk, top-down 30° angle. Brand sketches are drawing themselves onto kraft paper: thin terracotta ink lines forming geometric logos, grids, and circular forms. Hands not visible. Warm side lighting from a single desk lamp creates soft shadow gradients. Color palette: paper #ede6d6 background, ink #2b2b2b sketches, occasional terracotta #e8825a strokes. Film grain medium, subtle bloom. The camera completes a 30° arc in 12 seconds; final frame matches first frame for seamless loop. No text, no faces. Mood: editorial, deliberate, crafted.

---

## 2. `bridge.{webm,mp4}` — Loop 10s (Manifesto → About)

**Slot**: Sección puente narrativa entre Manifesto y About.
**Prompt**:
> Extreme macro of a mechanical typewriter typing words onto cream paper. Camera dolly-in extremely slow (no more than 10% zoom across the clip). Visible words being typed: "AUDA · principios · oficio" — each letter striking with mechanical precision, ink slightly uneven. Heavy super-8 film grain, warm tungsten lighting, very shallow depth of field (only the type-bar in focus). Palette: paper #ede6d6, ink #2b2b2b only — no color accents. The typing rhythm is meditative, not fast. Seamless loop: last typed character fades into first frame. No faces, no hands. Mood: artisanal, analog, principles-driven.

---

## 3. `tier0.{webm,mp4}` — Loop 8s (Identidad)

**Slot**: Header del Tier 0 — Identidad visual.
**Prompt**:
> Top-down view of two open sketchbooks on a worn wooden surface. Pen nibs and brushes — held by hands just out of frame — are drawing the AUDA wordmark in custom serif letterforms across the pages. Each letter is drawn in sequence with terracotta #e8825a ink on paper #ede6d6. Soft side light, gentle paper texture. Camera locked. 8-second loop where the final letter completes just as the first letter begins to be drawn again. No text other than "AUDA" being drawn. Mood: intimate, careful, brand-being-born.

---

## 4. `tier1.{webm,mp4}` — Loop 10s (Hosting)

**Slot**: Header del Tier 1 — Hosting + mantenimiento.
**Prompt**:
> Extreme macro inside a server rack. Rows of green #5c7c5a LEDs pulse in rhythmic, slightly offset patterns across multiple network switches and drives. Cables are perfectly organized, slightly out of focus in foreground. Cool color temperature dominates: deep blue #3e5c76 ambient with green LED accents. Heavy ISO grain, slight chromatic aberration. Camera slow pan left to right across 3 racks in 10s, looping back. No people, no text. Mood: silent infrastructure, always-on, reliable.

---

## 5. `tier2.{webm,mp4}` — Loop 10s (Auditoría)

**Slot**: Header del Tier 2 — Auditoría AI Readiness.
**Prompt**:
> Close-up of a hand (partially in frame, no face) marking columns of numbers in a leather-bound accounting ledger with a sharpened pencil. Number columns are visible, slowly being underlined and annotated. Warm desk lamp light from the left, very shallow depth of field. Palette: paper #ede6d6 page, ink #2b2b2b numbers, occasional terracotta #e8825a margin notes. The hand's movement is steady, deliberate, completing one column in 10s and returning to start. Film grain medium. Mood: rigorous, calm, audit-in-progress.

---

## 6. `tier3.{webm,mp4}` — Loop 10s (Implementación)

**Slot**: Header del Tier 3 — Implementación vertical.
**Prompt**:
> Stop-motion style: Bauhaus wooden building blocks (cubes, cylinders, half-circles) snap-assembling into a small modular structure on a blueprint paper surface. Camera locked at a 20° elevated angle. Each block lands with a satisfying micro-bounce, building 4–5 layers across 10s, then disassembling back to start for seamless loop. Blocks painted in: ink #2b2b2b, paper-soft #f4eee1, orange #e8825a. Background is faded blueprint with thin technical lines. Crisp shadows from a single overhead light. No text. Mood: constructive, modular, snap-fit precision.

---

## 7. `tier4.{webm,mp4}` — Loop 12s (AIOps)

**Slot**: Header del Tier 4 — AI Ops retainer.
**Prompt**:
> Time-lapse of mycelium / root network growing across a dark substrate. White-translucent organic threads branch, connect to nodes, and pulse with small particles of warm orange #e8825a light traveling along the connections. Background is deep ink #161616 with subtle texture. Camera very slow zoom-out across 12s, then loops back to start through a crossfade-friendly framing. Mystical but not sci-fi: think nature documentary macro, not neural net visualization. Soft cool light source from off-screen left. No text, no obvious tech. Mood: living system, breathing intelligence, organic ops.

---

## Workflow de integración

1. Genera el video en DaVinci / Sora / Runway / Kling.
2. Exporta como `.mp4` con el nombre exacto del slot (`hero.mp4`, `bridge.mp4`, `tier0.mp4`...).
3. Suéltalo en `/public/video/`.
4. (Opcional) si tienes un poster estático preferido, déjalo como `/public/video/posters/{slot}.jpg`.
5. Corre `npm run media` — convierte todo `.mp4 → .webm` (VP9, sin audio) y `.jpg/.png → .webp`. Es idempotente: salta lo ya optimizado.
6. `npm run build` o `npm run dev` — el `prebuild` hook ejecuta `npm run media` automáticamente antes de compilar producción.
7. Si quieres forzar reconversión (cambiaste el .mp4 con mismo nombre y `mtime` no cambió): `npm run media:force`.

## Estado actual

- [ ] hero
- [ ] bridge
- [ ] tier0
- [ ] tier1
- [ ] tier2
- [ ] tier3
- [ ] tier4
