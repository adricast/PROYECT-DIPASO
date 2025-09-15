import React from "react";
import { NavLink } from "react-router-dom";
import "./../styles/navLayout.scss";

export interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavProps {
  items: NavItem[];
  vertical?: boolean; // sidebar vertical
}

const Nav: React.FC<NavProps> = ({ items, vertical = true }) => {
  return (
    <nav className={`nav ${vertical ? "vertical" : "horizontal"}`}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <div className="icon">{item.icon}</div>
          <div className="label">{item.label}</div>
        </NavLink>
      ))}
    </nav>
  );
};

export default Nav;
