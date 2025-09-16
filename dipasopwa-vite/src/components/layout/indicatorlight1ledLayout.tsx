import React, { useState } from 'react';
import './../styles/indicatorlight1ledLayout.scss';

interface ReusableLightProps {
  status: boolean;           // true = online, false = offline
  comment: string;           // texto del tooltip
  size?: number;             // tamaño del LED
  onlineColor?: string;      // color LED online (default verde)
  offlineColor?: string;     // color LED offline (default rojo)
}

const ReusableLight: React.FC<ReusableLightProps> = ({
  status,
  comment,
  size = 16,
  onlineColor = '#3CB371',
  offlineColor = '#DC143C'
}) => {
  const [hover, setHover] = useState(false);

  return (
    <div 
      className="indicator-light-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div 
        className={`light ${status ? 'online' : 'offline'}`} 
        style={{
          width: size,
          height: size,
          backgroundColor: status ? onlineColor : offlineColor,
          boxShadow: status
            ? `inset -2px -2px 4px rgba(255,255,255,0.6),
               inset 2px 2px 6px rgba(0,0,0,0.4),
               0 0 8px ${onlineColor}80,
               0 0 12px ${onlineColor}60`
            : `inset -2px -2px 4px rgba(255,255,255,0.6),
               inset 2px 2px 6px rgba(0,0,0,0.4),
               0 0 8px ${offlineColor}80,
               0 0 12px ${offlineColor}60`,
        }}
      />
      {hover && (
        <div className="tooltip">
          {comment}
        </div>
      )}
    </div>
  );
};

export default ReusableLight;
