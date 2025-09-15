import React, { useState } from "react";
import OptionCard from "../../components/layout/optioncardLayout";
import { FaCashRegister, FaLock, FaFileInvoice } from "react-icons/fa";
import "../../pages/styles/generalPage.scss"; // estilos específicos de la página

const CashregisterPage: React.FC = () => {
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
      <h1>Caja</h1>
      <div className="options-grid">
        <OptionCard
        label="Apertura Caja"
        icon={<FaCashRegister size={30} />} // Ícono de caja registradora
        color="#4f46e5"
        onClick={() => handleOptionClick("Apertura de Caja")}
        />

        <OptionCard
        label="Cierre de Caja"
        icon={<FaLock size={30} />} // Ícono de candado para cierre
        color="#059669"
        onClick={() => handleOptionClick("Cierre de Caja")}
        />

        <OptionCard
        label="Cuentas por Cobrar"
        icon={<FaFileInvoice size={30} />} // Ícono de facturas
        color="#ac3482ff"
        onClick={() => handleOptionClick("Cuentas por Cobrar")}
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

export default CashregisterPage;
