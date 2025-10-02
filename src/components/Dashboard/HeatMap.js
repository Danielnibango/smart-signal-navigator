import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const HeatMap = () => {
  const [userLocation, setUserLocation] = useState({ lat: -3.383755, lng: 29.366930 });
  const [bestSignalPoint, setBestSignalPoint] = useState({ 
    lat: -3.383760, 
    lng: 29.366940,
    speed: 28.9,
    name: "Point Optimal"
  });
  const [distanceToBestPoint, setDistanceToBestPoint] = useState(5);
  const [direction, setDirection] = useState('E');
  const [isAtBestPoint, setIsAtBestPoint] = useState(false);
  const [userSpeed, setUserSpeed] = useState(21.7);
  const [isNavigating, setIsNavigating] = useState(false);
  const [scanResults, setScanResults] = useState([]);

  // Points de connexion simulés dans un rayon de 20m
  const connectionPoints = [
    { lat: -3.383750, lng: 29.366925, speed: 15.2, quality: 'medium' },
    { lat: -3.383745, lng: 29.366935, speed: 22.1, quality: 'good' },
    { lat: -3.383760, lng: 29.366940, speed: 28.9, quality: 'excellent' },
    { lat: -3.383770, lng: 29.366920, speed: 9.7, quality: 'poor' },
    { lat: -3.383740, lng: 29.366950, speed: 18.3, quality: 'good' },
  ];

  // Calculer la distance entre deux points
  const calculateDistance = (point1, point2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance);
  };

  // Calculer la direction
  const calculateDirection = (from, to) => {
    const dLng = to.lng - from.lng;
    const dLat = to.lat - from.lat;
    
    const angle = Math.atan2(dLat, dLng) * 180 / Math.PI;
    
    if (angle >= -22.5 && angle < 22.5) return 'E';
    if (angle >= 22.5 && angle < 67.5) return 'NE';
    if (angle >= 67.5 && angle < 112.5) return 'N';
    if (angle >= 112.5 && angle < 157.5) return 'NW';
    if (angle >= 157.5 || angle < -157.5) return 'W';
    if (angle >= -157.5 && angle < -112.5) return 'SW';
    if (angle >= -112.5 && angle < -67.5) return 'S';
    return 'SE';
  };

  // Scanner les points de connexion
  const scanConnections = () => {
    const pointsInRange = connectionPoints.filter(point => 
      calculateDistance(userLocation, point) <= 20
    );
    
    if (pointsInRange.length > 0) {
      const bestPoint = pointsInRange.reduce((best, current) => 
        current.speed > best.speed ? current : best
      );
      setBestSignalPoint(bestPoint);
      setScanResults(pointsInRange);
    }
  };

  // Démarrer la navigation vers le meilleur point
  const startNavigation = () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setIsAtBestPoint(false);
    
    const moveInterval = setInterval(() => {
      setUserLocation(prev => {
        // Calculer le vecteur de direction
        const latDiff = bestSignalPoint.lat - prev.lat;
        const lngDiff = bestSignalPoint.lng - prev.lng;
        
        // Déplacer de 10% vers la cible à chaque intervalle
        const newLat = prev.lat + latDiff * 0.1;
        const newLng = prev.lng + lngDiff * 0.1;
        
        const newLocation = { lat: newLat, lng: newLng };
        const distance = calculateDistance(newLocation, bestSignalPoint);
        
        setDistanceToBestPoint(distance);
        setDirection(calculateDirection(newLocation, bestSignalPoint));
        
        // Mettre à jour la vitesse en fonction de la proximité
        const progress = 1 - (distance / calculateDistance(userLocation, bestSignalPoint));
        const newSpeed = userSpeed + (bestSignalPoint.speed - userSpeed) * progress;
        setUserSpeed(Math.round(newSpeed * 10) / 10);
        
        // Vérifier si arrivé à destination
        if (distance < 2) { // 2 mètres
          setIsAtBestPoint(true);
          setIsNavigating(false);
          setUserSpeed(bestSignalPoint.speed);
          clearInterval(moveInterval);
        }
        
        return newLocation;
      });
    }, 800);
  };

  // Réinitialiser la position
  const resetPosition = () => {
    setUserLocation({ lat: -3.383755, lng: 29.366930 });
    setUserSpeed(21.7);
    setIsAtBestPoint(false);
    setIsNavigating(false);
    setDistanceToBestPoint(5);
    scanConnections();
  };

  useEffect(() => {
    scanConnections();
    const distance = calculateDistance(userLocation, bestSignalPoint);
    setDistanceToBestPoint(distance);
    setDirection(calculateDirection(userLocation, bestSignalPoint));
  }, []);

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  const getQualityText = (quality) => {
    switch (quality) {
      case 'excellent': return 'Excellent (> 20 Mbps)';
      case 'good': return 'Bon (10-20 Mbps)';
      case 'medium': return 'Moyen (5-10 Mbps)';
      case 'poor': return 'Faible (2-5 Mbps)';
      default: return 'Très faible (< 2 Mbps)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Carte Thermique Visuelle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Carte des Connexions</h3>
        
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border-2 border-gray-200 min-h-[300px]">
          {/* Rayon de 20m */}
          <div className="absolute inset-4 border-2 border-dashed border-blue-300 rounded-full flex items-center justify-center">
            <span className="bg-white px-2 py-1 text-xs text-blue-600 rounded">
              Rayon: 20m
            </span>
          </div>

          {/* Points de connexion */}
          {scanResults.map((point, index) => (
            <div
              key={index}
              className={`absolute w-4 h-4 rounded-full border-2 border-white ${getQualityColor(point.quality)}`}
              style={{
                left: `${50 + (point.lng - userLocation.lng) * 10000}%`,
                top: `${50 + (point.lat - userLocation.lat) * 10000}%`,
              }}
              title={`${point.speed} Mbps - ${getQualityText(point.quality)}`}
            />
          ))}

          {/* Point de meilleure connexion */}
          <div
            className="absolute w-6 h-6 bg-green-600 rounded-full border-2 border-white shadow-lg animate-pulse"
            style={{
              left: `${50 + (bestSignalPoint.lng - userLocation.lng) * 10000}%`,
              top: `${50 + (bestSignalPoint.lat - userLocation.lat) * 10000}%`,
            }}
            title={`Point Optimal: ${bestSignalPoint.speed} Mbps`}
          >
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              ★ Meilleur
            </div>
          </div>

          {/* Position utilisateur */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">Vous</span>
            </div>
            {isNavigating && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded animate-bounce">
                🚶 En mouvement...
              </div>
            )}
          </div>

          {/* Ligne de direction */}
          {!isAtBestPoint && (
            <div
              className="absolute h-0.5 bg-red-500 transform origin-left"
              style={{
                width: `${Math.min(distanceToBestPoint * 2, 40)}%`,
                left: '50%',
                top: '50%',
                transform: `rotate(${direction === 'E' ? 0 : direction === 'N' ? -90 : direction === 'W' ? 180 : direction === 'S' ? 90 : 45}deg)`,
              }}
            />
          )}
        </div>

        {/* Légende */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span>Vous</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
            <span>Point Optimal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Excellent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Bon</span>
          </div>
        </div>
      </Card>

      {/* Informations de Navigation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Navigation vers le Point Optimal</h3>
        
        {isAtBestPoint ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎯</span>
              <span className="font-semibold">Vous êtes arrivé au point de meilleure connexion !</span>
            </div>
            <p className="mt-2">Vitesse actuelle: <strong>{userSpeed} Mbps</strong> - Connexion optimale</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Distance restante</p>
                <p className="text-xl font-bold text-blue-700">{distanceToBestPoint}m</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Direction</p>
                <p className="text-xl font-bold text-blue-700">{direction}</p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Vitesse actuelle</p>
              <p className="text-xl font-bold text-yellow-700">{userSpeed} Mbps</p>
              <p className="text-xs text-gray-500 mt-1">
                Objectif: {bestSignalPoint.speed} Mbps ({bestSignalPoint.name})
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-3 mt-4">
          {!isAtBestPoint && !isNavigating && (
            <Button
              onClick={startNavigation}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              🚀 Naviguer vers le point optimal
            </Button>
          )}
          
          <Button
            onClick={resetPosition}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            🔄 Réinitialiser
          </Button>

          <Button
            onClick={scanConnections}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            📡 Rescanner
          </Button>
        </div>
      </Card>

      {/* Statistiques */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Statistiques Réelles</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Moyenne zone</p>
            <p className="text-xl font-bold text-blue-700">17.8 Mbps</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Meilleur point</p>
            <p className="text-xl font-bold text-green-700">28.9 Mbps</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Point faible</p>
            <p className="text-xl font-bold text-red-700">9.7 Mbps</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Points détectés</p>
            <p className="text-xl font-bold text-purple-700">{scanResults.length}/5</p>
          </div>
        </div>
      </Card>

      {/* Qualité de connexion */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🎨 Qualité Réelle</h3>
        <div className="space-y-2">
          {['excellent', 'good', 'medium', 'poor'].map((quality) => (
            <div key={quality} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${getQualityColor(quality)}`}></div>
                <span className="text-sm">{getQualityText(quality)}</span>
              </div>
              <span className="text-xs text-gray-500">
                {scanResults.filter(p => p.quality === quality).length} points
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default HeatMap;