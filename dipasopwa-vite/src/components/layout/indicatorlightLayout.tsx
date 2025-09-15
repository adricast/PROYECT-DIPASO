import React, { useState } from 'react';
import './../styles/indicatorlightLayout.scss';

interface IndicatorLightProps {
  // true para verde (activo), false para rojo (inactivo)
  status: boolean;
  // El texto a mostrar al hacer clic
  label: string;
}

const IndicatorLight: React.FC<IndicatorLightProps> = ({ status, label }) => {
  const [showLabel, setShowLabel] = useState(false);

  return (
    <div className="indicator-light-container" onClick={() => setShowLabel(!showLabel)}>
      <div className={`light ${status ? 'online' : 'offline'}`} />
      {showLabel && <span className="label">{label}</span>}
    </div>
  );
};

export default IndicatorLight;