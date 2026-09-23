import React, { useState } from 'react';
import { Users, UserPlus, Trash2, X, Shield, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjectStore } from '../store/projectStore';
import { useAuthStore } from '../store/authStore';

export default function CollaboratorsModal({ isOpen, onClose, project }) {
  const [identifier, setIdentifier] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const currentUser = useAuthStore((s) => s.user);
  const addCollaborator = useProjectStore((s) => s.addCollaborator);
  const removeCollaborator = useProjectStore((s) => s.removeCollaborator);

  if (!isOpen || !project) return null;

  const isOwner = Boolean(
    currentUser && project.owner
      ? (currentUser.id === project.owner.id || currentUser.email === project.owner.email)
      : project.is_owner
  );
  const collaborators = project.collaborators || [];

  const handleInvite = async (e) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) return;

    setIsSubmitting(true);
    try {
      await addCollaborator(project.id, cleanId);
      toast.success(`Colaborador agregado: ${cleanId}`);
      setIdentifier('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al agregar colaborador';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId, username) => {
    if (!window.confirm(`¿Quitar a ${username} de este proyecto?`)) return;
    setRemovingId(userId);
    try {
      await removeCollaborator(project.id, userId);
      toast.success('Colaborador removido');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Error al remover colaborador';
      toast.error(msg);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '460px',
          maxWidth: '92vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Colaboradores</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{project.name}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Invitar (Solo si es Dueño) */}
        {isOwner ? (
          <form onSubmit={handleInvite} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', fontWeight: 500 }}>
              Invitar nuevo colaborador
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Mail
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="text"
                  className="input-field"
                  placeholder="Email o username (ej. testuser2)"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ paddingLeft: '36px', width: '100%', fontSize: '13px' }}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting || !identifier.trim()}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  fontSize: '13px',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserPlus size={15} />
                {isSubmitting ? '...' : 'Invitar'}
              </button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Se otorgará rol de <strong>Editor</strong> para colaborar en tiempo real.
            </span>
          </form>
        ) : (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '18px',
            }}
          >
            Eres colaborador en este proyecto. Solo el dueño puede invitar a otros miembros.
          </div>
        )}

        {/* Lista de Miembros */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
            Miembros con acceso ({1 + collaborators.length})
          </div>

          {/* Dueño */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                }}
              >
                {project.owner?.username?.[0]?.toUpperCase() || 'D'}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {project.owner?.username || 'Dueño'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {project.owner?.email || ''}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#60a5fa',
                background: 'rgba(59, 130, 246, 0.15)',
                padding: '3px 8px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Shield size={11} /> Dueño
            </span>
          </div>

          {/* Colaboradores */}
          {collaborators.map((collab) => (
            <div
              key={collab.id || collab.user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#10b981',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '13px',
                  }}
                >
                  {collab.user?.username?.[0]?.toUpperCase() || 'C'}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>
                    {collab.user?.username}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {collab.user?.email}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {collab.role === 'editor' ? 'Editor' : 'Visualizador'}
                </span>

                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleRemove(collab.user.id, collab.user.username)}
                    disabled={removingId === collab.user.id}
                    title="Remover colaborador"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                      borderRadius: '6px',
                      padding: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {collaborators.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '20px 10px',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontStyle: 'italic',
              }}
            >
              No hay colaboradores invitados aún.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '7px 16px', fontSize: '13px' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
