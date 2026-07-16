#!/usr/bin/env bash
#
# Genera interfaces TypeScript a partir del WSDL de un servicio de AFIP.
#
# Uso:
#   ./scripts/generate-wsdl-types.sh [servicio] [entorno]
#
#   servicio: nombre del servicio AFIP (default: wsfev1)
#   entorno:  homo | prod (default: homo)
#
# Ejemplos:
#   ./scripts/generate-wsdl-types.sh
#   ./scripts/generate-wsdl-types.sh wsfev1 prod
#
set -euo pipefail

SERVICE="${1:-wsfev1}"
AFIP_ENV="${2:-homo}"

case "$AFIP_ENV" in
    homo) URL="https://wswhomo.afip.gov.ar/${SERVICE}/service.asmx?wsdl" ;;
    prod) URL="https://servicios1.afip.gov.ar/${SERVICE}/service.asmx?WSDL" ;;
    *)
        echo "Entorno desconocido: ${AFIP_ENV} (usar homo | prod)" >&2
        exit 1
        ;;
esac

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUT_DIR="${ROOT_DIR}/src/generated"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

WSDL_FILE="${TMP_DIR}/${SERVICE}.wsdl"

echo "Descargando WSDL de ${URL} ..."
# Los servidores de AFIP requieren ciphers TLS legacy (igual que en runtime,
# ver useLegacyTls en AfipSoap).
curl -sS --ciphers 'DEFAULT@SECLEVEL=1' -o "$WSDL_FILE" "$URL"

echo "Generando interfaces en ${OUT_DIR}/${SERVICE} ..."
pnpm exec wsdl-tsclient "$WSDL_FILE" -o "$OUT_DIR" --emitDefinitionsOnly

echo "Formateando código generado ..."
pnpm exec prettier --write "src/generated/${SERVICE}/**/*.ts" >/dev/null

echo "Listo: src/generated/${SERVICE}"
