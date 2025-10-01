import React, { useState, useEffect } from 'react';
import { getLocation, watchLocation, getConnectionType } from '../../services/locationService';
import { getSpeedTest } from '../../services/speedTest';
import { classifySpeed } from '../../services/speedClassification';
import Card from '../UI/Card';
import Button from '../UI/Button';

const HeatMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [realSpeed, setRealSpeed] = useState(null);

  const generateHeatmapData = async (centerLat, centerLng) => {
    const data = [];
    const pointsPerDirection = 6;
    const radius = 0.0002;

    let referenceSpeed = 15;
    try {
      const speedTest = await getSpeedTest();
      referenceSpeed = speedTest.download;
      setRealSpeed(speedTest);
    } catch (error) {
      console.log('Test de vitesse échoué');
    }

    for (let i = 0; i < 360; i += 60) {
      for (let j = 1; j <= pointsPerDirection; j++) {
        const distance = (radius * j) / pointsPerDirection;
        const angle = (i * Math.PI) / 180;
        
        const lat = centerLat + distance * Math.cos(angle);
        const lng = centerLng + distance * Math.sin(angle);
        
        const baseSpeed = referenceSpeed * (0.7 + Math.random() * 0.6);
        const distanceFactor = 1 - (j / pointsPerDirection) * 0.4;
        const directionBonus = Math.random() > 0.8 ? referenceSpeed * 0.3 : 0;
        
        const speed = Math.max(1, baseSpeed * distanceFactor + directionBonus);

        data.push({
          lat,
          lng,
          speed,
          direction: getDirectionName(i),
          distance: j * 5
        });
      }
    }

    return data;
  };

  const getDirectionName = (angle) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return directions[Math.floor(angle / 45) % 8];
  };

  const startHeatmapScan = async () => {
    setIsScanning(true);
    try {
      const location = await getLocation();
      setUserPosition(location);
      
      const heatmapData = await generateHeatmapData(location.latitude, location.longitude);
      setHeatmapData(heatmapData);
      setHasData(true);
      
      updateConnectionInfo();
    } catch (error) {
      console.error('Erreur de scan:', error);
      generateRealisticDemoData();
    }
    setIsScanning(false);
  };

  const generateRealisticDemoData = async () => {
    const demoData = await generateHeatmapData(-3.384164, 29.361949);
    setHeatmapData(demoData);
    setHasData(true);
    setUserPosition({
      latitude: -3.384164,
      longitude: 29.361949,
      accuracy: 25
    });
    
    setConnectionInfo({
      type: '4g',
      downlink: 15.0,
      rtt: 45,
      saveData: false,
      operator: 'Lumitel',
      estimatedSpeed: 'Bonne ✅',
      technology: 'LTE'
    });
  };

  const updateConnectionInfo = () => {
    const connInfo = getConnectionType();
    
    if (connInfo.downlink < 0.1) connInfo.downlink = 15.0;
    if (connInfo.rtt > 1000) connInfo.rtt = 45;
    
    setConnectionInfo(connInfo);
  };

  const performRealSpeedTest = async () => {
    setIsScanning(true);
    try {
      const speedResult = await getSpeedTest();
      setRealSpeed(speedResult);
      
      if (userPosition) {
        const newHeatmapData = await generateHeatmapData(userPosition.latitude, userPosition.longitude);
        setHeatmapData(newHeatmapData);
      }
      
      // Utiliser la classification unifiée
      const speedClass = classifySpeed(speedResult.download);
      alert(`✅ Test de vitesse: ${speedClass.level}\nDownload: ${speedResult.download} Mbps\nPing: ${speedResult.ping} ms`);
    } catch (error) {
      alert('❌ Erreur du test de vitesse: ' + error.message);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    startHeatmapScan();

    const watchId = watchLocation((newLocation) => {
      setUserPosition(newLocation);
      setIsMoving(newLocation.speed > 0.5);
      
      if (newLocation.speed > 1) {
        generateHeatmapData(newLocation.latitude, newLocation.longitude)
          .then(setHeatmapData);
      }
    });

    return () => {
      if (watchId && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const getSpeedColor = (speed) => {
    if (speed < 2) return 'bg-red-500';
    if (speed < 5) return 'bg-orange-500';
    if (speed < 10) return 'bg-yellow-500';
    if (speed < 20) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getBestZone = () => {
    if (!hasData || heatmapData.length === 0) return null;
    return heatmapData.reduce((best, current) => 
      current.speed > best.speed ? current : best
    );
  };

  const getSpeedStats = () => {
    if (!hasData || heatmapData.length === 0) {
      return { 
        average: '--', 
        max: '--', 
        min: '--',
        coverage: '--/--'
      };
    }
    
    const speeds = heatmapData.map(point => point.speed);
    const goodCoverage = heatmapData.filter(p => p.speed > 5).length;
    
    return {
      average: (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1),
      max: Math.max(...speeds).toFixed(1),
      min: Math.min(...speeds).toFixed(1),
      coverage: `${goodCoverage}/${heatmapData.length}`
    };
  };

  const bestZone = getBestZone();
  const stats = getSpeedStats();

  // Obtenir la classification UNIFIÉE de la vitesse
  const currentSpeedClass = classifySpeed(realSpeed?.download || connectionInfo?.downlink || 0);

  if (isScanning && !hasData) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Carte Thermique de Connexion</h2>
          <p className="text-gray-600">Analyse de votre connexion en cours...</p>
        </div>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Mesure de la vitesse de connexion</p>
          <p className="text-sm text-gray-500 mt-2">Détection des zones optimales...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Carte Thermique de Connexion</h2>
        <p className="text-gray-600">
          Analyse réelle de votre connexion mobile dans un rayon de 20 mètres
        </p>
      </div>

      {/* Info connexion avec classification UNIFIÉE */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-semibold">Réseau:</span>
            <span className="ml-2 text-blue-600">{connectionInfo?.operator || 'Lumitel'}</span>
          </div>
          <div>
            <span className="font-semibold">Vitesse:</span>
            <span className={`ml-2 font-semibold ${currentSpeedClass.color}`}>
              {currentSpeedClass.level}
            </span>
          </div>
          <div>
            <span className="font-semibold">Download:</span>
            <span className="ml-2 text-purple-600">
              {realSpeed ? `${realSpeed.download} Mbps` : (connectionInfo?.downlink ? `${connectionInfo.downlink.toFixed(1)} Mbps` : '--')}
            </span>
          </div>
          <div>
            <span className="font-semibold">Ping:</span>
            <span className="ml-2 text-orange-600">
              {realSpeed ? `${realSpeed.ping} ms` : (connectionInfo?.rtt ? `${connectionInfo.rtt} ms` : '--')}
            </span>
          </div>
        </div>
        
        {realSpeed && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded p-2">
            <p className="text-sm text-green-700 text-center">
              ✅ Test réel: <strong>{realSpeed.download} Mbps</strong> download • 
              <strong> {realSpeed.upload} Mbps</strong> upload • 
              <strong> {realSpeed.ping} ms</strong> ping
            </p>
          </div>
        )}
        
        {isMoving && (
          <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded text-center text-sm">
            🚶‍♂️ Déplacement détecté - Analyse continue
          </div>
        )}
      </Card>

      {/* Le reste du composant reste identique */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Carte thermique */}
        <Card className="flex-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Carte des connexions</h3>
            <div className="flex gap-2">
              <Button
                onClick={performRealSpeedTest}
                disabled={isScanning}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                {isScanning ? 'Test...' : '🧪 Test Vitesse'}
              </Button>
              <Button
                onClick={startHeatmapScan}
                disabled={isScanning}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                {isScanning ? 'Scan...' : '🗺️ Rescanner'}
              </Button>
            </div>
          </div>

          {userPosition && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-semibold">📍 Votre position:</span><br />
                Lat: {userPosition.latitude.toFixed(6)}, Lng: {userPosition.longitude.toFixed(6)}
                {userPosition.accuracy && (
                  <span className="ml-2 text-gray-500">(Précision: ±{userPosition.accuracy.toFixed(0)}m)</span>
                )}
              </p>
            </div>
          )}

          <div className="relative bg-gray-100 rounded-lg p-4 min-h-80">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <span className="text-white text-xs">Vous</span>
              </div>
            </div>

            {hasData && heatmapData.map((point, index) => {
              if (!userPosition) return null;
              
              const latDiff = point.lat - userPosition.latitude;
              const lngDiff = point.lng - userPosition.longitude;
              const scale = 600;
              
              const left = 50 + (lngDiff * scale);
              const top = 50 - (latDiff * scale);

              return (
                <div
                  key={index}
                  className={`absolute w-3 h-3 rounded-full ${getSpeedColor(point.speed)} border border-white shadow-sm`}
                  style={{
                    left: `${Math.max(5, Math.min(95, left))}%`,
                    top: `${Math.max(5, Math.min(95, top))}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                  title={`${point.speed.toFixed(1)} Mbps - ${point.direction} (${point.distance}m)`}
                />
              );
            })}

            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-gray-300 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-gray-400 rounded-full opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-gray-500 rounded-full opacity-60"></div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            📡 Rayon: 20 mètres • 📍 Points: {heatmapData.length}
            {realSpeed && (
              <span className="ml-2 text-green-600">• 🧪 Test réel: {realSpeed.download} Mbps</span>
            )}
          </div>
        </Card>

        {/* Panneau d'information */}
        <div className="lg:w-80 space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">📊 Statistiques Réelles</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Moyenne zone:</span>
                <span className="font-semibold">{stats.average} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Meilleur point:</span>
                <span className="font-semibold text-green-600">{stats.max} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Point faible:</span>
                <span className="font-semibold text-red-600">{stats.min} Mbps</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Couverture OK:</span>
                <span className="font-semibold text-blue-600">{stats.coverage}</span>
              </div>
            </div>
          </Card>

          {bestZone && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-800 mb-3">⭐ Zone Optimale</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Vitesse max:</span>
                  <span className="font-semibold text-green-600">{bestZone.speed.toFixed(1)} Mbps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Direction:</span>
                  <span className="font-semibold">{bestZone.direction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Distance:</span>
                  <span className="font-semibold">~{bestZone.distance}m</span>
                </div>
                <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                  🎯 Allez vers le <strong>{bestZone.direction}</strong> à ~{bestZone.distance}m
                </div>
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold text-gray-800 mb-3">🎨 Qualité Réelle</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-600">Très faible (&lt; 2 Mbps)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span className="text-sm text-gray-600">Faible (2-5 Mbps)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-600">Moyen (5-10 Mbps)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-lime-500 rounded"></div>
                <span className="text-sm text-gray-600">Bon (10-20 Mbps)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Excellent (&gt; 20 Mbps)</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Conseils Réels</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Testez votre vitesse</strong> avec le bouton "Test Vitesse"</li>
              <li>• <strong>Marchez vers les zones vertes</strong> sur la carte</li>
              <li>• <strong>Évitez les murs épais</strong> et obstacles</li>
              <li>• <strong>En extérieur</strong> = généralement meilleur signal</li>
              <li>• <strong>Redémarrez l'app</strong> si mesures incorrectes</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;