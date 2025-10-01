export const getSpeedTest = async () => {
  // Simulation réaliste d'un test de vitesse
  return new Promise((resolve) => {
    setTimeout(() => {
      const download = (Math.random() * 50 + 5).toFixed(1); // 5-55 Mbps
      const upload = (Math.random() * 20 + 2).toFixed(1); // 2-22 Mbps
      const ping = Math.floor(Math.random() * 100 + 10); // 10-110 ms
      
      resolve({
        download: parseFloat(download),
        upload: parseFloat(upload),
        ping,
        timestamp: new Date().toISOString()
      });
    }, 2000);
  });
};

export const getNetworkInfo = () => {
  if (navigator.connection) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};