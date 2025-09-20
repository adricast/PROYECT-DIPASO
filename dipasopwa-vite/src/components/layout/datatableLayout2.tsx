import { useState } from 'react';
import { DataTable, type DataTableRowEditCompleteEvent } from 'primereact/datatable';
import { Column,type ColumnEditorOptions } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from "react-icons/fa";

// Estilos de PrimeReact
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

// Interfaces para tipado
interface TableItem {
  id: string | number;
  [key: string]: any;
}

interface TableColumn {
  field: string;
  header: string;
}

interface ReusableDataTableProps {
  data: TableItem[];
  columns: TableColumn[];
  onSave: (item: TableItem) => void;
  onDelete: (id: string | number) => void;
  onBulkDelete: (ids: (string | number)[]) => void;
  title?: string;
}

const ReusableDataTable = ({ data, columns, onSave, onDelete, onBulkDelete, title }: ReusableDataTableProps) => {
  const [selectedItems, setSelectedItems] = useState<TableItem[]>([]);
  const [editingItem, setEditingItem] = useState<TableItem | null>(null);

  // La función onRowEditComplete maneja el evento nativo de la tabla.
  const onRowEditComplete = (e: DataTableRowEditCompleteEvent) => {
    onSave(e.newData as TableItem);
    setEditingItem(null);
  };

// La lógica del cuerpo de la acción ahora es más simple y directa
const actionBodyTemplate = (rowData: TableItem) => {
  const isEditing = editingItem && editingItem.id === rowData.id;

  return (
    <div className="flex justify-center gap-3">
      {isEditing ? (
        <>
          <Button
            // ✅ Correct: Use the className prop for all Tailwind styles
            className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            icon="pi pi-save"
            rounded
            unstyled // Adds this prop
            onClick={() => {
              if (editingItem) {
                onSave(editingItem);
                setEditingItem(null);
              }
            }}
            tooltip="Guardar"
          />
          <Button
            className="bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            icon="pi pi-times"
            rounded
            unstyled // Adds this prop
            onClick={() => setEditingItem(null)}
            tooltip="Cancelar"
          />
        </>
      ) : (
        <>
          <Button
            className="bg-blue-500 hover:bg-blue-600 text-blue shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            icon="pi pi-pencil"
            rounded
            unstyled // Adds this prop
            onClick={() => setEditingItem(rowData)}
            tooltip="Editar"
          />
          <Button
            className="bg-red-500 hover:bg-red-600 text-red shadow-md hover:shadow-lg transition-all duration-200 ease-in-out transform hover:scale-105"
            icon="pi pi-trash"
            rounded
            unstyled // Adds this prop
            onClick={() => confirmDelete(rowData.id)}
            tooltip="Eliminar"
          />
        </>
      )}
    </div>
  );
};
const confirmDelete = (id: string | number) => {
confirmDialog({
message: '¿Estás seguro de que quieres eliminar este elemento?',
// ❌ Incorrecto: `headerClassName` no existe en confirmDialog
// headerClassName: 'bg-red-500 text-white font-bold',

// ✅ Correcto: Pasa un elemento JSX con clases de Tailwind
header: (
<div className="bg-red-500 text-white font-bold p-4 rounded-t-lg flex items-center gap-2">
<i className="pi pi-exclamation-triangle text-white"></i>
<span>Confirmación de eliminación</span>
</div>
),

// La propiedad `icon` ya no es necesaria aquí, se incluyó en el nuevo header
icon: '', // Limpia la propiedad icon para evitar duplicados

acceptClassName: 'bg-red-600 hover:bg-red-700 text-white p-button-sm',
rejectClassName: 'bg-gray-400 hover:bg-gray-500 text-gray-800 p-button-sm mr-2',
accept: () => onDelete(id),
reject: () => {},
});
};
const headerTemplate = () => {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2 mb-2 p-3 bg-blue-100 rounded-lg shadow-md">
      <h2 className="text-xl font-bold">{title || 'Datos'}</h2>

      {selectedItems.length > 0 && (
        <Button
          label={`Eliminar (${selectedItems.length})`}
          icon="pi pi-trash"       // ✅ PrimeIcon hereda color
          severity="danger"        // ✅ Rojo con fondo
          className="shadow-md hover:scale-105 transition-transform duration-200"
          onClick={confirmBulkDelete}
        />
      )}
    </div>
  );
};

const confirmBulkDelete = () => {
  confirmDialog({
    message: `¿Estás seguro de que quieres eliminar los ${selectedItems.length} elementos seleccionados?`,
    header: 'Confirmación de eliminación masiva',
    icon: 'pi pi-exclamation-triangle',
    acceptClassName: 'p-button-danger shadow-md hover:scale-105 transition-transform duration-200',
    rejectClassName: 'p-button-secondary shadow-md hover:scale-105 transition-transform duration-200',
    acceptLabel: 'Eliminar',
    rejectLabel: 'Cancelar',
    accept: () => {
      onBulkDelete(selectedItems.map((item) => item.id));
      setSelectedItems([]);
    },
  });
};

return (
  <div className="card shadow-lg rounded-xl overflow-hidden p-4 bg-white">
    <DataTable
      value={data}
      editMode="row"
      onRowEditChange={(e) => setEditingItem(e.data as TableItem)}
      onRowEditComplete={onRowEditComplete}
      selectionMode="multiple"
      selection={selectedItems}
      onSelectionChange={(e) => setSelectedItems(e.value)}
      dataKey="id"
      responsiveLayout="scroll"
      header={headerTemplate}
      paginator
      rows={10}
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
      rowsPerPageOptions={[5, 10, 25, 50]}
      className="shadow-md rounded-xl overflow-hidden border border-gray-200 bg-white"
      rowClassName={(data, index) =>
        `transition-all duration-200 ${
          index % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-100"
        }`
      }
      paginatorClassName="shadow-md rounded-md bg-white p-2 flex justify-between items-center"
    >
      {/* Selección múltiple */}
      <Column selectionMode="multiple" headerStyle={{ width: '3em' }}></Column>

      {/* Columnas dinámicas */}
      {columns.map((col) => (
        <Column
          key={col.field}
          field={col.field}
          header={col.header}
          sortable
          editor={(options: ColumnEditorOptions) => (
            <InputText
              type="text"
              value={options.value}
              onChange={(e) => options.editorCallback?.(e.target.value)}
              className="p-inputtext-sm w-full shadow-sm rounded-md"
            />
          )}
        />
      ))}

      {/* Acciones */}
      <Column
        header="Acciones"
        body={actionBodyTemplate}
        style={{ minWidth: '8rem' }}
        exportable={false}
      />
    </DataTable>

    <ConfirmDialog className="shadow-lg rounded-xl" />
  </div>
);


};

export default ReusableDataTable;