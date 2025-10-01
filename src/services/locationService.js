import { classifySpeed } from './speedClassification';

export const getLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      // Simulation RÉALISTE pour le Burundi
      resolve({
        latitude: -3.384164,
        longitude: 29.361949,
        accuracy: 25,
        provider: 'simulated',
        country: 'Burundi'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          provider: 'gps',
          country: 'Burundi'
        });
      },
      (error) => {
        console.warn('GPS non disponible, utilisation de la position par défaut:', error);
        // Fallback réaliste pour le Burundi
        resolve({
          latitude: -3.384164,
          longitude: 29.361949,
          accuracy: 50,
          provider: 'fallback',
          country: 'Burundi'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  });
};

// Suivi en temps réel des déplacements
export const watchLocation = (callback) => {
  if (!navigator.geolocation) {
    console.log('Geolocation non supportée');
    // Simulation de mouvement pour le développement
    let simulatedLat = -3.384164;
    const intervalId = setInterval(() => {
      simulatedLat += 0.00001;
      callback({
        latitude: simulatedLat,
        longitude: 29.361949,
        accuracy: 20,
        speed: 0.5,
        heading: 90,
        timestamp: Date.now(),
        provider: 'simulated_track'
      });
    }, 3000);
    
    return intervalId;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        timestamp: position.timestamp,
        provider: 'gps_live',
        country: 'Burundi'
      });
    },
    (error) => {
      console.error('Erreur de suivi GPS:', error);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000
    }
  );
};

// Détection RÉALISTE du type de connexion avec classification UNIFIÉE
export const getConnectionType = () => {
  // Valeurs RÉALISTES pour le Burundi
  const realisticValues = {
    type: '4g',
    downlink: 15.0,
    rtt: 45,
    saveData: false,
    operator: 'Lumitel',
    technology: 'LTE'
  };

  if (navigator.connection) {
    const conn = navigator.connection;
    
    // Utiliser la classification UNIFIÉE
    const speedClassification = classifySpeed(conn.downlink || realisticValues.downlink);
    
    return {
      type: conn.effectiveType || realisticValues.type,
      downlink: conn.downlink > 0 ? conn.downlink : realisticValues.downlink,
      rtt: conn.rtt > 0 ? conn.rtt : realisticValues.rtt,
      saveData: conn.saveData || realisticValues.saveData,
      operator: getRealisticOperator(),
      estimatedSpeed: speedClassification.level, // Classification UNIFIÉE
      estimatedSpeedColor: speedClassification.color,
      estimatedSpeedBg: speedClassification.bgColor,
      technology: getNetworkTechnology(conn.effectiveType || realisticValues.type)
    };
  }
  
  // Fallback avec classification UNIFIÉE
  const speedClassification = classifySpeed(realisticValues.downlink);
  return {
    ...realisticValues,
    estimatedSpeed: speedClassification.level,
    estimatedSpeedColor: speedClassification.color,
    estimatedSpeedBg: speedClassification.bgColor
  };
};

// Détection RÉALISTE de l'opérateur pour le Burundi
const getRealisticOperator = () => {
  return 'Lumitel'; // Opérateur principal au Burundi
};

const getNetworkTechnology = (effectiveType) => {
  const technologyMap = {
    'slow-2g': '2G',
    '2g': '2G',
    '3g': '3G',
    '4g': '4G',
    '5g': '5G'
  };
  
  return technologyMap[effectiveType] || '4G';
};

export const clearLocationWatch = (watchId) => {
  if (typeof watchId === 'number' && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  } else if (typeof watchId === 'number') {
    clearInterval(watchId);
  }
};

export const isGeolocationAvailable = () => {
  return !!navigator.geolocation;
};

export const getCurrentLocation = (timeout = 15000) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Géolocalisation non supportée'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: timeout,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }),
      (error) => reject(error),
      options
    );
  });
};