// src/components/groupmanagement/groupusermanagement.tsx

/**************************************************/
/* COMPONENTE PRINCIPAL DE GESTIÓN DE GRUPOS      */
/**************************************************/
/*
 * Este componente maneja toda la interfaz de usuario
 * y lógica para la gestión de grupos en la aplicación.
 *
 * Incluye:
 * 1. Carga de datos desde IndexedDB o backend.
 * 2. Sincronización con backend (optimistic UI).
 * 3. Manejo de estados de sincronización visualizados con luces LED.
 * 4. CRUD completo: Crear, Editar, Eliminar grupos.
 * 5. Paginación y navegación por teclado (arriba/abajo).
 * 6. Atajos de teclado configurables mediante SHORTCUTS.
 * 7. Integración con sensores de red y sincronización (groupSensor, networkSensor).
 * 8. Diálogos modales reutilizables para edición y confirmación de eliminación.
 *
 * El componente está preparado para funcionar en modo offline-first,
 * usando IndexedDB y optimizando la UI para reflejar cambios locales
 * antes de la confirmación del backend (Optimistic UI).
 */
/**************************************************/

// ✅ CORRECCIÓN 1: Importar los hooks de React que faltaban
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import "./../../styles/group-management.scss";
import type { Group, GroupSyncStatus } from "../../../../entities/api/groupAPI";
import {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
} from "../../../../workers/syncGroupWorker";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import { networkSensor } from "../../../../hooks/sensors/networkSensor";
import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash, FaRotate } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";

/**************************************************/
/* COMPONENTE GROUP MANAGEMENT (con ForwardRef)   */
/**************************************************/
/*
 * ForwardRef permite exponer funciones del componente a
 * un componente padre (ej. abrir modal desde otro lado).
 */
