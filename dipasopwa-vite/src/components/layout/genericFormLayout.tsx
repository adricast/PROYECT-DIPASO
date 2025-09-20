// components/layout/genericFormLayout.tsx
import React, { useState, useEffect } from "react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "number" | "email" | "password" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
}

interface GenericFormProps {
  fields: FormField[];
  onSubmit: (data: Record<string, any>, isEdit: boolean) => void; // isEdit indica si es edición
  initialData?: Record<string, any>; // Valores iniciales para editar
}

const GenericForm: React.FC<GenericFormProps> = ({ fields, onSubmit, initialData = {} }) => {
  // Detecta si es edición
  const isEdit = Object.keys(initialData).length > 0;

  const initialState = fields.reduce((acc, field) => {
    acc[field.name] = initialData[field.name] ?? "";
    return acc;
  }, {} as Record<string, any>);

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    // Actualiza estado si cambian los datos iniciales
    setFormData(
      fields.reduce((acc, field) => {
        acc[field.name] = initialData[field.name] ?? "";
        return acc;
      }, {} as Record<string, any>)
    );
  }, [initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData, isEdit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white shadow-md rounded-md">
      {fields.map((field) => (
        <div key={field.name} className="flex flex-col">
          <label className="mb-1 font-semibold">{field.label}</label>
          {field.type === "textarea" ? (
            <textarea
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="border rounded p-2 text-black"
            />
          ) : field.type === "select" ? (
            <select
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className="border rounded p-2 text-black"
            >
              <option value="">Selecciona una opción</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={field.type}
              value={formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              className="border rounded p-2 text-black" // ✅ Clase corregida
            />
          )}
        </div>
      ))}

      <button
        type="submit"
        className={`px-4 py-2 rounded text-black ${isEdit ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
      >
        {isEdit ? "Actualizar" : "Guardar"}
      </button>
    </form>
  );
};

export default GenericForm;