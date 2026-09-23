import { memo, useCallback, useRef } from 'react';
import { EdgeLabelRenderer, useReactFlow, useStore } from '@xyflow/react';

/**
 * Configuración visual por tipo de relación UML 2.5 (5 tipos)
 */
const EDGE_CONFIG = {
  // 1. Asociación — línea continua simple sin flecha
  association: {
    type:        'association',
    label:       'asociación',
    color:       '#000000',
    dash:        'none',
    hasRhombus:  false,
    hasTriangle: false,
    hasArrow:    false,
  },
  // 2. Asociación Dirigida — línea continua con flecha abierta
  directed_association: {
    type:        'directed_association',
    label:       'asociación dirigida',
    color:       '#000000',
    dash:        'none',
    hasRhombus:  false,
    hasTriangle: false,
    hasArrow:    true,
  },
  // 3. Dependencia — línea discontinua con flecha abierta
  dependency: {
    type:        'dependency',
    label:       'dependencia',
    color:       '#000000',
    dash:        '6 4',
    hasRhombus:  false,
    hasTriangle: false,
    hasArrow:    true,
  },
  // 4. Agregación — rombo hueco blanco en origen
  aggregation: {
    type:        'aggregation',
    label:       'agregación',
    color:       '#000000',
    dash:        'none',
    hasRhombus:  true,
    rhombusFill: 'hollow',
    hasTriangle: false,
    hasArrow:    false,
  },
  // 5. Composición — rombo relleno negro en origen
  composition: {
    type:        'composition',
    label:       'composición',
    color:       '#000000',
    dash:        'none',
    hasRhombus:  true,
    rhombusFill: 'solid',
    hasTriangle: false,
    hasArrow:    false,
  },
  // 6. Herencia / Generalización — triángulo cerrado hueco blanco en destino
  inheritance: {
    type:        'inheritance',
    label:       'herencia',
    color:       '#000000',
    dash:        'none',
    hasRhombus:  false,
    hasTriangle: true,
    hasArrow:    false,
  },
  // 7. Realización — línea discontinua con triángulo cerrado hueco blanco en destino
  realization: {
    type:        'realization',
    label:       'realización',
    color:       '#000000',
    dash:        '6 4',
    hasRhombus:  false,
    hasTriangle: true,
    hasArrow:    false,
  },
  // 8. Clase de Asociación — línea discontinua simple sin flecha
  association_class: {
    type:        'association_class',
    label:       'clase de asociación',
    color:       '#000000',
    dash:        '4 4',
    hasRhombus:  false,
    hasTriangle: false,
    hasArrow:    false,
  },
};

/**
 * Calcula el path libre (polyline) con N waypoints intermedios arrastrables.
 * - Sin restricción de ángulos: la línea puede tomar cualquier forma
 * - Los marcadores se orientan según el ángulo real del primer/último segmento
 * - Soporta 0 o más waypoints intermedios
 */
