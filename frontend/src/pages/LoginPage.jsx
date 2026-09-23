import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada correctamente');
      navigate('/');
    } catch (error) {
      let msg = 'Credenciales incorrectas. Verifica tu email/usuario y contraseña.';
      if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      } else if (error.message) {
        msg = `Error de conexión: ${error.message}`;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '24px' }}>UML Tool</h2>
        <p style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Inicia sesión en tu cuenta
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email o Usuario</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="ej: admin@admin.com o admin"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              marginTop: '8px', 
              padding: '12px',
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>


        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿No tienes una cuenta? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Regístrate</Link>
        </p>
      </div>
    </div>
  );
}
