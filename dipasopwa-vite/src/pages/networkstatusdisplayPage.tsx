import React, { useState, useEffect } from 'react';
import IndicatorLight from '../components/layout/indicatorlight2ledLayout';
import { onNetworkChange, networkState } from './../hooks/sensors/networkSensor';

const NetworkStatusDisplay: React.FC = () => {
  const [isNetworkOnline, setIsNetworkOnline] = useState(networkState.isOnline);
  const [isServerAvailable, setIsServerAvailable] = useState(networkState.serverOnline);

  useEffect(() => {
    const unsubscribe = onNetworkChange(
      () => setIsNetworkOnline(true),
      () => setIsNetworkOnline(false),
      () => setIsServerAvailable(true),
      () => setIsServerAvailable(false)
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="network-status-display-container">
      <IndicatorLight
        status={isNetworkOnline}
        label={isNetworkOnline ? 'Conectado a Internet' : 'Sin conexión'}
      />
      <IndicatorLight
        status={isServerAvailable}
        label={isServerAvailable ? 'Servidor disponible' : 'Servidor inaccesible'}
      />
    </div>
  );
};

export default NetworkStatusDisplay;
