import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { X, UserPlus, Check, Key, Shield } from 'lucide-react';

export const UsersModal: React.FC = () => {
  const { isUsersModalOpen, setIsUsersModalOpen, users, addUser, updateUser } = useApp();
  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('comprador');
  const [formCostCenters, setFormCostCenters] = useState('*');
  const [formPassword, setFormPassword] = useState('');

  if (!isUsersModalOpen) return null;

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingUsername(null);
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('comprador');
    setFormCostCenters('*');
    setFormPassword('');
  };

  const handleStartEdit = (user: User) => {
    setEditingUsername(user.username);
    setIsAddingNew(false);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormPhone(user.phone || '');
    setFormRole(user.role);
    setFormCostCenters(user.allowed_cost_centers);
    setFormPassword(user.password || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingNew) {
      if (!formUsername.trim()) return;
      const newUser: User = {
        username: formUsername.toLowerCase().trim(),
        name: formName.trim() || formUsername,
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        allowed_cost_centers: formCostCenters.trim() || '*',
        active: true,
        password: formPassword || 'omega123',
        created_at: new Date().toLocaleString('pt-BR')
      };
      addUser(newUser);
      setIsAddingNew(false);
    } else if (editingUsername) {
      updateUser(editingUsername, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole,
        allowed_cost_centers: formCostCenters.trim(),
        password: formPassword
      });
      setEditingUsername(null);
    }
  };

  return (
    <div className="login-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
      <div className="card modal-dialog" style={{ width: '100%', maxWidth: 750, maxHeight: '90vh', overflowY: 'auto', padding: 24, background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={22} color="#C58B38" />
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Gestão de Usuários & Perfis (RBAC)</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Controle de acessos, permissões e centros de custo</p>
            </div>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setIsUsersModalOpen(false)}>
            <X size={16} />
          </button>
        </div>

        {/* Action button */}
        {!isAddingNew && !editingUsername && (
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary btn-sm" onClick={handleStartAdd}>
              <UserPlus size={15} />
              Novo Usuário
            </button>
          </div>
        )}

        {/* User Form (Add / Edit) */}
        {(isAddingNew || editingUsername) && (
          <form onSubmit={handleSave} style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              {isAddingNew ? 'Cadastrar Novo Usuário' : `Editar Usuário: ${editingUsername}`}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Nome Completo:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Username (Login):</label>
                <input
                  type="text"
                  className="form-control"
                  value={formUsername}
                  onChange={e => setFormUsername(e.target.value)}
                  placeholder="Ex: joaosilva"
                  disabled={!isAddingNew}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>E-mail:</label>
                <input
                  type="email"
                  className="form-control"
                  value={formEmail}
                  onChange={e => setFormEmail(e.target.value)}
                  placeholder="Ex: joao@omegarj.com.br"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Perfil / Papel:</label>
                <select
                  className="form-control"
                  value={formRole}
                  onChange={e => setFormRole(e.target.value as UserRole)}
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="gestor">Gestor / Diretoria (Leitura Geral)</option>
                  <option value="comprador">Comprador (Mapas, Alertas, Cancelamentos)</option>
                  <option value="engenheiro">Engenheiro de Obra (Apenas Resumos)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Centros de Custo Autorizados:</label>
                <input
                  type="text"
                  className="form-control"
                  value={formCostCenters}
                  onChange={e => setFormCostCenters(e.target.value)}
                  placeholder="* para todos ou ex: 188, 442"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600 }}>Senha de Acesso:</label>
                <input
                  type="password"
                  className="form-control"
                  value={formPassword}
                  onChange={e => setFormPassword(e.target.value)}
                  placeholder="Digite a senha"
                  required={isAddingNew}
                />
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingUsername(null);
                }}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                <Check size={14} />
                Salvar Usuário
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div style={{ marginTop: 16, overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Nome / E-mail</th>
                <th>Perfil</th>
                <th>Centros de Custo</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(users).map(u => (
                <tr key={u.username}>
                  <td>
                    <strong>{u.username}</strong>
                  </td>
                  <td>
                    <div>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                  </td>
                  <td>
                    <span
                      className="role-pill"
                      style={{
                        background:
                          u.role === 'admin'
                            ? 'rgba(239, 68, 68, 0.2)'
                            : u.role === 'gestor'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : u.role === 'comprador'
                            ? 'rgba(59, 130, 246, 0.2)'
                            : 'rgba(16, 185, 129, 0.2)',
                        color:
                          u.role === 'admin'
                            ? '#f87171'
                            : u.role === 'gestor'
                            ? '#fbbf24'
                            : u.role === 'comprador'
                            ? '#60a5fa'
                            : '#34d399',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700
                      }}
                    >
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    {u.allowed_cost_centers === '*' ? 'Todos (*)' : u.allowed_cost_centers}
                  </td>
                  <td>
                    <span style={{ color: u.active ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleStartEdit(u)}
                      style={{ padding: '4px 8px', fontSize: 11 }}
                    >
                      <Key size={12} />
                      Editar / Senha
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
