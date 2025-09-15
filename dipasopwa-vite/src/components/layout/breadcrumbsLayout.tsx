    // src/components/layout/Breadcrumbs.tsx
    import React from "react";
    import { useNavigate } from "react-router-dom";
    import "./../styles/breadcrumbsLayout.scss";

    interface BreadcrumbItem {
    label: string;
    url: string;
    }

    interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    activeColor?: string;  // color del breadcrumb activo
    textColor?: string;    // color de los demás
    separator?: string;    // separador entre items
    }

    export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    items,
    activeColor = "#4f46e5",
    textColor = "#2c3e50",
    separator = "→",
    }) => {
    const navigate = useNavigate();

    return (
        <div className="breadcrumbs">
        {items.map((crumb, index) => (
            <span key={crumb.url} className="breadcrumb-item">
            <button
                style={{
                color: index === items.length - 1 ? activeColor : textColor,
                cursor: index === items.length - 1 ? "default" : "pointer",
                }}
                onClick={() => index !== items.length - 1 && navigate(crumb.url)}
            >
                {crumb.label}
            </button>
            {index < items.length - 1 && <span className="separator">{separator}</span>}
            </span>
        ))}
        </div>
    );
    };

    export default Breadcrumbs;