function computeFreeformPath(sx, sy, tx, ty, waypoints, relConfig, sourcePosition = 'bottom', targetPosition = 'top') {
  // Todos los puntos del path: origen + waypoints + destino
  const allPts = [{ x: sx, y: sy }, ...waypoints, { x: tx, y: ty }];

  // Ángulo de salida del origen (hacia el primer waypoint o el destino)
  const p1 = allPts[1];
  let angleStartDeg;
  if (Math.hypot(p1.x - sx, p1.y - sy) < 1) {
    const fallbackAngles = { right: 0, bottom: 90, left: 180, top: 270 };
    angleStartDeg = fallbackAngles[sourcePosition] ?? 0;
  } else {
    angleStartDeg = (Math.atan2(p1.y - sy, p1.x - sx) * 180) / Math.PI;
  }
  const angleStart = (angleStartDeg * Math.PI) / 180;

  // Ángulo de llegada al destino (desde el último waypoint o el origen)
  const pPrev = allPts[allPts.length - 2];
  let angleEndDeg;
  if (Math.hypot(tx - pPrev.x, ty - pPrev.y) < 1) {
    const fallbackAngles = { right: 180, bottom: 270, left: 0, top: 90 };
    angleEndDeg = fallbackAngles[targetPosition] ?? 0;
  } else {
    angleEndDeg = (Math.atan2(ty - pPrev.y, tx - pPrev.x) * 180) / Math.PI;
  }
  const angleEnd = (angleEndDeg * Math.PI) / 180;

  // Ajustar primer/último punto para no solapar con los marcadores SVG
  const RHOMBUS_LEN = 22;
  const TRIANGLE_LEN = 18;
  const linePts = allPts.map((p) => ({ ...p }));
  if (relConfig.hasRhombus) {
    linePts[0].x += Math.cos(angleStart) * RHOMBUS_LEN;
    linePts[0].y += Math.sin(angleStart) * RHOMBUS_LEN;
  }
  if (relConfig.hasTriangle) {
    const last = linePts.length - 1;
    linePts[last].x -= Math.cos(angleEnd) * TRIANGLE_LEN;
    linePts[last].y -= Math.sin(angleEnd) * TRIANGLE_LEN;
  }

  const edgePath = linePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');

  // Lista de segmentos: útiles para mostrar handles de "añadir waypoint"
  const segments = [];
  for (let i = 0; i < allPts.length - 1; i++) {
    segments.push({
      x1: allPts[i].x,   y1: allPts[i].y,
      x2: allPts[i+1].x, y2: allPts[i+1].y,
      midX: (allPts[i].x + allPts[i+1].x) / 2,
      midY: (allPts[i].y + allPts[i+1].y) / 2,
      index: i,   // = índice donde insertar en el array de waypoints
    });
  }

  // Punto central del edge (para etiqueta de relación y toolbar)
  const midSeg = segments[Math.floor(segments.length / 2)] ?? segments[0];
  const midX = midSeg?.midX ?? (sx + tx) / 2;
  const midY = midSeg?.midY ?? (sy + ty) / 2;

  // Posición de multiplicidades (desplazadas perpendicularmente al primer/último segmento)
  const OFF_S = relConfig.hasRhombus ? 28 : 18;
  const dxS = p1.x - sx, dyS = p1.y - sy;
  const lenS = Math.hypot(dxS, dyS) || 1;
  const srcLabelX = sx + (dxS / lenS) * OFF_S - (dyS / lenS) * 12;
  const srcLabelY = sy + (dyS / lenS) * OFF_S + (dxS / lenS) * 12;

  const OFF_T = (relConfig.hasTriangle || relConfig.hasArrow) ? 26 : 18;
  const dxT = tx - pPrev.x, dyT = ty - pPrev.y;
  const lenT = Math.hypot(dxT, dyT) || 1;
  const tgtLabelX = tx - (dxT / lenT) * OFF_T - (dyT / lenT) * 12;
  const tgtLabelY = ty - (dyT / lenT) * OFF_T + (dxT / lenT) * 12;

  return { edgePath, allPts, segments, angleStartDeg, angleEndDeg, midX, midY,
           srcLabelX, srcLabelY, tgtLabelX, tgtLabelY };
}

