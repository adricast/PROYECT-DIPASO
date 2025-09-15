import React, { useState } from "react";
import OptionCard from "../../components/layout/optioncardLayout";
import { FaBox, FaExchangeAlt } from "react-icons/fa"; // íconos de Inventario y Transferencia
import "../../pages/styles/generalPage.scss"; // estilos específicos de la página

const InventoryPage: React.FC = () => {
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
      <h1>Inventario</h1>
      <div className="options-grid">
        <OptionCard
          label="Inventario"
          icon={<FaBox size={30} />}
          color="#4f46e5"
          onClick={() => handleOptionClick("Inventario")}
        />
        <OptionCard
          label="Transferencia de Mercaderia"
          icon={<FaExchangeAlt size={30} />}
          color="#059669"
          onClick={() => handleOptionClick("Transferencia de Mercaderia")}
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

export default InventoryPage;
