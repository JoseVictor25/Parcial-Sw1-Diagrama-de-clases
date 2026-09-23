import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore(state => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await register(email, username, password);
      toast.success('¡Registro exitoso! Bienvenido al sistema.');
      navigate('/');
    } catch (error) {
      const data = error.response?.data;
      let errMsg = 'Error al registrar usuario.';
      if (data) {
        if (typeof data === 'string') {
          errMsg = data;
        } else if (data.email) {
          errMsg = Array.isArray(data.email) ? data.email.join(' ') : String(data.email);
        } else if (data.username) {
          errMsg = Array.isArray(data.username) ? data.username.join(' ') : String(data.username);
        } else if (data.password) {
          errMsg = Array.isArray(data.password) ? data.password.join(' ') : String(data.password);
        } else if (data.non_field_errors) {
          errMsg = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : String(data.non_field_errors);
        } else if (data.detail) {
          errMsg = data.detail;
        } else {
          const firstKey = Object.keys(data)[0];
          if (firstKey) {
            const val = data[firstKey];
            errMsg = `${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`;
          }
        }
      } else if (error.message) {
        errMsg = `Error de conexión: ${error.message}`;
      }
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '24px' }}>Crear cuenta</h2>
        <p style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Únete para empezar a modelar
        </p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Email</label>
            <input 
              type="email" 
              className="input-field" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Usuario</label>
            <input 
              type="text" 
              className="input-field" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
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
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          ¿Ya tienes cuenta? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
