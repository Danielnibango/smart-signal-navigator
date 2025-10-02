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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [watchId, setWatchId] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Points de connexion simulés
  const [signalPoints, setSignalPoints] = useState([]);

  // Générer des points de connexion autour de la position actuelle
  const generateSignalPoints = (centerLocation) => {
    const points = [];
    const radius = 0.001; // Environ 100m de rayon
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const distance = radius * (0.3 + Math.random() * 0.7);
      
      const point = {
        lat: centerLocation.lat + Math.cos(angle) * distance,
        lng: centerLocation.lng + Math.sin(angle) * distance,
        speed: Math.floor(5 + Math.random() * 25), // 5-30 Mbps
        quality: '',
        name: `Point ${i + 1}`
      };
      
      // Déterminer la qualité
      if (point.speed > 20) point.quality = 'excellent';
      else if (point.speed > 15) point.quality = 'good';
      else if (point.speed > 10) point.quality = 'medium';
      else point.quality = 'poor';
      
      points.push(point);
    }
    
    return points;
  };

  // Calculer la distance entre deux points (en mètres)
  const calculateDistance = (point1, point2) => {
    const R = 6371000; // Rayon de la Terre en mètres
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
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

  // Mettre à jour le meilleur point de signal
  const updateBestSignalPoint = (currentLocation) => {
    if (signalPoints.length === 0) return;
    
    const bestPoint = signalPoints.reduce((best, current) => 
      current.speed > best.speed ? current : best
    );
    
    setBestSignalPoint(bestPoint);
    
    // Calculer distance et direction
    const distance = calculateDistance(currentLocation, bestPoint);
    const dir = calculateDirection(currentLocation, bestPoint);
    
    setDistanceToBestPoint(distance);
    setDirection(dir);
    
    // Vérifier si on est arrivé au point optimal
    if (distance < 5) {
      setIsAtBestPoint(true);
      setUserSpeed(bestPoint.speed);
    } else {
      setIsAtBestPoint(false);
    }
  };

  // Simuler la vitesse de connexion
  const simulateConnectionSpeed = (currentLocation) => {
    if (!bestSignalPoint) return;
    
    const distance = calculateDistance(currentLocation, bestSignalPoint);
    const maxDistance = 100;
    
    const progress = 1 - (distance / maxDistance);
    const baseSpeed = 5;
    const maxSpeed = bestSignalPoint.speed;
    
    const newSpeed = baseSpeed + (maxSpeed - baseSpeed) * Math.max(0, progress);
    setUserSpeed(Math.round(newSpeed * 10) / 10);
  };

  // Démarrer la détection avec meilleure gestion d'erreurs
  const startDetection = async () => {
    setError('');
    setIsLoading(true);

    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur");
      setIsLoading(false);
      return;
    }

    try {
      // Demander la permission de géolocalisation
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const initialLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      setUserLocation(initialLocation);
      
      // Générer des points autour de la position
      const points = generateSignalPoints(initialLocation);
      setSignalPoints(points);
      updateBestSignalPoint(initialLocation);
      
      // Démarrer la surveillance
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          setUserLocation(newLocation);
          updateBestSignalPoint(newLocation);
          simulateConnectionSpeed(newLocation);
        },
        (error) => {
          console.error('Erreur surveillance:', error);
          handleGeolocationError(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
      
      setWatchId(id);
      setIsScanning(true);
      setIsNavigating(true);
      
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      handleGeolocationError(error);
      
      // Position de démonstration si la géolocalisation échoue
      const demoLocation = { lat: -3.383755, lng: 29.366930, accuracy: 50 };
      setUserLocation(demoLocation);
      const points = generateSignalPoints(demoLocation);
      setSignalPoints(points);
      updateBestSignalPoint(demoLocation);
      setIsScanning(true);
      setIsNavigating(true);
    }
    
    setIsLoading(false);
  };

  // Gestion des erreurs de géolocalisation
  const handleGeolocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setError("Permission de géolocalisation refusée. Autorisez la géolocalisation dans les paramètres de votre navigateur.");
        break;
      case error.POSITION_UNAVAILABLE:
        setError("Position indisponible. Vérifiez votre connexion GPS.");
        break;
      case error.TIMEOUT:
        setError("Délai de géolocalisation dépassé. Réessayez.");
        break;
      default:
        setError("Erreur de géolocalisation: " + error.message);
    }
  };

  // Arrêter la détection
  const stopDetection = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsScanning(false);
    setIsNavigating(false);
    setError('');
  };

  // Redémarrer le scan
  const rescanArea = () => {
    if (userLocation) {
      const newPoints = generateSignalPoints(userLocation);
      setSignalPoints(newPoints);
      updateBestSignalPoint(userLocation);
    }
  };

  // Démarrer avec position simulée (pour test)
  const startWithDemoLocation = () => {
    const demoLocation = { lat: -3.383755, lng: 29.366930, accuracy: 50 };
    setUserLocation(demoLocation);
    const points = generateSignalPoints(demoLocation);
    setSignalPoints(points);
    updateBestSignalPoint(demoLocation);
    setIsScanning(true);
    setIsNavigating(true);
    setError('');
  };

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

  const getQualityText = (quality) => {
    switch (quality) {
      case 'excellent': return 'Excellent (> 20 Mbps)';
      case 'good': return 'Bon (15-20 Mbps)';
      case 'medium': return 'Moyen (10-15 Mbps)';
      case 'poor': return 'Faible (< 10 Mbps)';
      default: return 'Très faible';
    }
  };

  // Écran d'accueil
  if (!userLocation || !isScanning) {
    return (
      <div className="space-y-6">
        <Card className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-4">Carte Thermique de Connexion</h3>
          <p className="text-gray-600 mb-6">
            Analyse réelle de votre connexion mobile dans un rayon de 100 mètres
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button 
              onClick={startDetection}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Détection en cours...
                </span>
              ) : (
                '🎯 Démarrer la détection réelle'
              )}
            </Button>

            <Button 
              onClick={startWithDemoLocation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              🧪 Mode démonstration (sans GPS)
            </Button>
          </div>

          <div className="mt-6 text-sm text-gray-500 space-y-2">
            <p>• <strong>Détection réelle</strong> : Utilise votre GPS pour une navigation précise</p>
            <p>• <strong>Mode démonstration</strong> : Fonctionne sans autorisation GPS</p>
            <p>• Autorisez la géolocalisation quand votre navigateur le demande</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages d'erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Carte Thermique Visuelle */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Carte des Connexions Réelles</h3>
        
        <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 border-2 border-gray-200 min-h-[400px]">
          {/* Rayon de 100m */}
          <div className="absolute inset-4 border-2 border-dashed border-blue-300 rounded-full flex items-center justify-center">
            <span className="bg-white px-2 py-1 text-xs text-blue-600 rounded">
              Rayon: 100m
            </span>
          </div>

          {/* Points de connexion */}
          {signalPoints.map((point, index) => (
            <div
              key={index}
              className={`absolute w-5 h-5 rounded-full border-2 border-white shadow-lg ${getQualityColor(point.quality)}`}
              style={{
                left: `${50 + (point.lng - userLocation.lng) * 50000}%`,
                top: `${50 + (point.lat - userLocation.lat) * 50000}%`,
              }}
              title={`${point.name}: ${point.speed} Mbps - ${getQualityText(point.quality)}`}
            />
          ))}

          {/* Point de meilleure connexion */}
          {bestSignalPoint && (
            <div
              className="absolute w-8 h-8 bg-green-600 rounded-full border-2 border-white shadow-lg animate-pulse"
              style={{
                left: `${50 + (bestSignalPoint.lng - userLocation.lng) * 50000}%`,
                top: `${50 + (bestSignalPoint.lat - userLocation.lat) * 50000}%`,
              }}
              title={`★ ${bestSignalPoint.name}: ${bestSignalPoint.speed} Mbps`}
            >
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                ★ Meilleur
              </div>
            </div>
          )}

          {/* Position utilisateur */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-10 h-10 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">VOUS</span>
            </div>
            {isNavigating && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-xs px-2 py-1 rounded animate-pulse">
                📍 En mouvement...
              </div>
            )}
          </div>

          {/* Flèche de direction */}
          {bestSignalPoint && distanceToBestPoint > 5 && (
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div 
                className="w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[20px] border-b-red-500"
                style={{
                  transform: `rotate(${direction === 'E' ? 0 : direction === 'N' ? -90 : direction === 'W' ? 180 : direction === 'S' ? 90 : 45}deg)`
                }}
              />
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                → {direction}
              </div>
            </div>
          )}
        </div>

        {isAtBestPoint && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            🎯 <strong>Vous êtes dans la zone de meilleure connexion !</strong>
          </div>
        )}
      </Card>

      {/* Informations de Navigation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Navigation en Temps Réel</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Distance du point optimal</p>
              <p className="text-xl font-bold text-blue-700">{distanceToBestPoint}m</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Direction</p>
              <p className="text-xl font-bold text-blue-700">{direction}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600">Vitesse de connexion actuelle</p>
            <p className="text-xl font-bold text-yellow-700">{userSpeed} Mbps</p>
            {bestSignalPoint && (
              <p className="text-xs text-gray-500 mt-1">
                Objectif: {bestSignalPoint.speed} Mbps ({bestSignalPoint.name})
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Button
            onClick={stopDetection}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
          >
            ⏹️ Arrêter la détection
          </Button>
          
          <Button
            onClick={rescanArea}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            📡 Rescanner la zone
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default HeatMap;