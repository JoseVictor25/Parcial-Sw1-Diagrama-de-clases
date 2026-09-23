/**
 * UMLMarkers — Marcadores SVG para UML 2.5.
 * Renderizados en SVG inline con dimensiones reales para que los
 * navegadores los encuentren por ID con url(#...).
 *
 * IMPORTANTE: Se usa markerUnits="userSpaceOnUse" para que los tamaños
 * sean en píxeles absolutos y no dependan del strokeWidth.
 */
export default function UMLMarkers() {
  const LINE   = '#94a3b8';   // color de la línea
  const FILL_D = '#0f172a';   // relleno oscuro (herencia/agregación)
  const FILL_B = '#94a3b8';   // relleno sólido (composición)

  return (
    <svg
      style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'visible', zIndex: -1 }}
      aria-hidden="true"
    >
      <defs>
        {/*
         * ── ASOCIACIÓN ────────────────────────────────────────────────────
         * Flecha abierta simple →
         */}
        <marker
          id="uml-association"
          markerWidth="16" markerHeight="12"
          refX="14" refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2 1 L 14 6 L 2 11"
            stroke={LINE} strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── HERENCIA ──────────────────────────────────────────────────────
         * Triángulo hueco ▷ (punta hacia destino)
         */}
        <marker
          id="uml-inheritance"
          markerWidth="18" markerHeight="14"
          refX="16" refY="7"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2 1 L 16 7 L 2 13 Z"
            stroke={LINE} strokeWidth="1.5"
            fill={FILL_D} strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── COMPOSICIÓN — ROMBO RELLENO ◆ (lado origen / markerStart) ───
         * El rombo aparece en el ORIGEN de la flecha.
         * refX=0 → la punta izquierda del rombo toca el nodo de origen.
         */}
        <marker
          id="uml-composition-src"
          markerWidth="22" markerHeight="12"
          refX="0" refY="6"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          {/* Rombo: puntas en (0,6), (10,1), (20,6), (10,11) */}
          <path
            d="M 0 6 L 10 1 L 20 6 L 10 11 Z"
            fill={FILL_B} stroke={FILL_B} strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── AGREGACIÓN — ROMBO HUECO ◇ (lado origen / markerStart) ──────
         */}
        <marker
          id="uml-aggregation-src"
          markerWidth="22" markerHeight="12"
          refX="0" refY="6"
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 0 6 L 10 1 L 20 6 L 10 11 Z"
            fill={FILL_D} stroke={LINE} strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── FLECHA ABIERTA (destino de composición/agregación) ───────────
         */}
        <marker
          id="uml-open-arrow"
          markerWidth="16" markerHeight="12"
          refX="14" refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2 1 L 14 6 L 2 11"
            stroke={LINE} strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── DEPENDENCIA — flecha abierta (igual que asociación) ──────────
         * La línea es discontinua (strokeDasharray se pone en el path del edge)
         */}
        <marker
          id="uml-dependency"
          markerWidth="16" markerHeight="12"
          refX="14" refY="6"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2 1 L 14 6 L 2 11"
            stroke={LINE} strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </marker>

        {/*
         * ── REALIZACIÓN — triángulo hueco (igual que herencia) ───────────
         * La línea es discontinua
         */}
        <marker
          id="uml-realization"
          markerWidth="18" markerHeight="14"
          refX="16" refY="7"
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path
            d="M 2 1 L 16 7 L 2 13 Z"
            stroke={LINE} strokeWidth="1.5"
            fill={FILL_D} strokeLinejoin="round"
          />
        </marker>
      </defs>
    </svg>
  );
}
