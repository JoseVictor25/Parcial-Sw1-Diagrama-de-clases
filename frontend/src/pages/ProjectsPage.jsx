import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Folder, LogOut, Trash2, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import CollaboratorsModal from '../components/CollaboratorsModal';
import toast from 'react-hot-toast';

export default function ProjectsPage() {
  const { user, logout } = useAuthStore();
  const { projects, fetchProjects, createProject, deleteProject, loading } = useProjectStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [selectedProjectForCollab, setSelectedProjectForCollab] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    try {
      const proj = await createProject(newProjectName, newProjectDesc);
      setShowModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      toast.success('Proyecto creado');
      navigate(`/project/${proj.id}`);
    } catch (error) {
      toast.error('Error al crear el proyecto');
    }
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    setIsDeleting(true);
    try {
      await deleteProject(projectToDelete.id);
      toast.success('Proyecto eliminado correctamente');
      setProjectToDelete(null);
    } catch (error) {
      toast.error('Error al eliminar el proyecto');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 'bold', fontSize: '18px' }}>
          <Folder size={24} color="var(--primary)" /> UML Tool
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user?.email}</span>
          <button className="btn btn-secondary" onClick={logout} style={{ padding: '6px 12px' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </nav>

      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px' }}>Mis Proyectos</h1>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Proyecto
          </button>
        </div>

        {loading ? (
          <div>Cargando proyectos...</div>
        ) : (
          <div className="projects-grid">
            {projects.map(p => (
              <div 
                key={p.id} 
                className="glass-panel project-card"
                onClick={() => navigate(`/project/${p.id}`)}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', color: 'var(--text-main)', wordBreak: 'break-word', flex: 1 }}>{p.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForCollab(p);
                      }}
                      title="Gestionar colaboradores"
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: 'var(--text-main)',
                      }}
                    >
                      <Users size={14} />
                    </button>
                    {p.is_owner && (
                      <button
                        className="btn btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectToDelete(p);
                        }}
                        title="Eliminar proyecto"
                        style={{
                          padding: '6px 8px',
                          borderRadius: '6px',
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
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', flex: 1 }}>
                  {p.description || 'Sin descripción'}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: p.is_owner ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: p.is_owner ? '#60a5fa' : 'var(--text-muted)',
                    border: p.is_owner ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                  }}>
                    {p.is_owner ? 'Dueño' : 'Colaborador'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProjectForCollab(p);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  >
                    <Users size={14} /> {p.collaborators?.length || 0} cols
                  </button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                No tienes proyectos aún. Crea uno para empezar.
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '32px' }}>
            <h2 style={{ marginBottom: '24px' }}>Crear Proyecto</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nombre</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Descripción</label>
                <textarea 
                  className="input-field" 
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar proyecto */}
      {projectToDelete && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110,
        }}>
          <div className="glass-panel" style={{ width: '420px', padding: '28px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                padding: '10px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
              }}>
                <Trash2 size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-main)', margin: 0 }}>Eliminar Proyecto</h3>
                <span style={{ fontSize: '12px', color: '#f87171' }}>Esta acción es irreversible</span>
              </div>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '24px' }}>
              ¿Estás seguro de que deseas eliminar el proyecto <strong style={{ color: 'var(--text-main)' }}>"{projectToDelete.name}"</strong>?
              Se borrarán permanentemente el diagrama, todas sus clases y relaciones asociadas.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setProjectToDelete(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 size={16} />
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de colaboradores */}
      <CollaboratorsModal
        isOpen={Boolean(selectedProjectForCollab)}
        onClose={() => setSelectedProjectForCollab(null)}
        project={
          selectedProjectForCollab
            ? projects.find((p) => p.id === selectedProjectForCollab.id) || selectedProjectForCollab
            : null
        }
      />
    </div>
  );
}
