import React, { useState } from "react";
import OptionCard from "../../components/layout/optioncardLayout";
import {  FaTachometerAlt,  FaFileAlt,   FaChartLine } from "react-icons/fa";
 // íconos de Inventario y Transferencia
import "../../pages/styles/generalPage.scss";  // estilos específicos de la página

const ReportPage: React.FC = () => {
  const [modalContent, setModalContent] = useState<string | null>(null);

  const handleOptionClick = (option: string) => {
    // actualmente solo muestra modal con mensaje
    setModalContent(option);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="page-container">
      <h1>Reportes</h1>
      <div className="options-grid">
      <OptionCard
        label="Dashboard"
        icon={<FaTachometerAlt size={30} />} // Ícono de dashboard
        color="#4f46e5"
        onClick={() => handleOptionClick("Dashboard")}
        />

        <OptionCard
        label="Reportes"
        icon={<FaFileAlt size={30} />} // Ícono de reportes/documento
        color="#059669"
        onClick={() => handleOptionClick("Reportes")}
        />

        <OptionCard
        label="Analítica de Ventas"
        icon={<FaChartLine size={30} />} // Ícono de analítica / ventas
        color="#3e6f98"
        onClick={() => handleOptionClick("Analitica de Ventas")}
        />


        
      </div>

      {/* Modal placeholder */}
      {modalContent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{modalContent}</h2>
            <p>Esta opción aún no está disponible.</p>
            <button className="btn" onClick={closeModal}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportPage;
