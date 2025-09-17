import React, { useState, useMemo } from "react";
import "./../styles/datatableLayout.scss";

// Interfaces y tipos
interface Column {
  header: string;
  accessor: string;
  sortable?: boolean;
  renderCell?: (item: Record<string, any>) => React.ReactNode;
}

interface Action {
  label: string;
  icon?: React.ReactNode;
  className?: string;
  action: (item: Record<string, any>) => void;
  isDisabled?: (item: Record<string, any>) => boolean;
  buttonBgColor?: string;
  buttonTextColor?: string;
}
interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  action: (selectedItems: Record<string, any>[]) => void;
  className?: string;
  buttonBgColor?: string;
  buttonTextColor?: string;
}

interface ReusableLightProps {
  status: boolean;
  comment: string;
  size?: number;
  onlineColor?: string;
  offlineColor?: string;
}

export const ReusableLight: React.FC<ReusableLightProps> = ({
  status,
  comment,
  size = 16,
  onlineColor = '#3CB371',
  offlineColor = '#DC143C'
}) => {
  return (
    <div className="indicator-light-container" title={comment}>
      <div
        className={`light ${status ? 'online' : 'offline'}`}
        style={{
          width: size,
          height: size,
          backgroundColor: status ? onlineColor : offlineColor,
          boxShadow: status
            ? `inset -2px -2px 4px rgba(255,255,255,0.6),
               inset 2px 2px 6px rgba(0,0,0,0.4),
               0 0 8px ${onlineColor}80,
               0 0 12px ${onlineColor}60`
            : `inset -2px -2px 4px rgba(255,255,255,0.2),
               inset 2px 2px 6px rgba(0,0,0,0.4)`
        }}
      ></div>
    </div>
  );
};

// Props de la tabla, con colores parametrizables
interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  actions?: Action[];
  headerColor?: string;
  headerTextColor?: string;
  rowColor?: string;
  altRowColor?: string;
  rowTextColor?: string;
  rowsPerPage?: number;
  paginationDotColor?: string;
  paginationDotActiveColor?: string;
  paginationDotTextColor?: string;
  enableSelection?: boolean;
  bulkActions?: BulkAction[];
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  actions,
  headerColor = "#2c3e50",
  headerTextColor = "#ffffff",
  rowColor = "#ffffff",
  altRowColor = "#f9f9f9",
  rowTextColor = "#333333",
  rowsPerPage = 5,
  paginationDotColor = "#bdc3c7",
  paginationDotActiveColor = "#2c3e50",
  paginationDotTextColor = "#ffffff",
  enableSelection = false,
  bulkActions,
}) => {
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRows, setSelectedRows] = useState<Record<string, any>[]>([]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((row) =>
      columns.some((col) =>
        String(row[col.accessor]).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, data, columns]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return sortAsc ? -1 : 1;
      if (a[sortKey] > b[sortKey]) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [sortKey, sortAsc, filteredData]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const pageData = sortedData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, page - Math.floor(maxVisible / 2));
    let end = start + maxVisible - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxVisible + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = [...selectedRows, ...pageData.filter(row => !selectedRows.includes(row))];
      setSelectedRows(newSelected);
    } else {
      const newSelected = selectedRows.filter(row => !pageData.includes(row));
      setSelectedRows(newSelected);
    }
  };

  const handleSelectRow = (row: Record<string, any>) => {
    setSelectedRows(prev => {
      if (prev.includes(row)) {
        return prev.filter(selectedRow => selectedRow.id !== row.id);
      } else {
        return [...prev, row];
      }
    });
  };

  const isAllSelected = pageData.every(row => selectedRows.includes(row));
  const hasSelectedRows = selectedRows.length > 0;

  return (
    <div className="table-wrapper">
      <input
        type="text"
        placeholder="Buscar..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="table-search"
      />
      
      {enableSelection && hasSelectedRows && bulkActions && bulkActions.length > 0 && (
        <div className="bulk-actions-container">
          <span className="selection-count">
            {selectedRows.length} {selectedRows.length === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
          </span>
          {bulkActions.map((action, index) => (
            <button
              key={index}
              onClick={() => action.action(selectedRows)}
              className={action.className}
              style={{
                backgroundColor: action.buttonBgColor,
                color: action.buttonTextColor,
              }}
            >
              {action.icon ? action.icon : action.label}
            </button>
          ))}
        </div>
      )}

      <div className="table-container">
        <table className="data-table">
          <thead style={{ backgroundColor: headerColor, color: headerTextColor }}>
            <tr>
              {enableSelection && (
                <th className="select-header">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor}
                  style={{ width: undefined }}
                  onClick={col.sortable ? () => handleSort(col.accessor) : undefined}
                  className={col.sortable ? "sortable" : undefined}
                >
                  {col.header} {sortKey === col.accessor ? (sortAsc ? "▲" : "▼") : ""}
                </th>
              ))}
              {actions && actions.length > 0 && <th className="actions-header">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIndex) => (
              <tr
                key={row.id}
                style={{
                  backgroundColor: rowIndex % 2 === 0 ? rowColor : altRowColor,
                  color: rowTextColor,
                }}
              >
                {enableSelection && (
                  <td className="select-cell">
                    <input
                      type="checkbox"
                      checked={selectedRows.some(selectedRow => selectedRow.id === row.id)}
                      onChange={() => handleSelectRow(row)}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.accessor}>
                    {col.renderCell ? col.renderCell(row) : row[col.accessor]}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="actions-cell">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => action.action(row)}
                        className={`action-btn ${action.className || ""}`}
                        title={action.label}
                        // Aquí se agregan las propiedades de estilo
                        style={{
                          backgroundColor: action.buttonBgColor,
                          color: action.buttonTextColor,
                        }}
                      >
                        {action.icon ? action.icon : action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination-dots">
        {page > 1 && (
          <span className="arrow" onClick={() => setPage(page - 1)}>
            ‹
          </span>
        )}
        {getPageNumbers().map((num) => (
          <span
            key={num}
            className={`dot ${page === num ? "active" : ""}`}
            onClick={() => setPage(num)}
            style={{
              backgroundColor: page === num ? paginationDotActiveColor : paginationDotColor,
              color: page === num ? paginationDotTextColor : "#333",
            }}
          >
            {num}
          </span>
        ))}
        {page < totalPages && (
          <span className="arrow" onClick={() => setPage(page + 1)}>
            ›
          </span>
        )}
      </div>
    </div>
  );
};

export default DataTable;