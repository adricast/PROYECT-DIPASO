import React, { useState } from "react";
import OptionCard from "../../components/layout/optioncardLayout";
import { FaFileInvoiceDollar, FaPrint, FaUndoAlt, FaGift } from "react-icons/fa";
 // íconos de Inventario y Transferencia
import "../../pages/styles/generalPage.scss";  // estilos específicos de la página

const BillingPage: React.FC = () => {
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
      <h1>Facturacion</h1>
      <div className="options-grid">
       <OptionCard
        label="Facturar"
        icon={<FaFileInvoiceDollar size={30} />} // Ícono de factura
        color="#4f46e5"
        onClick={() => handleOptionClick("Facturar")}
        />

        <OptionCard
        label="Reimprimir Factura"
        icon={<FaPrint size={30} />} // Ícono de impresión
        color="#059669"
        onClick={() => handleOptionClick("Reimprimir Factura")}
        />

        <OptionCard
        label="Devolución"
        icon={<FaUndoAlt size={30} />} // Ícono de devolución / retroceder
        color="#5b983eff"
        onClick={() => handleOptionClick("Devolucion")}
        />

        <OptionCard
        label="Gift Card"
        icon={<FaGift size={30} />} // Ícono de regalo
        color="#c44b7bff"
        onClick={() => handleOptionClick("Gif Card")}
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

export default BillingPage;
