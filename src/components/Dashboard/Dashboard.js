import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import SpeedCompass from './SpeedCompass';
import SpeedHistory from './SpeedHistory';
import HeatMap from './HeatMap';
import { getSpeedTest } from '../../services/speedTest';
import Button from '../UI/Button';
import Card from '../UI/Card';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Hook de navigation
  const [currentSpeed, setCurrentSpeed] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState('compass');

  const handleSpeedTest = async () => {
    setIsTesting(true);
    try {
      const speed = await getSpeedTest();
      setCurrentSpeed(speed);
    } catch (error) {
      console.error('Error testing speed:', error);
    }
    setIsTesting(false);
  };

  // Fonction simple pour déconnexion + redirection
  const handleLogout = async () => {
    try {
      await logout(); // Déconnexion Firebase
      navigate('/login'); // Redirection vers la page de login
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  useEffect(() => {
    handleSpeedTest();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Header Premium Amélioré */}
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          
          {/* Version Mobile - Informations compactes */}
          <div className="lg:hidden mt-4 pt-4 border-t border-slate-200/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl font-semibold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-semibold text-slate-700 truncate max-w-[150px]">
                    {user?.email || 'Utilisateur'}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-xs text-slate-500">En ligne</p>
                  </div>
                </div>
              </div>
              
              {/* Changement ici : onClick avec handleLogout */}
              <Button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                <span className="flex items-center space-x-1">
                  <span>Deconnexion</span>
                </span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Le reste du contenu reste identique */}
      <div className="container mx-auto px-6 py-8">
        {/* Speed Display Premium */}
        {currentSpeed && (
          <Card className="mb-8 p-8 bg-gradient-to-r from-white to-blue-50/50 border border-blue-100/50 shadow-xl">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
              <div className="text-center lg:text-left">
                <p className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Vitesse actuelle</p>
                <div className="flex items-baseline justify-center lg:justify-start space-x-3">
                  <p className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                    {currentSpeed.download}
                  </p>
                  <span className="text-2xl text-slate-400 font-light">Mbps</span>
                </div>
                <div className="flex items-center justify-center lg:justify-start space-x-4 mt-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">{currentSpeed.ping}ms</span> ping
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold">{currentSpeed.upload} Mbps</span> upload
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSpeedTest}
                disabled={isTesting}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
              >
                <span className="flex items-center space-x-2">
                  {isTesting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>🔄</span>
                  )}
                  <span>{isTesting ? 'Test en cours...' : 'Nouveau test'}</span>
                </span>
              </Button>
            </div>
          </Card>
        )}

        {/* Navigation Tabs Premium */}
        <Card className="mb-8 overflow-hidden border border-slate-200/60 shadow-xl">
          <div className="flex border-b border-slate-200/40 bg-gradient-to-r from-slate-50 to-blue-50/30">
            {[
              { id: 'compass', label: 'Boussole', icon: '🧭', color: 'blue' },
              { id: 'history', label: 'Historique', icon: '📊', color: 'emerald' },
              { id: 'heatmap', label: 'Carte Thermique', icon: '🌡️', color: 'rose' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              const colorClasses = {
                blue: 'from-blue-500 to-indigo-600',
                emerald: 'from-emerald-500 to-teal-600',
                rose: 'from-rose-500 to-pink-600'
              }[tab.color];

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-5 px-6 text-center font-semibold transition-all duration-300 flex items-center justify-center space-x-3 group relative ${
                    isActive
                      ? `text-white bg-gradient-to-r ${colorClasses} shadow-lg`
                      : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <span className={`text-xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {tab.icon}
                  </span>
                  <span className="hidden sm:block">{tab.label}</span>
                  
                  {/* Indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-white/40 rounded-t-full"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-8 bg-white/50 backdrop-blur-sm">
            {activeTab === 'compass' && <SpeedCompass currentSpeed={currentSpeed} />}
            {activeTab === 'history' && <SpeedHistory />}
            {activeTab === 'heatmap' && <HeatMap />}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;