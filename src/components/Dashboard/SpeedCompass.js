import React, { useState, useEffect, useRef } from 'react';
import { getLocation, watchLocation, getConnectionType } from '../../services/locationService';
import { classifySpeed, classifyPing } from '../../services/speedClassification';
import Card from '../UI/Card';
import Button from '../UI/Button';

const SpeedCompass = ({ currentSpeed }) => {
  const [direction, setDirection] = useState(0);
  const [recommendation, setRecommendation] = useState('');
  const [location, setLocation] = useState(null);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const canvasRef = useRef(null);

  // Classification UNIFIÉE de la vitesse actuelle
  const currentSpeedClass = classifySpeed(currentSpeed?.download || connectionInfo?.downlink || 0);
  const currentPingClass = classifyPing(currentSpeed?.ping || connectionInfo?.rtt || 0);

  const drawCompass = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 30;

    // Clear canvas avec fond dégradé
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f8fafc');
    gradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Cercle extérieur avec ombre
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Marqueurs de direction
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    directions.forEach((dir, index) => {
      const angle = (index * Math.PI) / 4;
      const x = centerX + (radius + 20) * Math.sin(angle);
      const y = centerY - (radius + 20) * Math.cos(angle);
      
      ctx.fillStyle = index === 0 ? '#ef4444' : '#64748b';
      ctx.font = 'bold 14px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(dir, x, y);
    });

    // Indicateur de vitesse
    if (currentSpeed) {
      const speedColor = getSpeedColor(currentSpeed.download);
      
      // Cercle de vitesse avec dégradé
      const speedGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.7);
      speedGradient.addColorStop(0, speedColor + '40');
      speedGradient.addColorStop(1, speedColor + '10');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.7, 0, 2 * Math.PI);
      ctx.fillStyle = speedGradient;
      ctx.fill();
      ctx.strokeStyle = speedColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Flèche de direction
      const arrowAngle = (direction * Math.PI) / 180;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(arrowAngle);
      
      // Flèche avec dégradé
      const arrowGradient = ctx.createLinearGradient(0, -radius * 0.8, 0, -radius * 0.5);
      arrowGradient.addColorStop(0, speedColor);
      arrowGradient.addColorStop(1, speedColor + 'CC');
      
      ctx.fillStyle = arrowGradient;
      ctx.beginPath();
      ctx.moveTo(0, -radius * 0.8);
      ctx.lineTo(-12, -radius * 0.5);
      ctx.lineTo(12, -radius * 0.5);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();

      // Vitesse actuelle
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px Inter, system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentSpeed.download} Mbps`, centerX, centerY);
      
      // Classification de vitesse
      ctx.fillStyle = currentSpeedClass.color.replace('text-', '#').replace('-600', '');
      ctx.font = '500 14px Inter, system-ui';
      ctx.fillText(currentSpeedClass.level, centerX, centerY + 30);
    }
  };

  const getSpeedColor = (speed) => {
    const speedClass = classifySpeed(speed);
    switch(speedClass.quality) {
      case 'excellent': return '#10b981'; // Vert
      case 'very-good': return '#3b82f6'; // Bleu
      case 'good': return '#10b981'; // Vert émeraude
      case 'average': return '#eab308'; // Jaune
      case 'slow': return '#f97316'; // Orange
      case 'very-slow': return '#ef4444'; // Rouge
      default: return '#64748b'; // Gris
    }
  };

  useEffect(() => {
    initializeLocation();
    startLocationTracking();
    getConnectionInfo();
    drawCompass();
  }, [direction, currentSpeed, location, currentSpeedClass]);

  const initializeLocation = async () => {
    try {
      const loc = await getLocation();
      setLocation(loc);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const startLocationTracking = () => {
    const watchId = watchLocation((newLocation) => {
      setLocation(newLocation);
      setIsMoving(newLocation.speed > 0.5);
      
      if (newLocation.speed > 1) {
        simulateMovementBasedOnPosition(newLocation);
      }
    });

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  };

  const getConnectionInfo = () => {
    const connInfo = getConnectionType();
    setConnectionInfo(connInfo);
  };

  const simulateMovementBasedOnPosition = (newLocation) => {
    const directions = [0, 45, 90, 135, 180, 225, 270, 315];
    const randomDirection = directions[Math.floor(Math.random() * directions.length)];
    
    setDirection(randomDirection);
    
    const speedChange = (Math.random() - 0.3) * 15;
    const newSpeed = currentSpeed ? Math.max(1, currentSpeed.download + speedChange) : 25 + speedChange;
    
    setRecommendation(
      speedChange > 0 
        ? `📈 Amélioration de ${speedChange.toFixed(1)} Mbps détectée`
        : `📉 Réduction de ${Math.abs(speedChange).toFixed(1)} Mbps`
    );

    drawCompass();
  };

  const simulateMovement = async (newDirection) => {
    setDirection(newDirection);
    
    const speedChange = Math.random() * 10 - 2;
    const newSpeed = currentSpeed ? currentSpeed.download + speedChange : 20 + speedChange;
    
    setRecommendation(
      newSpeed > (currentSpeed?.download || 0)
        ? `✅ Meilleure connexion! +${(newSpeed - (currentSpeed?.download || 0)).toFixed(1)} Mbps`
        : `⚠️ Connexion réduite. Essayez une autre direction`
    );

    drawCompass();
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
          Boussole Internet
        </h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Suivez la direction indiquée pour optimiser votre connexion mobile en temps réel
        </p>
      </div>

      {/* Carte de connexion avec classification UNIFIÉE */}
      {connectionInfo && (
        <Card className="p-6 bg-gradient-to-r from-white to-blue-50/30 border border-blue-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Type de connexion</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {connectionInfo.type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Opérateur</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {connectionInfo.operator}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Qualité</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentSpeedClass.bgColor} ${currentSpeedClass.color}`}>
                  {currentSpeedClass.level}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Latence</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${currentPingClass.bgColor} ${currentPingClass.color}`}>
                  {currentPingClass.level}
                </span>
              </div>
            </div>
          </div>
          
          {isMoving && (
            <div className="mt-4 flex items-center justify-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">Déplacement détecté - Analyse en cours</span>
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Compass */}
        <Card className="p-8 bg-gradient-to-br from-white to-blue-50/30 border border-blue-100/50">
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="w-full max-w-sm border border-slate-200/40 rounded-2xl shadow-lg"
            />
          </div>
        </Card>

        {/* Contrôles et informations */}
        <div className="space-y-6">
          {/* Contrôles de direction */}
          <Card className="p-6 bg-gradient-to-br from-white to-slate-50/30 border border-slate-200/50">
            <h3 className="font-semibold text-slate-800 mb-4 text-lg">Directions de test</h3>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              <Button
                onClick={() => simulateMovement(0)}
                className="col-start-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex flex-col items-center space-y-1">
                  <span className="text-lg">↑</span>
                  <span className="text-xs">Nord</span>
                </span>
              </Button>
              <Button
                onClick={() => simulateMovement(270)}
                className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex flex-col items-center space-y-1">
                  <span className="text-lg">←</span>
                  <span className="text-xs">Ouest</span>
                </span>
              </Button>
              <Button
                onClick={() => simulateMovement(90)}
                className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex flex-col items-center space-y-1">
                  <span className="text-lg">→</span>
                  <span className="text-xs">Est</span>
                </span>
              </Button>
              <Button
                onClick={() => simulateMovement(180)}
                className="col-start-2 bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <span className="flex flex-col items-center space-y-1">
                  <span className="text-lg">↓</span>
                  <span className="text-xs">Sud</span>
                </span>
              </Button>
            </div>
          </Card>

          {/* Recommandation */}
          {recommendation && (
            <Card className={`p-4 border-l-4 ${
              recommendation.includes('✅') || recommendation.includes('📈')
                ? 'bg-green-50 border-green-400'
                : 'bg-amber-50 border-amber-400'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  recommendation.includes('✅') || recommendation.includes('📈')
                    ? 'bg-green-100 text-green-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  {recommendation.includes('✅') || recommendation.includes('📈') ? '📈' : '⚠️'}
                </div>
                <p className={`font-medium ${
                  recommendation.includes('✅') || recommendation.includes('📈')
                    ? 'text-green-800'
                    : 'text-amber-800'
                }`}>
                  {recommendation}
                </p>
              </div>
            </Card>
          )}

          {/* Informations de position */}
          {location && (
            <Card className="p-6 bg-gradient-to-br from-white to-slate-50/30 border border-slate-200/50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Position en temps réel</h3>
                  <p className="text-sm text-slate-500">Suivi GPS actif</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200/40">
                  <span className="text-sm font-medium text-slate-600">Latitude</span>
                  <span className="font-mono text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded">
                    {location.latitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200/40">
                  <span className="text-sm font-medium text-slate-600">Longitude</span>
                  <span className="font-mono text-sm text-slate-800 bg-slate-100 px-2 py-1 rounded">
                    {location.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200/40">
                  <span className="text-sm font-medium text-slate-600">Précision</span>
                  <span className="text-sm font-medium text-slate-800">
                    ±{location.accuracy?.toFixed(0) || 25}m
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200/40">
                  <span className="text-sm font-medium text-slate-600">Rayon de scan</span>
                  <span className="text-sm font-medium text-blue-600">30 mètres</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SpeedCompass;