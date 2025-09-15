// src/components/OptionCard.tsx
import React from "react";
import "../styles/optioncardLayout.scss"; // estilos externos

interface OptionCardProps {
  label: string;
  icon: React.ReactNode;
  color?: string; // color de fondo opcional
  onClick?: () => void;
  disabled?: boolean;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  label,
  icon,
  color = "#4f46e5",
  onClick,
  disabled = false,
}) => {
  return (
    <div
      className={`option-card ${disabled ? "disabled" : ""}`}
      style={{ backgroundColor: color, cursor: disabled ? "not-allowed" : "pointer" }}
      onClick={disabled ? undefined : onClick}
      title={disabled ? "Próximamente" : label}
    >
      {icon}
      <span>{label}</span>
      {disabled && <span className="info">No disponible</span>}
    </div>
  );
};

export default OptionCard;
