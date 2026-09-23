import { MousePointer, Box, Circle, HelpCircle } from 'lucide-react';

export default function StarUMLToolbox({
  selectedRelType,
  onSelectRelType,
  onAddClass,
  onAddInterface,
}) {
  const isSelectMode = !selectedRelType || selectedRelType === 'select';

  // Las 5 relaciones UML solicitadas estrictamente
  const relTools = [
    {
      id: 'association',
      label: 'Asociación',
      sublabel: 'Línea simple',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'inheritance',
      label: 'Herencia',
      sublabel: 'Generalización',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.8" />
          <polygon points="14,2 21,7 14,12" stroke="currentColor" strokeWidth="1.5" fill="#1e1e1e" />
        </svg>
      ),
    },
    {
      id: 'composition',
      label: 'Composición',
      sublabel: 'Rombo relleno',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="8" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.8" />
          <polygon points="1,7 5,3 9,7 5,11" stroke="currentColor" strokeWidth="1.2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: 'aggregation',
      label: 'Agregación',
      sublabel: 'Rombo hueco',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="8" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="1.8" />
          <polygon points="1,7 5,3 9,7 5,11" stroke="currentColor" strokeWidth="1.5" fill="#1e1e1e" />
        </svg>
      ),
    },
    {
      id: 'dependency',
      label: 'Dependencia',
      sublabel: 'Línea punteada',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
          <polyline points="9,3 15,7 9,11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'directed_association',
      label: 'Asoc. Dirigida',
      sublabel: 'Línea con flecha',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.8" />
          <polyline points="10,3 16,7 10,11" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 'realization',
      label: 'Realización',
      sublabel: 'Punteada con triángulo',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" />
          <polygon points="14,2 21,7 14,12" stroke="currentColor" strokeWidth="1.5" fill="#1e1e1e" />
        </svg>
      ),
    },
    {
      id: 'association_class',
      label: 'Clase de Asoc.',
      sublabel: 'Línea punteada simple',
      icon: (
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
          <line x1="2" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      ),
    },
  ];

  return (
    <aside
      style={{
        width: '210px',
        minWidth: '210px',
        maxWidth: '210px',
        background: '#1e1e1e',
        borderRight: '1px solid #2d2d30',
        color: '#cccccc',
        display: 'flex',
        flexDirection: 'column',
        fontSize: '12px',
        fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
        userSelect: 'none',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      {/* ── Título del Panel de Herramientas ── */}
      <div
        style={{
          padding: '10px 14px',
          borderBottom: '1px solid #2d2d30',
          background: '#252526',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, color: '#e0e0e0', fontSize: '11px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Herramientas UML
        </span>
        <span style={{ fontSize: '10px', color: '#888888', background: '#333333', padding: '1px 5px', borderRadius: '3px' }}>
          5 Relaciones
        </span>
      </div>

      <div style={{ padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* ── Modo Selección / Puntero ── */}
        <div>
          <button
            onClick={() => onSelectRelType('select')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '7px 10px',
              background: isSelectMode ? '#094771' : '#252526',
              color: isSelectMode ? '#ffffff' : '#cccccc',
              border: isSelectMode ? '1px solid #007acc' : '1px solid #333333',
              borderRadius: '4px',
              fontSize: '11.5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
            }}
            title="Modo selección: mover, editar y seleccionar clases o relaciones"
          >
            <MousePointer size={14} color={isSelectMode ? '#ffffff' : '#4ec9b0'} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: isSelectMode ? 600 : 500 }}>Puntero / Selección</span>
              <span style={{ fontSize: '10px', color: isSelectMode ? '#cce8ff' : '#888888' }}>Mover y editar clases</span>
            </div>
          </button>
        </div>

        {/* ── Sección: Elementos (Clase / Interfaz) ── */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: '#858585',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
              paddingLeft: '2px',
            }}
          >
            Crear Elementos
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {/* Botón Clase */}
            <button
              onClick={() => onAddClass()}
              style={elementBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#252526')}
              title="Añadir una nueva clase al lienzo"
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '3px',
                  background: 'rgba(229, 167, 0, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(229, 167, 0, 0.3)',
                }}
              >
                <Box size={13} color="#e5a700" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontWeight: 500, color: '#e0e0e0', fontSize: '11.5px' }}>+ Clase</span>
                <span style={{ fontSize: '10px', color: '#888888' }}>Con atributos y métodos</span>
              </div>
            </button>

            {/* Botón Interfaz */}
            <button
              onClick={() => onAddInterface ? onAddInterface() : onAddClass({ is_interface: true })}
              style={elementBtnStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2a2d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#252526')}
              title="Añadir una nueva interfaz al lienzo"
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '3px',
                  background: 'rgba(78, 201, 176, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(78, 201, 176, 0.3)',
                }}
              >
                <Circle size={13} color="#4ec9b0" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <span style={{ fontWeight: 500, color: '#e0e0e0', fontSize: '11.5px' }}>+ Interfaz</span>
                <span style={{ fontSize: '10px', color: '#888888' }}>«interface»</span>
              </div>
            </button>
          </div>
        </div>

        {/* ── Sección: Relaciones UML ── */}
        <div>
          <div
            style={{
              fontSize: '10.5px',
              fontWeight: 600,
              color: '#858585',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
              paddingLeft: '2px',
            }}
          >
            Relaciones
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {relTools.map((tool) => {
              const isSelected = selectedRelType === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => onSelectRelType(tool.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 10px',
                    background: isSelected ? '#094771' : '#252526',
                    color: isSelected ? '#ffffff' : '#cccccc',
                    border: isSelected ? '1px solid #007acc' : '1px solid #333333',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#2a2d2e';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#252526';
                  }}
                  title={`Seleccionar relación: ${tool.label}. Luego jala o haz clic entre dos clases.`}
                >
                  <div
                    style={{
                      width: '26px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#569cd6' : '#9cdcfe',
                    }}
                  >
                    {tool.icon}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: '11.5px' }}>
                      {tool.label}
                    </span>
                    <span style={{ fontSize: '9.5px', color: isSelected ? '#cce8ff' : '#777777' }}>
                      {tool.sublabel}
                    </span>
                  </div>

                  {isSelected && (
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#007acc',
                        boxShadow: '0 0 6px #007acc',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Guía de Jalado de Relación Activa ── */}
        {!isSelectMode && (
          <div
            style={{
              marginTop: '4px',
              padding: '10px',
              background: 'rgba(9, 71, 113, 0.25)',
              border: '1px solid #094771',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#cce8ff',
              lineHeight: '1.4',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '3px', color: '#569cd6' }}>
              ✓ Modo Relación Activa
            </div>
            Acércate a una clase y <strong>jala la flecha</strong> hacia otra clase en el lienzo.
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#9cdcfe' }}>
              (O pulsa Esc para volver al puntero)
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

const elementBtnStyle = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '9px',
  padding: '6px 8px',
  background: '#252526',
  border: '1px solid #333333',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};
