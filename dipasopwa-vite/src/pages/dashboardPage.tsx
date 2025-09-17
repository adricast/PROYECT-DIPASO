// src/pages/DashboardHome.tsx
import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import "./styles/dashboardPage.scss";

interface DashboardContext {
  userName: string;
  selectedBranch: string;
  branches: { id: string; name: string }[];
}

const DashboardHome: React.FC = () => {
  const [time, setTime] = useState(new Date());
  const { userName, selectedBranch, branches } = useOutletContext<DashboardContext>();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cálculos para el reloj analógico
  const seconds = time.getSeconds();
  const minutes = time.getMinutes();
  const hours = time.getHours();
  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className="widget-container">
      {/* Widget 1: Usuario */}
      <div className="widget widget1">
        <div className="content-img">
          <img
            src="https://www.dropbox.com/scl/fi/1sg0k9814ewulaq4xz97b/desarrollomovil2.png?rlkey=37j08p3etwo0ncgy2nt8jxv11&raw=1"
            alt="Usuario"
            // Corregimos el onError para que use una URL de respaldo si la principal falla
            onError={(e) =>
              (e.currentTarget.src = "https://via.placeholder.com/70")
            }
          />
        </div>
        <div className="content-text"><strong>Usuario:</strong> {userName}</div>
        <div className="content-text"><strong>Rol:</strong> Supervisor</div>
      </div>

      {/* Widget 2: Empresa / Sucursal */}
      <div className="widget widget2">
        <h2 className="widget-title">Empresa Seleccionada</h2>
        <div className="content-text">
          <img
            src="https://www.dropbox.com/scl/fi/1jdub47m018ltwb5bbwak/icon-512x512.png?rlkey=cqgrkq5a000yjn0d6rndcqw0y&raw=1"
            alt="Logo Empresa"
            className="item-img"
          />
          <div><strong>Dipaso</strong></div>
          <div style={{ marginTop: "6px" }}>
            <strong>Sucursal:</strong> {branches.find(b => b.id === selectedBranch)?.name || "Desconocida"}
          </div>
        </div>
      </div>

      {/* Widget 3: Reloj */}
      <div className="widget widget3">
        <div className="clock">
          <div className="center"></div>
          <div className="hand hour" style={{ transform: `rotate(${hourDeg}deg)` }}></div>
          <div className="hand minute" style={{ transform: `rotate(${minuteDeg}deg)` }}></div>
          <div className="hand second" style={{ transform: `rotate(${secondDeg}deg)` }}></div>
        </div>
        <div className="digital-time">
          {time.toLocaleTimeString("es-EC", { hour12: false })}
        </div>
        <div className="digital-date">
          {time.toLocaleDateString("es-EC")}
        </div>
      </div>

      {/* Widget 4: Otro contenido */}
      <div className="widget widget4">
        <h2 className="widget-title">Otro Widget</h2>
        <p className="content-text">Contenido de ejemplo.</p>
      </div>
    </div>
  );
};

export default DashboardHome;