// ✅ CORRECCIÓN 2: Tipar los parámetros "props" y "ref"
const GroupManagement = forwardRef<any, any>((_, ref) => {
    /**************************************************/
    /* ESTADOS PRINCIPALES                            */
    /**************************************************/
    const [groups, setGroups] = useState<Group[]>([]); // Lista de grupos
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null); // Grupo seleccionado
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false); // Modal de creación/edición
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // Modal de confirmación de eliminación
    const [itemToDelete, setItemToDelete] = useState<Group | null>(null); // Grupo marcado para borrar
    const [currentPage, setCurrentPage] = useState(1); // Paginación
    const itemsPerPage = 5;

    /**************************************************/
    /* MAPA DE ESTADOS DE SINCRONIZACIÓN CON COLORES  */
    /**************************************************/
    const statusColors: Record<GroupSyncStatus, { status: boolean; color: string; tooltip: string }> = {
        "synced": { status: true, color: "#32CD32", tooltip: "Sincronizado correctamente." },
        "backend": { status: true, color: "#32CD32", tooltip: "Sincronizado con el backend." },
        "in-progress": { status: true, color: "#FFA500", tooltip: "Sincronizando la acción..." },
        "pending": { status: true, color: "#1E90FF", tooltip: "Pendiente: La acción se sincronizará pronto." },
        "updated": { status: true, color: "#1E90FF", tooltip: "Cambios listos para sincronizar." },
        "failed": { status: false, color: "#FF6347", tooltip: "Error al sincronizar." },
        "deleted": { status: false, color: "#A52A2A", tooltip: "Pendiente de eliminación." },
    };

    /**************************************************/
    /* FUNCIÓN DE CARGA Y REFRESCO DE DATOS           */
    /**************************************************/
    const loadGroups = async () => {
        const data = await getGroups();
        setGroups(data);

        if (selectedGroup) {
            const updatedSelected = data.find(g => g.id === selectedGroup.id);
            setSelectedGroup(updatedSelected || null);
        } else if (data.length > 0) {
            setSelectedGroup(data[0]);
        } else {
            setSelectedGroup(null);
        }
    };

    /**************************************************/
    /* EVENTOS: RED Y SINCRONIZACIÓN                  */
    /**************************************************/
    useEffect(() => {
        loadGroups();

        const handleSyncEvent = () => loadGroups();
        groupSensor.on("item-synced", handleSyncEvent);
        groupSensor.on("itemDeleted", handleSyncEvent);
        groupSensor.on("item-failed", handleSyncEvent);
        groupSensor.on("sync-success", handleSyncEvent);
        groupSensor.on("sync-failure", handleSyncEvent);

        return () => {
            groupSensor.off("item-synced", handleSyncEvent);
            groupSensor.off("itemDeleted", handleSyncEvent);
            groupSensor.off("item-failed", handleSyncEvent);
            groupSensor.off("sync-success", handleSyncEvent);
            groupSensor.off("sync-failure", handleSyncEvent);
        };
    }, []);

    useEffect(() => {
        const handleNetworkOnline = () => {
            console.log("Servidor en línea. Iniciando sincronización de grupos.");
            loadGroups();
        };

        networkSensor.on("server-online", handleNetworkOnline);

        return () => {
            networkSensor.off("server-online", handleNetworkOnline);
        };
    }, []);


    /**************************************************/
    /* CRUD CON OPTIMISTIC UI                         */
    /**************************************************/
    const handleCreateOrUpdateGroup = async (groupName: string, description: string) => {
        if (selectedGroup && selectedGroup.id) {
            // Actualizar
            const updatedGroup = { ...selectedGroup, groupName, description, syncStatus: "updated" as GroupSyncStatus };
            // ✅ CORRECCIÓN 3: Especificar los tipos en las funciones de actualización
            setGroups((prev: Group[]) => prev.map((g: Group) => g.id === updatedGroup.id ? updatedGroup : g));
            setSelectedGroup(updatedGroup);
            await updateGroup(updatedGroup);
        } else {
            // Crear
            const newGroup = { groupName, description, lastModifiedAt: new Date().toISOString() };
            const tempId = new Date().getTime().toString();
            // ✅ CORRECCIÓN 4: Especificar los tipos en las funciones de actualización
            setGroups((prev: Group[]) => [...prev, { ...newGroup, id: tempId, syncStatus: "pending" as GroupSyncStatus, users: [] }]);
            await createGroup(newGroup);
        }
        setIsGroupDialogOpen(false);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        const groupToDelete = { ...itemToDelete, syncStatus: "deleted" as GroupSyncStatus };
        // ✅ CORRECCIÓN 5: Especificar los tipos en las funciones de actualización
        setGroups((prev: Group[]) => prev.map((g: Group) => g.id === groupToDelete.id ? groupToDelete : g));
        await deleteGroup(groupToDelete);
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    /**************************************************/
    /* DIALOGOS                                       */
    /**************************************************/
    const handleOpenGroupDialog = (group: Group | null = null) => {
        if (group && (group.syncStatus === "in-progress" || group.syncStatus === "deleted")) {
            alert("No se puede editar este grupo en su estado actual.");
            return;
        }
        setSelectedGroup(group);
        setIsGroupDialogOpen(true);
    };

    const handleOpenDeleteDialog = (item: Group) => {
        if (item.syncStatus === "in-progress" || item.syncStatus === "deleted") {
            alert("No se puede eliminar este grupo en su estado actual.");
            return;
        }
        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    /**************************************************/
    /* ATAJOS DE TECLADO                              */
    /**************************************************/
    const handleNewFromShortcut = () => handleOpenGroupDialog();
    const handleSaveFromShortcut = () => {
        if (isGroupDialogOpen) {
            const dialog = document.getElementById("group-dialog-form") as HTMLFormElement;
            if (dialog) {
                const groupName = (dialog.querySelector("input[name='groupName']") as HTMLInputElement)?.value;
                const description = (dialog.querySelector("input[name='description']") as HTMLInputElement)?.value;
                if (groupName) handleCreateOrUpdateGroup(groupName, description);
            }
        }
    };
    const handleEditFromShortcut = () => { if (selectedGroup) handleOpenGroupDialog(selectedGroup); };
    const handleDeleteFromShortcut = () => { if (selectedGroup) handleOpenDeleteDialog(selectedGroup); };

    useKeyboardShortcut(SHORTCUTS.NEW_FORM.keys, handleNewFromShortcut);
    useKeyboardShortcut(SHORTCUTS.SAVE_FORM.keys, handleSaveFromShortcut);
    useKeyboardShortcut(SHORTCUTS.DELETE_ITEM.keys, handleDeleteFromShortcut);
    useKeyboardShortcut(SHORTCUTS.EDIT_FORM.keys, handleEditFromShortcut);

    /**************************************************/
    /* FUNCIONES EXTERNAS (REF)                       */
    /**************************************************/
    useImperativeHandle(ref, () => ({
        handleOpenGroupModal: handleOpenGroupDialog,
        handleSaveFromShortcut,
        handleDeleteFromShortcut,
        handleEditFromShortcut,
        isGroupDialogOpen,
        isDeleteDialogOpen,
    }));

    /**************************************************/
    /* PAGINACIÓN                                     */
    /**************************************************/
    const currentGroups = useMemo(() => {
        const indexOfLastGroup = currentPage * itemsPerPage;
        const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
        return groups.slice(indexOfFirstGroup, indexOfLastGroup);
    }, [groups, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(groups.length / itemsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    /**************************************************/
    /* NAVEGACIÓN CON TECLAS                          */
    /**************************************************/
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isGroupDialogOpen || isDeleteDialogOpen) return;
            if (["ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                // ✅ CORRECCIÓN 6: Especificar el tipo del parámetro "g"
                const currentIndex = selectedGroup ? currentGroups.findIndex((g: Group) => g.id === selectedGroup.id) : -1;
                let newIndex = currentIndex;
                if (event.key === "ArrowDown") newIndex = Math.min(currentIndex + 1, currentGroups.length - 1);
                if (event.key === "ArrowUp") newIndex = Math.max(currentIndex - 1, 0);
                if (currentGroups[newIndex]) setSelectedGroup(currentGroups[newIndex]);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentGroups, selectedGroup, isGroupDialogOpen, isDeleteDialogOpen]);

    /**************************************************/
    /* RENDER PRINCIPAL                               */
    /**************************************************/
    return (
        <div className="group-management table-wrapper">
            <div className="header-actions">
                <h2>Gestión de Grupos</h2>
                <button className="add-button action-btn" onClick={() => handleOpenGroupDialog()}>
                    <FaPlus size={16} />
                </button>
                <button className="refresh-button action-btn" onClick={loadGroups}>
                    <FaRotate size={16} />
                </button>
            </div>

            <div className="table-container">
                <div className="groups-list">
                    {/* ✅ CORRECCIÓN 7: Especificar los tipos de "g" y "index" */}
                    {currentGroups.map((g: Group, index: number) => {
                        const isBlocked = g.syncStatus === "in-progress" || g.syncStatus === "deleted";
                        const lightProps = statusColors[g.syncStatus as keyof typeof statusColors] ?? { status: false, tooltip: "" };
                        return (
                            <div
                                key={g.id}
                                className={`group-item ${index % 2 === 0 ? "even" : "odd"} ${selectedGroup?.id === g.id ? "selected" : ""}`}
                                onClick={() => setSelectedGroup(g)}
                            >
                                <div className="item-content">
                                    <ReusableLight
                                        status={lightProps.status}
                                        comment={lightProps.tooltip}
                                        onlineColor={lightProps.color}
                                        offlineColor="#ccc"
                                        size={16}
                                    />
                                    <span className="group-name-text">{g.groupName}</span>
                                </div>
                                <div className="item-actions">
                                    <button
                                        className="edit-button action-btn"
                                        disabled={isBlocked}
                                        onClick={(e) => { e.stopPropagation(); handleOpenGroupDialog(g); }}
                                    >
                                        <MdEdit size={16} />
                                    </button>
                                    <button
                                        className="delete-button action-btn"
                                        disabled={isBlocked}
                                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(g); }}
                                    >
                                        <FaTrash size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Paginación */}
            <div className="pagination-dots">
                {currentPage > 1 && <span className="arrow" onClick={() => paginate(currentPage - 1)}>‹</span>}
                {Array.from({ length: totalPages }, (_, i) => (
                    <span key={i} className={`dot ${currentPage === i + 1 ? "active" : ""}`} onClick={() => paginate(i + 1)}>
                        {i + 1}
                    </span>
                ))}
                {currentPage < totalPages && <span className="arrow" onClick={() => paginate(currentPage + 1)}>›</span>}
            </div>

            {/* Dialogs */}
            <AddEditGroupDialog
                open={isGroupDialogOpen}
                onClose={() => setIsGroupDialogOpen(false)}
                group={selectedGroup}
                onSave={handleCreateOrUpdateGroup}
            />

            <DeleteConfirmationDialog
                open={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={handleDeleteItem}
                item={itemToDelete}
            />
        </div>
    );
});

export default GroupManagement;