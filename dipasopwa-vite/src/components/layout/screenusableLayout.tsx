import React, { useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";

interface ButtonConfig {
  label: string;
  color?: string;
  textColor?: string;
  onClick: (selectedRows?: any[]) => void;
}

interface TableColumn {
  field: string;
  header: string;
  bodyTemplate?: (row: any) => React.ReactNode;
}

interface ReusableTableProps {
  moduleName: string;
  data: any[];
  rowKey: string;
  columns: TableColumn[];
  buttons?: ButtonConfig[];
  selectableField?: string;
  onRowSelect?: (row: any | null) => void;
  styles?: {
    tableBg?: string;
    headerBg?: string;
    headerText?: string;
    rowHoverBg?: string;
    selectedRowBg?: string;
  };
  selectedRows?: any[];
  setSelectedRows?: (rows: any[]) => void;
}

const ReusableTable: React.FC<ReusableTableProps> = ({
  moduleName,
  data,
  rowKey,
  columns,
  buttons = [],
  selectableField,
  onRowSelect,
  styles = {},
  selectedRows: controlledSelectedRows,
  setSelectedRows: setControlledSelectedRows,
}) => {
  const [selectedRows, setSelectedRows] = useState<any[]>(controlledSelectedRows || []);

  const handleRowClick = (row: any) => {
    if (selectableField && onRowSelect) onRowSelect(row);
  };

  const handleSelectionChange = (e: any) => {
    setSelectedRows(e.value);
    if (setControlledSelectedRows) setControlledSelectedRows(e.value);
    if (onRowSelect) onRowSelect(e.value[0] ?? null);
  };

  return (
    <div className={`p-4 ${styles.tableBg || "bg-white"} rounded-lg shadow`}>
      <h2 className={`text-xl font-bold mb-4 ${styles.headerText || "text-gray-800"}`}>
        {moduleName}
      </h2>

      <div className="flex gap-2 mb-4">
        {buttons.map((btn, idx) => {
          const labelLower = btn.label.toLowerCase();
          const isDelete = labelLower === "eliminar";
          const isEdit = labelLower === "editar";
          const disabled =
            (isDelete && selectedRows.length === 0) ||
            (isEdit && selectedRows.length !== 1);

          return (
            <button
              key={idx}
              onClick={() => btn.onClick(selectedRows)}
              className={`px-4 py-2 rounded-md font-semibold ${btn.color || "bg-blue-500"} ${
                btn.textColor || "text-white"
              }`}
              disabled={disabled}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

  <DataTable
  value={data}
  selection={selectedRows}
  onSelectionChange={(e) => {
    setSelectedRows(e.value);
    if (onRowSelect) onRowSelect(e.value[0] ?? null); // primera fila seleccionada
  }}
  dataKey={rowKey}
  rowHover
  responsiveLayout="scroll"
  onRowClick={(e) => handleRowClick(e.data)}
>
  {/* Columna de checkboxes (usando "multiple") */}
  {selectableField && <Column selectionMode="multiple" headerStyle={{ width: "3em" }} />}

  {/* Columnas normales */}
  {columns.map((col) => (
    <Column
      key={col.field}
      field={col.field}
      header={col.header}
      body={col.bodyTemplate ? (rowData) => col.bodyTemplate!(rowData) : undefined}
      sortable
      style={{ cursor: selectableField ? "pointer" : "default" }}
    />
  ))}
</DataTable>



    </div>
  );
};

export default ReusableTable;
