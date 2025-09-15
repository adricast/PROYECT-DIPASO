import React, { useState } from "react";
import OptionCard from "../../components/layout/optioncardLayout";
import { FaBook, FaShieldAlt } from "react-icons/fa"; // íconos de Inventario y Transferencia
import "../../pages/styles/generalPage.scss";  // estilos específicos de la página

const AuditoryPage: React.FC = () => {
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
      <h1>Auditoria</h1>
      <div className="options-grid">
      <OptionCard
        label="Bitacora"
        icon={<FaBook size={30} />} // Ícono de libro/registro
        color="#4f46e5"
        onClick={() => handleOptionClick("Bitacora")}
        />

        <OptionCard
        label="Auditoría y Seguridad"
        icon={<FaShieldAlt size={30} />} // Ícono de escudo para seguridad
        color="#059669"
        onClick={() => handleOptionClick("Auditoria y Seguridad")}
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

export default AuditoryPage;
