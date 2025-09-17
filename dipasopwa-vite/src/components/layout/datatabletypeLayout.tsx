import React from "react";

export interface Action {
  label: string;
  action: (row: Record<string, any>) => void;
  icon?: React.ReactNode;
  className?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

export interface Column {
  key: string;
  label: string;
  width?: string;
}