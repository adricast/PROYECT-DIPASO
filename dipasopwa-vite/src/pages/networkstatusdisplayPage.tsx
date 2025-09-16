import React, { useState, useEffect } from 'react';
import IndicatorLight from '../components/layout/indicatorlight2ledLayout.tsx';
import { isOnline, onNetworkChange, serverOnline } from './../hooks/sensors/networkSensor';

const NetworkStatusDisplay: React.FC = () => {
  // Estado inicial según sensor
  const [isNetworkOnline, setIsNetworkOnline] = useState(isOnline);
  const [isServerAvailable, setIsServerAvailable] = useState(serverOnline);

  useEffect(() => {
    // Escuchamos ambos sensores de forma separada
    const unsubscribe = onNetworkChange(
      // Internet callbacks
      () => setIsNetworkOnline(true),
      () => setIsNetworkOnline(false),

      // Servidor callbacks
      () => setIsServerAvailable(true),
      () => setIsServerAvailable(false)
    );

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="network-status-display-container">
      {/* Foco de Internet */}
      <IndicatorLight
        status={isNetworkOnline}
        label={isNetworkOnline ? 'Conectado a Internet' : 'Sin conexión'}
      />

      {/* Foco de Backend */}
      <IndicatorLight
        status={isServerAvailable}
        label={isServerAvailable ? 'Servidor disponible' : 'Servidor inaccesible'}
      />
    </div>
  );
};

export default NetworkStatusDisplay;
