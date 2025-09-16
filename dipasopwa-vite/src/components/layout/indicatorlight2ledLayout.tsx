import React, { useState } from 'react';
import './../styles/indicatorlight2ledLayout.scss';

interface IndicatorLightProps {
  status: boolean;   // true = verde, false = rojo
  label: string;     // texto que se muestra como tooltip
}

const IndicatorLight: React.FC<IndicatorLightProps> = ({ status, label }) => {
  const [hover, setHover] = useState(false);

  return (
    <div 
      className="indicator-light-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`light ${status ? 'online' : 'offline'}`} />
      
      {hover && (
        <div className="tooltip">
          {label}
        </div>
      )}
    </div>
  );
};

export default IndicatorLight;
