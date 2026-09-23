/**
 * CollaboratorCursors.jsx
 *
 * Dibuja los cursores de los colaboradores en tiempo real encima del canvas.
 * Se posicionan usando coordenadas absolutas sobre el contenedor del ReactFlow.
 */

import React from 'react';
import { useViewport } from '@xyflow/react';

export default function CollaboratorCursors({ collaborators }) {
  const { x, y, zoom } = useViewport();

  const entries = Object.entries(collaborators);
  if (!entries.length) return null;

  return (
    <>
      {entries.map(([userId, collab]) => {
        const screenX = collab.x * zoom + x;
        const screenY = collab.y * zoom + y;
        
        return (
          <div
            key={userId}
            style={{
              position:      'absolute',
              left:          screenX,
              top:           screenY,
              pointerEvents: 'none',
              zIndex:        1000,
              transform:     'translate(-4px, -4px)',
              transition:    'left 0.08s linear, top 0.08s linear',
            }}
          >
          {/* Flecha del cursor */}
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
            <path
              d="M2 2L2 17L6.5 13L9.5 20L11.5 19L8.5 12L15 12L2 2Z"
              fill={collab.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </svg>
          {/* Etiqueta con nombre */}
          <div
            style={{
              position:    'absolute',
              left:        '14px',
              top:         '16px',
              background:  collab.color,
              color:       '#ffffff',
              fontSize:    '11px',
              fontWeight:  '600',
              padding:     '2px 7px',
              borderRadius:'10px',
              whiteSpace:  'nowrap',
              boxShadow:   '0 2px 8px rgba(0,0,0,0.25)',
              fontFamily:  'Inter, system-ui, sans-serif',
            }}
          >
            {collab.username}
          </div>
        </div>
        );
      })}
    </>
  );
}
