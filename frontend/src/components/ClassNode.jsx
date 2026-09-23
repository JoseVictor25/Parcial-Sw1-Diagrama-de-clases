import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

export default memo(function ClassNode({ data, selected, id }) {
  const showTypes = data.showDataTypes !== false;
  const isInterface = data.is_interface || data.type === 'interface';
  const isRelationMode = !!data.isRelationMode;
  const isConnectingSource = !!data.isConnectingSource;

  return (
    <div
      className={`staruml-class-node ${isRelationMode ? 'relation-mode-active' : ''}`}
      style={{
        background: '#ffffff',
        border: isConnectingSource
          ? '2px solid #007acc'
          : selected
          ? '1.5px solid #007acc'
          : isRelationMode
          ? '1.5px solid #555555'
          : '1.5px solid #000000',
        borderRadius: '0px',
        width: '100%',
        height: '100%',
        minWidth: '160px',
        minHeight: '40px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: isConnectingSource
          ? '0 0 0 3px rgba(0, 122, 204, 0.5), 2px 2px 0px rgba(0, 0, 0, 0.4)'
          : selected
          ? '0 0 0 2px rgba(0, 122, 204, 0.4), 2px 2px 0px rgba(0, 0, 0, 0.4)'
          : isRelationMode
          ? '0 0 0 1px rgba(0, 122, 204, 0.3), 2px 2px 0px rgba(0, 0, 0, 0.35)'
          : '2px 2px 0px rgba(0, 0, 0, 0.35)',
        color: '#000000',
        fontSize: '11px',
        fontFamily: 'Arial, "Segoe UI", Tahoma, sans-serif',
        userSelect: 'none',
        position: 'relative',
        cursor: isRelationMode ? 'crosshair' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <NodeResizer 
        color="#007acc" 
        isVisible={selected && !isRelationMode} 
        minWidth={160} 
        minHeight={60} 
        handleStyle={{ width: 6, height: 6, border: '1px solid #007acc' }}
        onResizeEnd={() => window.dispatchEvent(new CustomEvent('save-diagram'))}
      />
      {/* ── Indicador si esta clase es el origen seleccionado para conectar ── */}
      {isConnectingSource && (
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#007acc',
            color: '#ffffff',
            fontSize: '9.5px',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 30,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          Origen
        </div>
      )}

      {/* ── Marcadores visuales de anclaje (visibles en modo relación o selección) ── */}
      {(isRelationMode || selected) && (
        <>
          {/* Top Anchor Dot */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: '#007acc',
              border: '1.5px solid #ffffff',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
          {/* Bottom Anchor Dot */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: '#007acc',
              border: '1.5px solid #ffffff',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
          {/* Left Anchor Dot */}
          <div
            style={{
              position: 'absolute',
              left: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              background: '#007acc',
              border: '1.5px solid #ffffff',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
          {/* Right Anchor Dot */}
          <div
            style={{
              position: 'absolute',
              right: '-4px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '8px',
              height: '8px',
              background: '#007acc',
              border: '1.5px solid #ffffff',
              borderRadius: '2px',
              pointerEvents: 'none',
              zIndex: 25,
            }}
          />
        </>
      )}

      {/* ── Handles de Conexión ReactFlow ── */}
      {/* 
        En modo relación (isRelationMode), los handles amplían su área de impacto (hit-area)
        cubriendo los cuadrantes del nodo y extendiéndose 10px fuera de los bordes.
        Esto permite jalar la relación directamente al acercarse o pulsar sobre la clase,
        sin tener que buscar con precisión de píxel la línea exterior.
      */}

      {/* TOP */}
      <Handle
        id="top-source"
        type="source"
        position={Position.Top}
        isConnectable
        style={{
          position: 'absolute',
          top: isRelationMode ? '-10px' : '-4px',
          left: isRelationMode ? '0%' : '50%',
          width: isRelationMode ? '100%' : '12px',
          height: isRelationMode ? '50%' : '8px',
          transform: isRelationMode ? 'none' : 'translateX(-50%)',
          background: isRelationMode ? 'transparent' : (selected ? '#007acc' : '#555555'),
          border: isRelationMode ? 'none' : '1px solid #ffffff',
          borderRadius: '0px',
          zIndex: isRelationMode ? 20 : 5,
          cursor: isRelationMode ? 'crosshair' : 'pointer',
        }}
      />
      <Handle
        id="top-target"
        type="target"
        position={Position.Top}
        isConnectable
        style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          width: '20px',
          height: '10px',
          transform: 'translateX(-50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 4,
        }}
      />

      {/* BOTTOM */}
      <Handle
        id="bottom-source"
        type="source"
        position={Position.Bottom}
        isConnectable
        style={{
          position: 'absolute',
          bottom: isRelationMode ? '-10px' : '-4px',
          left: isRelationMode ? '0%' : '50%',
          width: isRelationMode ? '100%' : '12px',
          height: isRelationMode ? '50%' : '8px',
          transform: isRelationMode ? 'none' : 'translateX(-50%)',
          background: isRelationMode ? 'transparent' : (selected ? '#007acc' : '#555555'),
          border: isRelationMode ? 'none' : '1px solid #ffffff',
          borderRadius: '0px',
          zIndex: isRelationMode ? 20 : 5,
          cursor: isRelationMode ? 'crosshair' : 'pointer',
        }}
      />
      <Handle
        id="bottom-target"
        type="target"
        position={Position.Bottom}
        isConnectable
        style={{
          position: 'absolute',
          bottom: '-6px',
          left: '50%',
          width: '20px',
          height: '10px',
          transform: 'translateX(-50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 4,
        }}
      />

      {/* LEFT */}
      <Handle
        id="left-source"
        type="source"
        position={Position.Left}
        isConnectable
        style={{
          position: 'absolute',
          left: isRelationMode ? '-10px' : '-4px',
          top: isRelationMode ? '0%' : '50%',
          width: isRelationMode ? '35px' : '8px',
          height: isRelationMode ? '100%' : '12px',
          transform: isRelationMode ? 'none' : 'translateY(-50%)',
          background: isRelationMode ? 'transparent' : (selected ? '#007acc' : '#555555'),
          border: isRelationMode ? 'none' : '1px solid #ffffff',
          borderRadius: '0px',
          zIndex: isRelationMode ? 21 : 5,
          cursor: isRelationMode ? 'crosshair' : 'pointer',
        }}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        isConnectable
        style={{
          position: 'absolute',
          left: '-6px',
          top: '50%',
          width: '10px',
          height: '20px',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 4,
        }}
      />

      {/* RIGHT */}
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        isConnectable
        style={{
          position: 'absolute',
          right: isRelationMode ? '-10px' : '-4px',
          top: isRelationMode ? '0%' : '50%',
          width: isRelationMode ? '35px' : '8px',
          height: isRelationMode ? '100%' : '12px',
          transform: isRelationMode ? 'none' : 'translateY(-50%)',
          background: isRelationMode ? 'transparent' : (selected ? '#007acc' : '#555555'),
          border: isRelationMode ? 'none' : '1px solid #ffffff',
          borderRadius: '0px',
          zIndex: isRelationMode ? 21 : 5,
          cursor: isRelationMode ? 'crosshair' : 'pointer',
        }}
      />
      <Handle
        id="right-target"
        type="target"
        position={Position.Right}
        isConnectable
        style={{
          position: 'absolute',
          right: '-6px',
          top: '50%',
          width: '10px',
          height: '20px',
          transform: 'translateY(-50%)',
          background: 'transparent',
          border: 'none',
          zIndex: 4,
        }}
      />

      {/* ── CONECTOR CENTRAL (Jalado desde el centro de la clase) ── */}
      <Handle
        id="center-target"
        type="target"
        position={Position.Top}
        isConnectable
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70px',
          height: '50px',
          background: 'transparent',
          border: 'none',
          borderRadius: '0px',
          zIndex: 34,
          pointerEvents: 'all',
        }}
      />

      <Handle
        id="center-source"
        type="source"
        position={Position.Top}
        isConnectable
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: isRelationMode ? '85%' : '40px',
          height: isRelationMode ? '85%' : '40px',
          borderRadius: isRelationMode ? '4px' : '50%',
          background: 'transparent',
          border: 'none',
          zIndex: 35,
          cursor: 'crosshair',
        }}
        title="Jalar relación desde el centro de la clase"
      />

      {/* ── Compartimiento 1: Nombre de Clase ── */}
      <div
        style={{
          padding: '6px 8px',
          borderBottom: '1px solid #000000',
          textAlign: 'center',
          background: '#ffffff',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}
      >
        {isInterface && (
          <div style={{ fontSize: '10px', color: '#444444', fontStyle: 'italic', lineHeight: '1.2' }}>
            «interface»
          </div>
        )}
        {data.is_abstract && !isInterface && (
          <div style={{ fontSize: '10px', color: '#444444', fontStyle: 'italic', lineHeight: '1.2' }}>
            «abstract»
          </div>
        )}
        <div
          style={{
            fontWeight: 'bold',
            fontSize: '12px',
            color: '#000000',
            fontStyle: data.is_abstract ? 'italic' : 'normal',
            letterSpacing: '0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.name || 'Clase'}
        </div>
      </div>

      {/* ── Compartimiento 2: Atributos ── */}
      <div
        style={{
          padding: data.attributes && data.attributes.length > 0 ? '5px 8px' : '2px 8px',
          borderBottom: '1px solid #000000',
          minHeight: '16px',
          background: '#ffffff',
          fontSize: '11px',
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        {data.attributes && data.attributes.length > 0 ? (
          data.attributes.map((attr, idx) => (
            <div
              key={attr.id ?? idx}
              style={{
                color: '#111111',
                lineHeight: '1.5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{attr.visibility || '+'}</span>
              {' '}
              <span>{attr.name}</span>
              {showTypes && attr.data_type && (
                <span style={{ color: '#222222' }}>: {attr.data_type}</span>
              )}
            </div>
          ))
        ) : null}
      </div>

      {/* ── Compartimiento 3: Operaciones / Métodos ── */}
      <div
        style={{
          padding: data.methods && data.methods.length > 0 ? '5px 8px' : '2px 8px',
          minHeight: '16px',
          background: '#ffffff',
          fontSize: '11px',
          position: 'relative',
          zIndex: 1,
          flexGrow: 1,
          overflow: 'hidden',
        }}
      >
        {data.methods && data.methods.length > 0 ? (
          data.methods.map((meth, idx) => (
            <div
              key={meth.id ?? idx}
              style={{
                color: '#111111',
                lineHeight: '1.5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              <span style={{ fontWeight: 'bold' }}>{meth.visibility || '+'}</span>
              {' '}
              <span>{meth.name}()</span>
              {meth.return_type && (
                <span style={{ color: '#222222' }}>: {meth.return_type}</span>
              )}
            </div>
          ))
        ) : null}
      </div>
    </div>
  );
});
