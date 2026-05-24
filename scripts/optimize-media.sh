#!/usr/bin/env bash
# optimize-media.sh — Convierte assets a formatos web-óptimos.
#
#   Video  : public/video/*.mp4         → public/video/*.webm   (VP9)
#   Imagen : public/{**,video/posters}/*.{jpg,jpeg,png}  → *.webp
#
# Idempotente: si el destino existe y es más reciente que el source, salta.
# Llamar con --force para regenerar todo.
#
# Uso:
#   ./scripts/optimize-media.sh            # incremental
#   ./scripts/optimize-media.sh --force    # regenera todo
#   npm run media                          # vía package.json

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC="$ROOT/public"
FORCE=0
[[ "${1:-}" == "--force" ]] && FORCE=1

# Colores tty
if [[ -t 1 ]]; then
  C_OK='\033[32m' C_SKIP='\033[90m' C_RUN='\033[36m' C_ERR='\033[31m' C_RST='\033[0m'
else
  C_OK='' C_SKIP='' C_RUN='' C_ERR='' C_RST=''
fi

ok()   { printf "${C_OK}✓${C_RST} %s\n" "$1"; }
skip() { printf "${C_SKIP}·${C_RST} %s ${C_SKIP}(skip)${C_RST}\n" "$1"; }
run()  { printf "${C_RUN}→${C_RST} %s\n" "$1"; }
err()  { printf "${C_ERR}✗${C_RST} %s\n" "$1" >&2; }

needs_rebuild() {
  local src="$1" dst="$2"
  [[ $FORCE -eq 1 ]] && return 0
  [[ ! -f "$dst" ]] && return 0
  [[ "$src" -nt "$dst" ]] && return 0
  return 1
}

# --- VIDEO: mp4 → webm (VP9, ~3.5 Mbps, 2-pass) -----------------------------
convert_video() {
  local src="$1"
  local dst="${src%.mp4}.webm"
  local rel="${src#$ROOT/}"
  local reldst="${dst#$ROOT/}"

  if ! needs_rebuild "$src" "$dst"; then
    skip "$reldst"
    return
  fi

  run "$rel → $reldst"
  # VP9 1-pass CRF: balance calidad/tiempo, suficiente para loops cortos
  ffmpeg -y -loglevel error -i "$src" \
    -c:v libvpx-vp9 -crf 32 -b:v 0 \
    -row-mt 1 -tile-columns 2 -threads 4 \
    -pix_fmt yuv420p \
    -an \
    "$dst" \
    && ok "$reldst" \
    || err "$reldst (ffmpeg falló)"
}

# --- IMAGEN: jpg/png → webp (calidad 85) -----------------------------------
convert_image() {
  local src="$1"
  local ext="${src##*.}"
  local lower="${ext,,}"
  local dst="${src%.*}.webp"
  local rel="${src#$ROOT/}"
  local reldst="${dst#$ROOT/}"

  if ! needs_rebuild "$src" "$dst"; then
    skip "$reldst"
    return
  fi

  run "$rel → $reldst"
  case "$lower" in
    jpg|jpeg) cwebp -q 85 -mt -quiet "$src" -o "$dst" ;;
    png)      cwebp -q 90 -mt -quiet -alpha_q 90 "$src" -o "$dst" ;;
  esac \
    && ok "$reldst" \
    || err "$reldst (cwebp falló)"
}

# --- Loop principal ---------------------------------------------------------
echo "Optimizing media in $PUBLIC"
[[ $FORCE -eq 1 ]] && echo "  mode: --force (regenerando todo)"

video_count=0
image_count=0

# Videos: cualquier .mp4 dentro de public/video
while IFS= read -r -d '' mp4; do
  convert_video "$mp4"
  ((video_count++)) || true
done < <(find "$PUBLIC/video" -type f -name '*.mp4' -print0)

# Imágenes: jpg/png en todo el public (case-insensitive)
while IFS= read -r -d '' img; do
  convert_image "$img"
  ((image_count++)) || true
done < <(find "$PUBLIC" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' \) -print0)

echo
ok "Listo. Procesados: $video_count video(s), $image_count imagen(es)."
