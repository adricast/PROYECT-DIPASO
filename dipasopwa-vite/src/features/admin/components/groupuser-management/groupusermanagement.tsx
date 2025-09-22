// src/components/groupmanagement/groupusermanagement.tsx

/**************************************************/
/* COMPONENTE PRINCIPAL DE GESTIÓN DE GRUPOS */
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


import { useCallback } from "react";
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react";
import "./../../styles/group-management.scss";
import type { Group, GroupSyncStatus } from "../../../../entities/api/groupAPI";
import {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    syncFromBackend
} from "../../../../workers/syncGroupWorker";
import { groupSensor } from "../../../../hooks/sensors/groupSensor";
import { networkSensor, networkState } from "../../../../hooks/sensors/networkSensor";

import AddEditGroupDialog from "./addeditgroupdialog";
import DeleteConfirmationDialog from "./deleteconfirmationdialog";
import { FaPlus, FaTrash, FaRotate } from "react-icons/fa6";
import { MdEdit } from "react-icons/md";
import ReusableLight from "./../../../../components/layout/indicatorlight1ledLayout";
import { useKeyboardShortcut } from "./../../../../hooks/functions/useKeyboardShoartcut";
import { SHORTCUTS } from "./../../../../config/shortcuts/keyShortcuts";

/**************************************************/
/* COMPONENTE GROUP MANAGEMENT (con ForwardRef) */
/**************************************************/
const GroupManagement = forwardRef<any, any>((_, ref) => {
    /**************************************************/
    /* ESTADOS PRINCIPALES*/
    /**************************************************/
    const [isSynchronized, setIsSynchronized] = useState(networkState.serverOnline);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<Group | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    /**************************************************/
    /* MAPA DE ESTADOS DE SINCRONIZACIÓN CON COLORES */
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
    /* FUNCIÓN DE CARGA Y REFRESCO DE DATOS */
    /**************************************************/
    const loadGroups = useCallback(async () => {
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
    }, [selectedGroup]);

    const handleRefresh = async () => {
        console.log("Iniciando sincronización manual desde backend...");
        await syncFromBackend();
    };

    /**************************************************/
    /* EVENTOS: RED Y SINCRONIZACIÓN  */
    /**************************************************/
    useEffect(() => {
        const handleSyncSuccess = () => {
            console.log("Sincronización completa. Recargando datos.");
            if (!isGroupDialogOpen && !isDeleteDialogOpen) {
                loadGroups();
            }
        };

        const handleServerStatusChange = () => {
            setIsSynchronized(networkState.serverOnline);
            if (networkState.serverOnline) {
                console.log("Servidor disponible. Reanudando operaciones.");
            } else {
                console.log("Servidor no disponible. Operaciones bloqueadas.");
            }
        };

        groupSensor.on("sync-success", handleSyncSuccess);
        networkSensor.on("server-online", handleServerStatusChange);
        networkSensor.on("server-offline", handleServerStatusChange);

        return () => {
            groupSensor.off("sync-success", handleSyncSuccess);
            networkSensor.off("server-online", handleServerStatusChange);
            networkSensor.off("server-offline", handleServerStatusChange);
        };
    }, [isGroupDialogOpen, isDeleteDialogOpen, loadGroups]);

    /**************************************************/
    /* CRUD CON OPTIMISTIC UI  */
    /**************************************************/
    const handleCreateOrUpdateGroup = async (groupName: string, description: string) => {
        if (selectedGroup && selectedGroup.id) {
            const updatedGroup = { ...selectedGroup, groupName, description, syncStatus: "updated" as GroupSyncStatus };
            setGroups((prev: Group[]) => prev.map((g: Group) => g.id === updatedGroup.id ? updatedGroup : g));
            setSelectedGroup(updatedGroup);
            await updateGroup(updatedGroup);
        } else {
            const newGroup = { groupName, description, lastModifiedAt: new Date().toISOString() };
            const tempId = new Date().getTime().toString();
            setGroups((prev: Group[]) => [...prev, { ...newGroup, id: tempId, syncStatus: "pending" as GroupSyncStatus, users: [] }]);
            await createGroup(newGroup);
        }
        setIsGroupDialogOpen(false);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        const groupToDelete = { ...itemToDelete, syncStatus: "deleted" as GroupSyncStatus };
        setGroups((prev: Group[]) => prev.map((g: Group) => g.id === groupToDelete.id ? groupToDelete : g));
        await deleteGroup(groupToDelete);
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    /**************************************************/
    /* DIALOGOS */
    /**************************************************/
    const handleOpenGroupDialog = (group: Group | null = null) => {
        // PERMITE siempre abrir el diálogo para crear un nuevo grupo
        if (!group) {
            setSelectedGroup(null);
            setIsGroupDialogOpen(true);
            return;
        }

        // Bloquea la edición si el estado no es 'backend'
        if (group.syncStatus !== "backend") {
            alert("No se puede editar este grupo en su estado actual.");
            return;
        }

        setSelectedGroup(group);
        setIsGroupDialogOpen(true);
    };

    const handleOpenDeleteDialog = (item: Group) => {
        // Solo permite la eliminación si el estado es 'backend'
        if (item.syncStatus !== "backend") {
            alert("No se puede eliminar este grupo en su estado actual.");
            return;
        }

        setItemToDelete(item);
        setIsDeleteDialogOpen(true);
    };

    /**************************************************/
    /* ATAJOS DE TECLADO */
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
    /* FUNCIONES EXTERNAS (REF) */
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
    /* PAGINACIÓN  */
    /**************************************************/
    const currentGroups = useMemo(() => {
        const indexOfLastGroup = currentPage * itemsPerPage;
        const indexOfFirstGroup = indexOfLastGroup - itemsPerPage;
        return groups.slice(indexOfFirstGroup, indexOfLastGroup);
    }, [groups, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(groups.length / itemsPerPage);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    /**************************************************/
    /* NAVEGACIÓN CON TECLAS*/
    /**************************************************/
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isGroupDialogOpen || isDeleteDialogOpen) return;
            if (["ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
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
    /* RENDER PRINCIPAL*/
    /**************************************************/
    return (
        <div className="group-management table-wrapper">
            <div className="header-actions">
                <h2>Gestión de Grupos</h2>
                <button
                    className="add-button action-btn"
                    onClick={() => handleOpenGroupDialog()}
                    disabled={false} // Siempre permitir crear
                >
                    <FaPlus size={16} />
                </button>
                <button className="refresh-button action-btn" onClick={handleRefresh}>
                    <FaRotate size={16} />
                </button>
            </div>

            <div className="table-container">
                <div className="groups-list">
                    {currentGroups.map((g: Group, index: number) => {
                        // REGLA CLAVE: HABILITA solo si el estado es 'backend'
                        const isEnabled = g.syncStatus === "backend";

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
                                        disabled={!isEnabled}
                                        onClick={(e) => { e.stopPropagation(); handleOpenGroupDialog(g); }}
                                    >
                                        <MdEdit size={16} />
                                    </button>
                                    <button
                                        className="delete-button action-btn"
                                        disabled={!isEnabled}
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

            <div className="pagination-dots">
                {currentPage > 1 && <span className="arrow" onClick={() => paginate(currentPage - 1)}>‹</span>}
                {Array.from({ length: totalPages }, (_, i) => (
                    <span key={i} className={`dot ${currentPage === i + 1 ? "active" : ""}`} onClick={() => paginate(i + 1)}>
                        {i + 1}
                    </span>
                ))}
                {currentPage < totalPages && <span className="arrow" onClick={() => paginate(currentPage + 1)}>›</span>}
            </div>

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