import React, { useState } from "react";
import "./style/userPage.scss";

// Datos ficticios
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const initialUsers: User[] = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User" },
  { id: 3, name: "Alice Brown", email: "alice@example.com", role: "User" },
  { id: 4, name: "Bob Johnson", email: "bob@example.com", role: "Admin" },
];

const UserPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id: number) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  const handleEdit = (user: User) => {
    alert(`Editar usuario: ${user.name}`);
  };

  return (
    <div className="user-page">
      <h1>Usuarios</h1>

      <div className="user-page-controls">
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="add-btn" onClick={() => alert("Agregar usuario")}>
          + Nuevo Usuario
        </button>
      </div>

      <div className="table-responsive">
        <table className="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5}>No se encontraron usuarios.</td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <button className="edit-btn" onClick={() => handleEdit(user)}>
                      Editar
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(user.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserPage;
