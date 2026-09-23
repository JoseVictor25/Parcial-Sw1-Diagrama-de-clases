import { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Save, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * HistoryModal — Modal de historial de versiones (CU-08)
 * Props:
 *   isOpen     : boolean
 *   onClose    : () => void
 *   projectId  : string | number
 *   onRestore  : (diagramData) => void  — callback para restaurar en el canvas
 */
export default function HistoryModal({ isOpen, onClose, projectId, onRestore }) {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [saving, setSaving] = useState(false);
  const [label, setLabel] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadSnapshots();
    }
  }, [isOpen, projectId]);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const res = await api.get(`projects/${projectId}/snapshots/`);
      setSnapshots(res.data);
    } catch {
      toast.error('Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!label.trim()) {
      toast.error('Escribe un nombre para este snapshot');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(`projects/${projectId}/snapshots/`, { label: label.trim() });
      setSnapshots(prev => [res.data, ...prev]);
      setLabel('');
      setShowSaveForm(false);
      toast.success('Versión guardada correctamente', { icon: '📸' });
    } catch {
      toast.error('Error al guardar la versión');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (snap) => {
    if (!window.confirm(`¿Restaurar el diagrama a la versión "${snap.label || formatDate(snap.created_at)}"?\n\nEl estado actual se guardará automáticamente como "Antes de restaurar".`)) return;
    setRestoring(snap.id);
    try {
      const res = await api.post(`projects/${projectId}/snapshots/${snap.id}/restore/`);
      if (onRestore && res.data.diagram) {
        onRestore(res.data.diagram);
      }
      toast.success('Diagrama restaurado exitosamente', { icon: '🕐', duration: 3000 });
      await loadSnapshots();
      onClose();
    } catch {
      toast.error('Error al restaurar la versión');
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const getTimeAgo = (isoStr) => {
    try {
      const diff = Date.now() - new Date(isoStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'hace un momento';
      if (mins < 60) return `hace ${mins} min`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `hace ${hours}h`;
      const days = Math.floor(hours / 24);
      return `hace ${days}d`;
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 150,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '520px', maxHeight: '80vh',
        zIndex: 151,
        background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalFadeIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '10px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(14,165,233,0.3)',
            }}>
              <Clock size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '16px', color: '#f1f5f9' }}>
                Historial de Versiones
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {snapshots.length} versión{snapshots.length !== 1 ? 'es' : ''} guardada{snapshots.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSaveForm(!showSaveForm)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: 'none',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff', fontSize: '12px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
              }}
            >
              <Save size={13} /> Guardar versión
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', borderRadius: '6px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Save form */}
        {showSaveForm && (
          <div style={{
            padding: '14px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(14,165,233,0.05)',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                autoFocus
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveSnapshot()}
                placeholder="Nombre de esta versión (ej. 'Versión con patrón Observer')"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(14,165,233,0.3)',
                  color: '#f1f5f9', fontSize: '13px', outline: 'none',
                }}
              />
              <button
                onClick={handleSaveSnapshot}
                disabled={saving}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none',
                  background: saving ? 'rgba(14,165,233,0.2)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                  fontSize: '13px', display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                {saving ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={13} />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
              <div>Cargando historial...</div>
            </div>
          ) : snapshots.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <AlertCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Sin versiones guardadas</div>
              <div style={{ fontSize: '12px', opacity: 0.6 }}>
                Las versiones se crean automáticamente cada vez que guardas el diagrama.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px' }}>
              {snapshots.map((snap, idx) => (
                <div key={snap.id} style={{
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  transition: 'all 0.15s ease',
                  cursor: 'default',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                >
                  {/* Version badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '8px', flexShrink: 0,
                    background: idx === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                    color: idx === 0 ? '#fff' : '#64748b',
                  }}>
                    {idx === 0 ? '★' : `v${snapshots.length - idx}`}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, color: '#e2e8f0',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {snap.label || `Autoguardado ${snapshots.length - idx}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {getTimeAgo(snap.created_at)} · {formatDate(snap.created_at)}
                      {snap.saved_by && <> · <span style={{ color: '#94a3b8' }}>{snap.saved_by.username || snap.saved_by.email}</span></>}
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                      {(snap.diagram_data?.nodes?.length || 0)} clases · {(snap.diagram_data?.edges?.length || 0)} relaciones
                    </div>
                  </div>

                  {/* Restore button */}
                  <button
                    onClick={() => handleRestore(snap)}
                    disabled={restoring === snap.id}
                    title="Restaurar a esta versión"
                    style={{
                      padding: '6px 10px', borderRadius: '7px', border: 'none',
                      background: restoring === snap.id ? 'rgba(14,165,233,0.1)' : 'rgba(14,165,233,0.15)',
                      color: '#38bdf8', cursor: restoring === snap.id ? 'not-allowed' : 'pointer',
                      fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px',
                      flexShrink: 0, fontWeight: 600,
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => { if (!restoring) e.currentTarget.style.background = 'rgba(14,165,233,0.25)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,165,233,0.15)'}
                  >
                    {restoring === snap.id
                      ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                      : <RotateCcw size={13} />
                    }
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <style>{`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translate(-50%, -48%); }
            to   { opacity: 1; transform: translate(-50%, -50%); }
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </>
  );
}
