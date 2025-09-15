import React, { useState, useEffect } from 'react';
import IndicatorLight from './../components/layout/indicatorlightLayout.tsx';
import { isOnline, onNetworkChange, serverOnline } from './../hooks/sensors/networkSensor';

const NetworkStatusDisplay: React.FC = () => {
  // Inicializamos el estado con el valor real del sensor
  const [isNetworkOnline, setIsNetworkOnline] = useState(isOnline);
  const [isServerAvailable, setIsServerAvailable] = useState(serverOnline);

  useEffect(() => {
    // Escucha el estado de la red del navegador y del servidor
    const unsubscribe = onNetworkChange(
      () => {
        setIsNetworkOnline(true);
      },
      () => {
        setIsNetworkOnline(false);
        setIsServerAvailable(false);
      },
      // ⬅️ Este es el callback para el estado del servidor
      () => {
        setIsServerAvailable(true);
      }
    );

    // La función que se devuelve en useEffect se ejecuta cuando el componente se desmonta
    // o cuando el efecto se vuelve a ejecutar. Llama a la función de desuscripción
    // que nos dio onNetworkChange.
    return () => {
      unsubscribe();
    };
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez.

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