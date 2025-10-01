import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard/Dashboard';

// Composant de navigation
const Navigation = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg p-4">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-blue-600">📡 Smart Signal Navigator</h1>
        <div className="flex flex-wrap gap-2 justify-center items-center">
          {user ? (
            <>
              <span className="text-gray-700">Bonjour, {user.email}</span>
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 font-semibold"
              >
                Tableau de bord
              </button>
              <button 
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 font-semibold"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => navigate('/')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition duration-200 font-semibold"
              >
                🏠 Accueil
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition duration-200 font-semibold"
              >
                🔐 Connexion
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition duration-200 font-semibold"
              >
                📝 Inscription
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Composant de lien
const NavLink = ({ to, children, className = "" }) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(to)}
      className={`text-blue-600 hover:text-blue-700 font-semibold underline ${className}`}
    >
      {children}
    </button>
  );
};

// Page d'accueil
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Si l'utilisateur est connecté, rediriger vers le Dashboard
  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-purple-500">
      <Navigation />
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🚀</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Bienvenue !</h1>
          <p className="text-gray-600 mb-6">Optimisez votre connexion WiFi</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/login')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Se connecter
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Créer un compte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page de connexion
const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // 🔥 REDIRECTION DIRECTE VERS LE DASHBOARD
      navigate('/dashboard');
    } catch (error) {
      setError('Échec de la connexion: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500">
      <Navigation />
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Connexion</h1>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Votre mot de passe"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Pas de compte ?{' '}
              <NavLink to="/signup">
                Créer un compte
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Page d'inscription
const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }

    try {
      setError('');
      setLoading(true);
      await signup(formData.email, formData.password);
      // 🔥 REDIRECTION DIRECTE VERS LE DASHBOARD
      navigate('/dashboard');
    } catch (error) {
      setError('Échec de la création du compte: ' + error.message);
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-pink-500">
      <Navigation />
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📝</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Inscription</h1>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="votre@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Créez un mot de passe"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Retapez votre mot de passe"
                required
              />
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer un compte'}
            </button>
          </form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <NavLink to="/login">
                Se connecter
              </NavLink>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant principal App
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;