import { createContext, useContext, useState, type ReactNode } from "react";

// Tipo del contexto
type SyncContextType = {
  enabled: boolean;                 // estado del switch
  setEnabled: (value: boolean) => void;  // función para actualizar
};

// Crear contexto
const SyncContext = createContext<SyncContextType | undefined>(undefined);

// Provider para envolver la app
export const SyncProvider = ({ children }: { children: ReactNode }) => {
  const [enabled, setEnabled] = useState(true); // por defecto activo

  return (
    <SyncContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </SyncContext.Provider>
  );
};

// Hook para usar el switch en cualquier componente
export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error("useSync must be used within a SyncProvider");
  return context;
};
