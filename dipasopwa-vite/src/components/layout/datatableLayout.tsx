// src/components/DataTable.tsx
import React from "react";
import "./../styles/datatableLayout.scss";

export interface Column {
  key: string;
  label: string;
  width?: string; // opcional
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  headerColor?: string;
  rowColor?: string;
  altRowColor?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  headerColor = "#3498db",
  rowColor = "#ffffff",
  altRowColor = "#f5f5f5",
}) => {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead style={{ backgroundColor: headerColor }}>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? rowColor : altRowColor }}>
              {columns.map((col) => (
                <td key={col.key}>{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
