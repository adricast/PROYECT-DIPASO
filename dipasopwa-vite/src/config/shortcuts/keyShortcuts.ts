/**
 * Archivo de configuración para centralizar los atajos de teclado de la aplicación.
 * Las combinaciones de teclas se definen como un array de strings.
 * Los modificadores son: 'Control', 'Alt', 'Shift'.
 * Las teclas especiales son: 'ArrowDown', 'F12', etc.
 */
export const SHORTCUTS = {
  // Atajos GENERALES aplicables a cualquier formulario
  NEW_FORM: { keys: ['Control', 'Alt', 'n'], description: 'Nuevo formulario' },
  // ✅ Nuevo atajo para editar
  EDIT_FORM: { keys: ['Control', 'Alt', 'm'], description: 'Editar formulario' },
  SAVE_FORM: { keys: ['Control', 'Alt', 'g'], description: 'Guardar formulario' },
  DELETE_ITEM: { keys: ['Control', 'Alt', 'd'], description: 'Eliminar elemento' },

  // Atajos ESPECÍFICOS por funcionalidad
  OPEN_SEARCH_BOX: { keys: ['Control', 'ArrowDown'], description: 'Abre cuadro de búsqueda de clientes/productos' },
  CONSULT_CUSTOMER: { keys: ['Control', 'Alt', 'F12'], description: 'Ventana emergente para consultar cliente' },
  
  // Atajos para la gestión de facturas
  SAVE_INVOICE: { keys: ['Control', 'Alt', 's'], description: 'Abrir pantalla de Factura de Ventas por Barras' },
  OPEN_RETURNS_SCREEN: { keys: ['Control', 'Alt', 'd'], description: 'Abre pantalla de Devoluciones' },
  OPEN_PARTIAL_WITHDRAWAL: { keys: ['Control', 'Alt', 'y'], description: 'Abre pantalla de Retiro Parcial' },
  OPEN_FINAL_CASH_WITHDRAWAL: { keys: ['Control', 'Alt', 'q'], description: 'Abre pantalla de Retiro Final de Caja' },

  // Atajos para formas de pago
  ADD_PAYMENT_METHOD: { keys: ['Alt', '1'], description: 'Agregar forma de pago' },
  REMOVE_PAYMENT_METHOD: { keys: ['Alt', '2'], description: 'Quitar forma de pago' },
  ACTIVATE_CARD_PAYMENT: { keys: ['Alt', 'Shift', 't'], description: 'Activar forma de pago con Tarjeta' },
  
  // Atajos para navegación de UI
  LOCATE_SELLER_INPUT: { keys: ['Alt', 'Shift', 'd'], description: 'Ubica cursor en combo Vendedor' },
};