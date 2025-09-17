import React from "react";
import "./../styles/buttonLayout.scss";

interface GenericButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
  className?: string;
}

const GenericButton: React.FC<GenericButtonProps> = ({
  label,
  onClick,
  icon,
  bgColor = "#007bff",
  textColor = "#ffffff",
  disabled = false,
  className = "",
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`generic-button ${className}`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {icon && <span>{icon}</span>}
      <span>{label}</span>
    </button>
  );
};

export default GenericButton;
