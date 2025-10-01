import { useState, useEffect } from 'react';
import { getSpeedTest } from '../services/speedTest';

export const useSpeedTest = () => {
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const testSpeed = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSpeedTest();
      setSpeed(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSpeed();
  }, []);

  return { speed, loading, error, testSpeed };
};