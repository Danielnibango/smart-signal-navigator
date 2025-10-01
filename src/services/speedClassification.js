// Service unifié pour la classification de la vitesse
export const classifySpeed = (downloadSpeed) => {
  // SEUILS UNIFIÉS et RÉALISTES
  if (downloadSpeed >= 100) return { 
    level: 'Exceptionnelle 🚀', 
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    quality: 'excellent'
  };
  if (downloadSpeed >= 50) return { 
    level: 'Excellente ⭐', 
    color: 'text-green-600',
    bgColor: 'bg-green-100', 
    borderColor: 'border-green-200',
    quality: 'excellent'
  };
  if (downloadSpeed >= 25) return { 
    level: 'Très bonne 👍', 
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    quality: 'very-good'
  };
  if (downloadSpeed >= 15) return { 
    level: 'Bonne ✅', 
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
    quality: 'good'
  };
  if (downloadSpeed >= 8) return { 
    level: 'Moyenne 📶', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-200',
    quality: 'average'
  };
  if (downloadSpeed >= 3) return { 
    level: 'Lente 🐢', 
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
    quality: 'slow'
  };
  return { 
    level: 'Très lente ❌', 
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200',
    quality: 'very-slow'
  };
};

export const classifyPing = (ping) => {
  if (ping < 30) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (ping < 60) return { level: 'Très bon', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (ping < 100) return { level: 'Bon', color: 'text-emerald-600', bgColor: 'bg-emerald-100' };
  if (ping < 150) return { level: 'Moyen', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  if (ping < 200) return { level: 'Élevé', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  return { level: 'Très élevé', color: 'text-red-600', bgColor: 'bg-red-100' };
};

// Classification pour les tests de vitesse
export const getSpeedQuality = (download, upload, ping) => {
  const downloadClass = classifySpeed(download);
  const pingClass = classifyPing(ping);
  
  return {
    download: downloadClass,
    upload: classifySpeed(upload),
    ping: pingClass,
    overall: downloadClass.quality // Utilise la qualité du download comme référence globale
  };
};