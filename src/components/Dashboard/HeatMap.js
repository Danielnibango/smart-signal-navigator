import React, { useState, useEffect } from 'react';
import Card from '../UI/Card';
import Button from '../UI/Button';

const HeatMap = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [bestSignalPoint, setBestSignalPoint] = useState(null);
  const [distanceToBestPoint, setDistanceToBestPoint] = useState(0);
  const [direction, setDirection] = useState('N');
  const [isAtBestPoint, setIsAtBestPoint] = useState(false);
  const [userSpeed, setUserSpeed] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [signalPoints, setSignalPoints] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [error, setError] = useState('');

  // Générer des points fixes autour d'une position centrale
  const generateSignalPoints = (centerLocation) => {
    return [
      {
        lat: centerLocation.lat + 0.0003,
        lng: centerLocation.lng + 0.0003,
        speed: 28.9,
        quality: 'excellent',
        name: "Point Est"
      },
      {
        lat: centerLocation.lat - 0.0002,
        lng: centerLocation.lng + 0.0004,
        speed: 22.1,
        quality: 'good',
        name: "Point Nord-Est"
      },
      {
        lat: centerLocation.lat - 0.0004,
        lng: centerLocation.lng - 0.0001,
        speed: 15.2,
        quality: 'medium',
        name: "Point Ouest"
      },
      {
        lat: centerLocation.lat + 0.0001,
        lng: centerLocation.lng - 0.0003,
        speed: 9.7,
        quality: 'poor',
        name: "Point Sud"
      }
    ];
  };

  // Calculer la distance entre deux points
  const calculateDistance = (point1, point2) => {
    const R = 6371000;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
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

  // Mettre à jour les informations de navigation
  const updateNavigation = (currentLocation) => {
    if (!bestSignalPoint) return;

    const distance = calculateDistance(currentLocation, bestSignalPoint);
    const dir = calculateDirection(currentLocation, bestSignalPoint);
    
    setDistanceToBestPoint(distance);
    setDirection(dir);

    // Calculer la vitesse simulée basée sur la distance
    const maxDistance = 100;
    const progress = 1 - Math.min(distance / maxDistance, 1);
    const simulatedSpeed = 5 + (bestSignalPoint.speed - 5) * progress;
    setUserSpeed(Math.round(simulatedSpeed * 10) / 10);

    // Vérifier si on est arrivé
    if (distance < 5) {
      setIsAtBestPoint(true);
    } else {
      setIsAtBestPoint(false);
    }
  };

  // Démarrer le tracking de position
  const startRealTimeTracking = () => {
    setError('');
    
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }

    // Demander la position actuelle
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        setUserLocation(initialLocation);
        
        // Générer des points fixes autour de cette position
        const points = generateSignalPoints(initialLocation);
        setSignalPoints(points);
        
        // Trouver le meilleur point
        const bestPoint = points.reduce((best, current) => 
          current.speed > best.speed ? current : best
        );
        setBestSignalPoint(bestPoint);
        
        // Calculer les informations initiales
        updateNavigation(initialLocation);
        
        // Démarrer la surveillance continue
        startWatchingPosition();
      },
      (error) => {
        handleGeolocationError(error);
        // Mode démo avec position par défaut
        startDemoMode();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Démarrer la surveillance continue
  const startWatchingPosition = () => {
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        
        console.log('Nouvelle position:', newLocation);
        setUserLocation(newLocation);
        
        // Mettre à jour la navigation avec la nouvelle position
        if (bestSignalPoint) {
          updateNavigation(newLocation);
        }
      },
      (error) => {
        console.error('Erreur surveillance:', error);
        handleGeolocationError(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 1000
      }
    );
    
    setWatchId(id);
    setIsTracking(true);
  };

  // Gestion des erreurs de géolocalisation
  const handleGeolocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError("Permission de géolocalisation refusée. Autorisez-la dans les paramètres de votre navigateur.");
        break;
      case error.POSITION_UNAVAILABLE:
        setError("Position indisponible. Vérifiez votre connexion internet/GPS.");
        break;
      case error.TIMEOUT:
        setError("Délai de géolocalisation dépassé. Réessayez.");
        break;
      default:
        setError("Erreur de géolocalisation: " + error.message);
    }
  };

  // Mode démonstration (sans géolocalisation)
  const startDemoMode = () => {
    const demoLocation = { lat: -3.383755, lng: 29.366930, accuracy: 50 };
    setUserLocation(demoLocation);
    
    const points = generateSignalPoints(demoLocation);
    setSignalPoints(points);
    
    const bestPoint = points.reduce((best, current) => 
      current.speed > best.speed ? current : best
    );
    setBestSignalPoint(bestPoint);
    updateNavigation(demoLocation);
    
    setIsTracking(true);
    setError("Mode démonstration activé - Déplacez-vous physiquement pour tester (GPS désactivé)");
  };

  // Arrêter le tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Nettoyer à la destruction du composant
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'medium': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      default: return 'bg-red-500';
    }
  };

  // Écran d'accueil
  if (!userLocation || !isTracking) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-4">🎯 Navigation Temps Réel</h3>
        <p className="text-gray-600 mb-6">
          Votre position bougera automatiquement quand vous vous déplacez avec votre appareil
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={startRealTimeTracking}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg w-full"
          >
            📍 Démarrer le tracking GPS réel
          </Button>

          <Button 
            onClick={startDemoMode}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg w-full"
          >
            🧪 Mode démonstration
          </Button>
        </div>

        <div className="mt-6 text-sm text-gray-500 space-y-2 text-left">
          <p>• <strong>Tracking GPS</strong> : Votre point bouge quand vous vous déplacez physiquement</p>
          <p>• <strong>Flèche directionnelle</strong> : Montre la direction vers la meilleure connexion</p>
          <p>• <strong>Points colorés</strong> : Qualité de connexion à différents endroits</p>
          <p>• Autorisez la géolocalisation quand votre navigateur le demande</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Carte Thermique */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {isTracking ? "🎯 Tracking en temps réel" : "Carte des Connexions"}
        </h3>
        
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border-2 border-gray-200 min-h-[400px]">
          {/* Rayon */}
          <div className="absolute inset-4 border-2 border-dashed border-blue-300 rounded-full flex items-center justify-center">
            <span className="bg-white px-2 py-1 text-xs text-blue-600 rounded">
              Rayon: 100m
            </span>
          </div>

          {/* Points de connexion fixes */}
          {signalPoints.map((point, index) => (
            <div
              key={index}
              className={`absolute w-6 h-6 rounded-full border-2 border-white shadow-lg ${getQualityColor(point.quality)}`}
              style={{
                left: `${50 + (point.lng - userLocation.lng) * 100000}%`,
                top: `${50 + (point.lat - userLocation.lat) * 100000}%`,
              }}
              title={`${point.name}: ${point.speed} Mbps`}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white text-xs px-1 py-0.5 rounded shadow text-gray-700 whitespace-nowrap">
                {point.name}
              </div>
            </div>
          ))}

          {/* Point de meilleure connexion (fixe) */}
          {bestSignalPoint && (
            <div
              className="absolute w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg animate-pulse"
              style={{
                left: `${50 + (bestSignalPoint.lng - userLocation.lng) * 100000}%`,
                top: `${50 + (bestSignalPoint.lat - userLocation.lat) * 100000}%`,
              }}
              title={`★ ${bestSignalPoint.name}: ${bestSignalPoint.speed} Mbps`}
            >
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                ★ {bestSignalPoint.speed}Mbps
              </div>
            </div>
          )}

          {/* Position utilisateur (se déplace avec l'appareil) */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">VOUS</span>
              </div>
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                📍 En direct
              </div>
            </div>
          </div>

          {/* Flèche de direction */}
          {bestSignalPoint && distanceToBestPoint > 5 && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-red-500 shadow-lg"
                style={{
                  transform: `rotate(${direction === 'E' ? 0 : direction === 'N' ? -90 : direction === 'W' ? 180 : direction === 'S' ? 90 : 45}deg)`
                }}
              />
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded shadow">
                → {direction}
              </div>
            </div>
          )}
        </div>

        {isAtBestPoint && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-center">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-xl">🎯</span>
              <span className="font-bold">Vous êtes dans la zone de meilleure connexion !</span>
            </div>
          </div>
        )}
      </Card>

      {/* Informations de navigation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations Temps Réel</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Distance du point optimal</p>
            <p className="text-xl font-bold text-blue-700">{distanceToBestPoint}m</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <p className="text-sm text-gray-600">Direction</p>
            <p className="text-xl font-bold text-blue-700">{direction}</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-gray-600">Vitesse de connexion simulée</p>
          <p className="text-xl font-bold text-yellow-700">{userSpeed} Mbps</p>
          {bestSignalPoint && (
            <p className="text-xs text-gray-500 mt-1">
              Objectif: {bestSignalPoint.speed} Mbps à {bestSignalPoint.name}
            </p>
          )}
        </div>

        <Button
          onClick={stopTracking}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg w-full"
        >
          ⏹️ Arrêter le tracking
        </Button>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-green-50">
        <h3 className="text-lg font-semibold text-green-800 mb-3">🚀 Comment ça marche</h3>
        <ul className="space-y-2 text-sm text-green-700">
          <li>• <strong>Déplacez-vous physiquement</strong> avec votre téléphone/ordinateur</li>
          <li>• <strong>Votre point bleu bougera</strong> en temps réel sur la carte</li>
          <li>• <strong>La flèche rouge</strong> vous guide vers la meilleure connexion</li>
          <li>• <strong>La vitesse augmente</strong> quand vous approchez du point vert</li>
          <li>• <strong>Les points sont fixes</strong> - c'est vous qui vous déplacez vers eux</li>
        </ul>
      </Card>
    </div>
  );
};

export default HeatMap;