export default memo(function UMLEdge({
  id,
  source, target,
  sourceX: defaultSourceX, sourceY: defaultSourceY,
  targetX: defaultTargetX, targetY: defaultTargetY,
  sourcePosition: defaultSourcePos = 'bottom',
  targetPosition: defaultTargetPos = 'top',
  data = {},
  selected,
}) {
  const { setEdges, getViewport } = useReactFlow();

  // Obtener las coordenadas y dimensiones de los nodos dinámicamente de forma estricta (primitivas)
  // En React Flow, las referencias de los nodos pueden mutar, por lo que suscribirse al objeto entero falla.
  const sPosX = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(source); return n?.positionAbsolute?.x ?? n?.position?.x ?? 0; }, [source]));
  const sPosY = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(source); return n?.positionAbsolute?.y ?? n?.position?.y ?? 0; }, [source]));
  const sW = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(source); return n?.measured?.width || 160; }, [source]));
  const sH = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(source); return n?.measured?.height || 40; }, [source]));

  const tPosX = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(target); return n?.positionAbsolute?.x ?? n?.position?.x ?? 0; }, [target]));
  const tPosY = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(target); return n?.positionAbsolute?.y ?? n?.position?.y ?? 0; }, [target]));
  const tW = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(target); return n?.measured?.width || 160; }, [target]));
  const tH = useStore(useCallback((s) => { const n = (s.nodeLookup || s.nodeInternals).get(target); return n?.measured?.height || 40; }, [target]));

  const relType   = data.relation_type ?? 'association';
  const config    = EDGE_CONFIG[relType] ?? EDGE_CONFIG.association;

  // Solo mostrar el toolbar cuando este edge es el ÚNICO elemento seleccionado
  const totalSelected = useStore(useCallback((s) => {
    const selectedNodes = [...(s.nodeLookup || s.nodeInternals).values()].filter(n => n.selected).length;
    const selectedEdges = (s.edges || []).filter(e => e.selected).length;
    return selectedNodes + selectedEdges;
  }, []));
  const isOnlySelected = selected && totalSelected === 1;

  // Waypoints libres: array de {x,y} en coordenadas del canvas
  // Compatibilidad hacia atrás: si había bendX/bendY, migramos a waypoints
  const waypoints = data.waypoints ?? (
    (data.bendX || data.bendY)
      ? [{ x: data.bendX ?? (defaultSourceX + defaultTargetX) / 2, y: data.bendY ?? (defaultSourceY + defaultTargetY) / 2 }]
      : []
  );

  let sourceX = defaultSourceX;
  let sourceY = defaultSourceY;
  let targetX = defaultTargetX;
  let targetY = defaultTargetY;
  let sourcePosition = defaultSourcePos;
  let targetPosition = defaultTargetPos;

  // ── Selección dinámica de cara y punto de anclaje ────────────────────────────
  // El origen conecta hacia: primer waypoint (si existe) o centro del destino.
  // El destino conecta desde: último waypoint (si existe) o centro del origen.
  // De esta manera, tanto el rombo (origen) como la flecha/triángulo (destino)
  // cambian de cara y de posición en tiempo real cuando se manipulan los puntos de la flecha.
  if (sW && tW) {
    const sxCenter = sPosX + sW / 2;
    const syCenter = sPosY + sH / 2;
    const txCenter = tPosX + tW / 2;
    const tyCenter = tPosY + tH / 2;

    const targetForSource = waypoints.length > 0 ? waypoints[0] : { x: txCenter, y: tyCenter };
    const sourceForTarget = waypoints.length > 0 ? waypoints[waypoints.length - 1] : { x: sxCenter, y: syCenter };

    // ── Cara y posición para SOURCE (donde va el rombo) ──
    const dxS = targetForSource.x - sxCenter;
    const dyS = targetForSource.y - syCenter;
    const sHalfW = Math.max(sW / 2, 1);
    const sHalfH = Math.max(sH / 2, 1);
    const normDxS = dxS / sHalfW;
    const normDyS = dyS / sHalfH;

    if (Math.abs(normDxS) >= Math.abs(normDyS)) {
      if (dxS > 0) {
        sourcePosition = 'right';
        sourceX = sPosX + sW;
        sourceY = Math.max(sPosY + 14, Math.min(sPosY + sH - 14, targetForSource.y));
      } else {
        sourcePosition = 'left';
        sourceX = sPosX;
        sourceY = Math.max(sPosY + 14, Math.min(sPosY + sH - 14, targetForSource.y));
      }
    } else {
      if (dyS > 0) {
        sourcePosition = 'bottom';
        sourceX = Math.max(sPosX + 14, Math.min(sPosX + sW - 14, targetForSource.x));
        sourceY = sPosY + sH;
      } else {
        sourcePosition = 'top';
        sourceX = Math.max(sPosX + 14, Math.min(sPosX + sW - 14, targetForSource.x));
        sourceY = sPosY;
      }
    }

    // ── Cara y posición para TARGET (donde va el triángulo o la flecha) ──
    const dxT = sourceForTarget.x - txCenter;
    const dyT = sourceForTarget.y - tyCenter;
    const tHalfW = Math.max(tW / 2, 1);
    const tHalfH = Math.max(tH / 2, 1);
    const normDxT = dxT / tHalfW;
    const normDyT = dyT / tHalfH;

    if (Math.abs(normDxT) >= Math.abs(normDyT)) {
      if (dxT > 0) {
        targetPosition = 'right';
        targetX = tPosX + tW;
        targetY = Math.max(tPosY + 14, Math.min(tPosY + tH - 14, sourceForTarget.y));
      } else {
        targetPosition = 'left';
        targetX = tPosX;
        targetY = Math.max(tPosY + 14, Math.min(tPosY + tH - 14, sourceForTarget.y));
      }
    } else {
      if (dyT > 0) {
        targetPosition = 'bottom';
        targetX = Math.max(tPosX + 14, Math.min(tPosX + tW - 14, sourceForTarget.x));
        targetY = tPosY + tH;
      } else {
        targetPosition = 'top';
        targetX = Math.max(tPosX + 14, Math.min(tPosX + tW - 14, sourceForTarget.x));
        targetY = tPosY;
      }
    }
  }

  const geom = computeFreeformPath(sourceX, sourceY, targetX, targetY, waypoints, config, sourcePosition, targetPosition);

  const activeColor = selected ? '#007acc' : (config.color || '#000000');
  const strokeW     = selected ? 2 : 1.4;

  const srcMult  = data.sourceMultiplicity ?? '';
  const tgtMult  = data.targetMultiplicity ?? '';
  const relLabel = data.label ?? '';
  const assocClassId = data.associationClassId;

  // Si esta asociación tiene una "clase de asociación" ligada, la escuchamos reactivamente
  const assocClassNode = useStore(
    useCallback((s) => {
      if (!assocClassId) return null;
      const lookup = s.nodeLookup || s.nodeInternals;
      return lookup ? lookup.get(assocClassId) : null;
    }, [assocClassId])
  );

  const updateEdgeData = useCallback((newData) => {
    window.dispatchEvent(new CustomEvent('update-edge-data', { detail: { edgeId: id, newData } }));
  }, [id]);

  // ── Sistema de waypoints libres ────────────────────────────────────────────────
  // Cada waypoint es un punto {x,y} en coordenadas de canvas que se puede:
  //   • Arrastrar libremente en cualquier dirección
  //   • Eliminar con doble clic
  // Hacer clic (mousedown) en el punto medio de un segmento añade un waypoint
  // en esa posición e inmediatamente inicia el drag del nuevo punto.
  const wpDrag = useRef({ active: false, clientX: 0, clientY: 0, initX: 0, initY: 0, idx: 0, zoom: 1 });

  // Inicia el drag de un waypoint existente (por índice)
  const startWpDrag = useCallback((e, idx, initX, initY) => {
    e.stopPropagation();
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('take-snapshot'));
    const { zoom } = getViewport();
    wpDrag.current = { active: true, clientX: e.clientX, clientY: e.clientY, initX, initY, idx, zoom };

    const onMouseMove = (me) => {
      if (!wpDrag.current.active) return;
      const { clientX, clientY, initX: ix, initY: iy, idx: i, zoom: z } = wpDrag.current;
      const dx = (me.clientX - clientX) / z;
      const dy = (me.clientY - clientY) / z;
      setEdges(eds => eds.map(edge => {
        if (edge.id !== id) return edge;
        const wps = [...(edge.data.waypoints ?? [])];
        wps[i] = { x: ix + dx, y: iy + dy };
        return { ...edge, data: { ...edge.data, waypoints: wps, bendX: 0, bendY: 0 } };
      }));
    };
    const onMouseUp = () => {
      wpDrag.current.active = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.dispatchEvent(new CustomEvent('save-diagram'));
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [id, setEdges, getViewport]);

  // Clic en punto medio de un segmento: inserta waypoint y empieza a arrastrarlo
  const onSegmentMidDown = useCallback((e, seg) => {
    e.stopPropagation();
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('take-snapshot'));
    const insertIdx = seg.index;   // insertar en la posición del waypoints array
    const newX = seg.midX;
    const newY = seg.midY;
    // Insertar el nuevo waypoint en el array
    setEdges(eds => eds.map(edge => {
      if (edge.id !== id) return edge;
      const wps = [...(edge.data.waypoints ?? [])];
      wps.splice(insertIdx, 0, { x: newX, y: newY });
      return { ...edge, data: { ...edge.data, waypoints: wps, bendX: 0, bendY: 0 } };
    }));
    // Iniciar drag del nuevo waypoint inmediatamente
    startWpDrag(e, insertIdx, newX, newY);
  }, [id, setEdges, startWpDrag]);

  // Doble clic en un waypoint: lo elimina
  const onWpDoubleClick = useCallback((e, idx) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('take-snapshot'));
    setEdges(eds => eds.map(edge => {
      if (edge.id !== id) return edge;
      const wps = (edge.data.waypoints ?? []).filter((_, i) => i !== idx);
      return { ...edge, data: { ...edge.data, waypoints: wps } };
    }));
    setTimeout(() => window.dispatchEvent(new CustomEvent('save-diagram')), 50);
  }, [id, setEdges]);

  // Doble clic en la línea (hitbox): reset completo de waypoints → línea recta
  const onEdgeDoubleClick = useCallback((e) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('take-snapshot'));
    setEdges(eds => eds.map(edge =>
      edge.id === id ? { ...edge, data: { ...edge.data, waypoints: [], bendX: 0, bendY: 0 } } : edge
    ));
    setTimeout(() => window.dispatchEvent(new CustomEvent('save-diagram')), 50);
  }, [id, setEdges]);

  // Estilo base para etiquetas
  const baseLabelStyle = {
    position:      'absolute',
    pointerEvents: 'none',
    fontFamily:    "'Inter', -apple-system, sans-serif",
    whiteSpace:    'nowrap',
    lineHeight:    '1.3',
    userSelect:    'none',
  };

  return (
    <>
      {/* ── Hitbox invisible para seleccionar y hacer doble clic ── */}
      <path
        d={geom.edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={22}
        className="react-flow__edge-interaction"
        style={{ cursor: 'pointer' }}
        onDoubleClick={onEdgeDoubleClick}
      />

      {/* ── Línea principal de la relación UML ── */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={geom.edgePath}
        fill="none"
        stroke={activeColor}
        strokeWidth={strokeW}
        strokeDasharray={config.dash === 'none' ? undefined : config.dash}
        style={{
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease',
          filter: selected ? 'drop-shadow(0 0 3px rgba(37,99,235,0.6))' : undefined,
        }}
      />

      {/* ── ORIGEN: Rombo de Composición o Agregación (renderizado directo en SVG) ── */}
      {config.hasRhombus && (
        <g transform={`translate(${sourceX}, ${sourceY}) rotate(${geom.angleStartDeg})`}>
          {config.rhombusFill === 'solid' ? (
            /* Composición: Rombo relleno completo negro/oscuro (22px de largo, 14px de ancho) */
            <polygon
              points="0,0 11,-7 22,0 11,7"
              fill={activeColor}
              stroke={activeColor}
              strokeWidth={1.5}
              strokeLinejoin="round"
              style={{
                filter: selected ? 'drop-shadow(0 0 4px rgba(37,99,235,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))',
              }}
            />
          ) : (
            /* Agregación: Rombo hueco blanco con borde coloreado */
            <polygon
              points="0,0 11,-7 22,0 11,7"
              fill="#ffffff"
              stroke={activeColor}
              strokeWidth={2.2}
              strokeLinejoin="round"
              style={{
                filter: selected ? 'drop-shadow(0 0 4px rgba(37,99,235,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
              }}
            />
          )}
        </g>
      )}

      {/* ── DESTINO: Triángulo cerrado hueco (Herencia) ── */}
      {config.hasTriangle && (
        <g transform={`translate(${targetX}, ${targetY}) rotate(${geom.angleEndDeg})`}>
          <polygon
            points="0,0 -18,-9 -18,9"
            fill="#ffffff"
            stroke={activeColor}
            strokeWidth={2.2}
            strokeLinejoin="round"
            style={{
              filter: selected ? 'drop-shadow(0 0 4px rgba(37,99,235,0.6))' : 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))',
            }}
          />
        </g>
      )}

      {/* ── DESTINO: Flecha abierta visible (solo Asociación y Dependencia) ── */}
      {config.hasArrow && (
        <g transform={`translate(${targetX}, ${targetY}) rotate(${geom.angleEndDeg})`}>
          <path
            d="M -14 -8 L 0 0 L -14 8"
            fill="none"
            stroke={activeColor}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: selected ? 'drop-shadow(0 0 3px rgba(37,99,235,0.6))' : undefined,
            }}
          />
        </g>
      )}

      {/* ── CLASE DE ASOCIACIÓN: Línea punteada dinámica hacia la clase ── */}
      {assocClassNode && (() => {
        const pos = assocClassNode.positionAbsolute || assocClassNode.position || { x: 0, y: 0 };
        const cx = pos.x + (assocClassNode.measured?.width || 120) / 2;
        const cy = pos.y + (assocClassNode.measured?.height || 40) / 2;
        return (
          <line
            x1={geom.midX}
            y1={geom.midY}
            x2={cx}
            y2={cy}
            stroke={activeColor}
            strokeWidth={1.5}
            strokeDasharray="5 5"
            style={{ opacity: 0.8 }}
          />
        );
      })()}

      {/* ── ETIQUETAS FLOTANTES (Renderizadas en EdgeLabelRenderer) ── */}
      <EdgeLabelRenderer>

        {/* Texto libre de la relación (solo si el usuario lo ingresa, ej. "TIENE", "usa", "pertenece a") */}
        {relLabel && (
          <div
            style={{
              ...baseLabelStyle,
              transform:    `translate(-50%, -50%) translate(${geom.midX}px, ${geom.midY}px)`,
              fontSize:     '12px',
              fontWeight:   '700',
              color:        '#0f172a',
              background:   '#ffffff',
              padding:      '3px 10px',
              borderRadius: '6px',
              border:       `1.5px solid ${selected ? '#2563eb' : activeColor}`,
              boxShadow:    '0 2px 8px rgba(0,0,0,0.12)',
              letterSpacing: '0.04em',
              zIndex:       10,
            }}
            className="nodrag nopan"
          >
            {relLabel}
          </div>
        )}

        {/* Multiplicidad ORIGEN (source) */}
        {srcMult && (
          <div
            style={{
              ...baseLabelStyle,
              transform:    `translate(-50%, -50%) translate(${geom.srcLabelX}px, ${geom.srcLabelY}px)`,
              fontSize:     '11.5px',
              fontWeight:   '600',
              fontFamily:   '"Inter", sans-serif',
              color:        '#334155',
              background:   'rgba(255, 255, 255, 0.75)',
              padding:      '1px 4px',
              borderRadius: '3px',
              border:       'none',
              boxShadow:    'none',
              backdropFilter: 'blur(2px)',
              zIndex:       8,
            }}
            className="nodrag nopan"
          >
            {srcMult}
          </div>
        )}

        {/* Multiplicidad DESTINO (target) */}
        {tgtMult && (
          <div
            style={{
              ...baseLabelStyle,
              transform:    `translate(-50%, -50%) translate(${geom.tgtLabelX}px, ${geom.tgtLabelY}px)`,
              fontSize:     '11.5px',
              fontWeight:   '600',
              fontFamily:   '"Inter", sans-serif',
              color:        '#334155',
              background:   'rgba(255, 255, 255, 0.75)',
              padding:      '1px 4px',
              borderRadius: '3px',
              border:       'none',
              boxShadow:    'none',
              backdropFilter: 'blur(2px)',
              zIndex:       8,
            }}
            className="nodrag nopan"
          >
            {tgtMult}
          </div>
        )}

        {/* Handles de waypoints (bolitas arrastrables) — una por cada waypoint */}
        {selected && waypoints.map((wp, i) => (
          <div
            key={`wp-${i}`}
            onMouseDown={(e) => startWpDrag(e, i, wp.x, wp.y)}
            onDoubleClick={(e) => onWpDoubleClick(e, i)}
            title="Arrastrá libremente • Doble clic para eliminar"
            style={{
              ...baseLabelStyle,
              pointerEvents: 'all',
              transform: `translate(-50%, -50%) translate(${wp.x}px, ${wp.y}px)`,
              width: '12px',
              height: '12px',
              background: '#007acc',
              border: '2px solid #ffffff',
              borderRadius: '50%',
              cursor: 'move',
              zIndex: 30,
              boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
            }}
            className="nodrag nopan"
          />
        ))}

        {/* Handles de punto medio de cada segmento — clic+drag para añadir waypoint */}
        {selected && geom.segments.map((seg) => (
          <div
            key={`seg-${seg.index}`}
            onMouseDown={(e) => onSegmentMidDown(e, seg)}
            title="Arrastrá para crear un nuevo punto de control"
            style={{
              ...baseLabelStyle,
              pointerEvents: 'all',
              transform: `translate(-50%, -50%) translate(${seg.midX}px, ${seg.midY}px)`,
              width: '8px',
              height: '8px',
              background: 'rgba(255,255,255,0.9)',
              border: '1.5px solid #2563eb',
              borderRadius: '50%',
              cursor: 'crosshair',
              zIndex: 25,
              boxShadow: '0 1px 4px rgba(37,99,235,0.4)',
            }}
            className="nodrag nopan"
          />
        ))}

        {/* Toolbar Inline (Flotante encima de la relación — solo cuando está seleccionada individualmente) */}
        {isOnlySelected && (
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'all',
              transform: `translate(-50%, -100%) translate(${geom.midX}px, ${geom.midY - 20}px)`,
              background: '#252526',
              border: '1px solid #454545',
              borderRadius: '6px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 50,
            }}
            className="nodrag nopan"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Botones de Tipos de Relación */}
            {[
              { type: 'association', symbol: '—', tooltip: 'Asociación' },
              { type: 'directed_association', symbol: '→', tooltip: 'Asociación Dirigida' },
              { type: 'dependency', symbol: '⤳', tooltip: 'Dependencia' },
              { type: 'aggregation', symbol: '◇', tooltip: 'Agregación' },
              { type: 'composition', symbol: '◆', tooltip: 'Composición' },
              { type: 'inheritance', symbol: '△', tooltip: 'Herencia' },
              { type: 'realization', symbol: '⇡', tooltip: 'Realización' },
              { type: 'association_class', symbol: '·-·', tooltip: 'Clase de Asociación' },
            ].map(rt => (
              <button
                key={rt.type}
                title={rt.tooltip}
                onClick={() => updateEdgeData({ relation_type: rt.type })}
                style={{
                  background: relType === rt.type ? '#094771' : 'transparent',
                  color: relType === rt.type ? '#ffffff' : '#888888',
                  border: relType === rt.type ? '1px solid #007acc' : '1px solid transparent',
                  borderRadius: '4px',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                }}
              >
                {rt.symbol}
              </button>
            ))}

            <div style={{ width: '1px', height: '16px', background: '#454545', margin: '0 2px' }} />

            {/* Input para texto de relación */}
            <input
              type="text"
              placeholder="ej. TIENE, usa..."
              value={relLabel}
              onChange={(e) => updateEdgeData({ label: e.target.value })}
              style={{
                background: '#1e1e1e',
                color: '#cccccc',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                padding: '0 6px',
                fontSize: '11px',
                width: '100px',
                height: '22px',
                outline: 'none',
              }}
              onFocus={(e) => e.target.style.borderColor = '#007acc'}
              onBlur={(e) => e.target.style.borderColor = '#3c3c3c'}
            />

            <div style={{ width: '1px', height: '16px', background: '#454545', margin: '0 2px' }} />

            {/* Multiplicidad Origen */}
            <select
              title="Multiplicidad Origen"
              value={srcMult}
              onChange={(e) => updateEdgeData({ sourceMultiplicity: e.target.value })}
              style={{
                background: '#1e1e1e',
                color: '#cccccc',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                padding: '0 4px',
                fontSize: '11px',
                cursor: 'pointer',
                outline: 'none',
                height: '22px',
              }}
            >
              <option value="">Src</option>
              <option value="1">1</option>
              <option value="0..1">0..1</option>
              <option value="1..*">1..*</option>
              <option value="0..*">0..*</option>
              <option value="*">*</option>
            </select>

            <span style={{ color: '#666', fontSize: '10px' }}>to</span>

            {/* Multiplicidad Destino */}
            <select
              title="Multiplicidad Destino"
              value={tgtMult}
              onChange={(e) => updateEdgeData({ targetMultiplicity: e.target.value })}
              style={{
                background: '#1e1e1e',
                color: '#cccccc',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                padding: '0 4px',
                fontSize: '11px',
                cursor: 'pointer',
                outline: 'none',
                height: '22px',
              }}
            >
              <option value="">Tgt</option>
              <option value="1">1</option>
              <option value="0..1">0..1</option>
              <option value="1..*">1..*</option>
              <option value="0..*">0..*</option>
              <option value="*">*</option>
            </select>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
});

