import React from 'react';
import Card from '../UI/Card';

const SpeedHistory = () => {
  // Données simulées pour l'historique
  const historyData = [
    { timestamp: 'Aujourd\'hui 10:30', download: 45.2, upload: 12.1, ping: 24, direction: 'Nord' },
    { timestamp: 'Aujourd\'hui 10:25', download: 32.1, upload: 10.5, ping: 31, direction: 'Est' },
    { timestamp: 'Aujourd\'hui 10:20', download: 28.7, upload: 9.8, ping: 35, direction: 'Sud' },
    { timestamp: 'Hier 15:45', download: 52.3, upload: 15.2, ping: 18, direction: 'Nord' },
    { timestamp: 'Hier 15:30', download: 48.6, upload: 14.1, ping: 22, direction: 'Ouest' },
  ];

  const getSpeedColor = (speed) => {
    if (speed < 5) return 'text-red-600';
    if (speed < 25) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Historique des Tests</h2>
        <p className="text-gray-600">
          Suivez vos performances de connexion dans le temps
        </p>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date/Heure</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Download</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Upload</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ping</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Direction</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((test, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">{test.timestamp}</td>
                  <td className={`px-4 py-3 font-semibold text-sm ${getSpeedColor(test.download)}`}>
                    {test.download} Mbps
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.upload} Mbps</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.ping} ms</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{test.direction}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">45.2</div>
          <div className="text-sm text-gray-600">Meilleure vitesse</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">18</div>
          <div className="text-sm text-gray-600">Meilleur ping</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">Nord</div>
          <div className="text-sm text-gray-600">Meilleure direction</div>
        </Card>
      </div>
    </div>
  );
};

export default SpeedHistory;