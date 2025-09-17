import React, { useState } from 'react';
import './../styles/indicatorlight2ledLayout.scss';

interface IndicatorLightProps {
  status: boolean;   // true = verde, false = rojo
  label: string;     // tooltip
  size?: number;     // tamaño opcional del LED
}

const IndicatorLight: React.FC<IndicatorLightProps> = ({ status, label, size = 16 }) => {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="indicator-light-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div 
        className={`light ${status ? 'online' : 'offline'}`}
        style={{ width: size, height: size }}
      />
      {hover && <div className="tooltip">{label}</div>}
    </div>
  );
};

export default IndicatorLight;
