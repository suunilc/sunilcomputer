import React, { useState } from 'react';
import { AppState, User, UserRole } from '../../types';
import { UserCheck, Plus, Shield, User as UserIcon, Trash2, Key } from 'lucide-react';

interface UserManagementProps {
  state: AppState;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  state,
  onAddUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [phone, setPhone] = useState('');

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.trim().toLowerCase(),
      name: name.trim(),
      role,
      phone: phone.trim(),
    };

    onAddUser(newUser);
    setIsModalOpen(false);
    setUsername('');
    setName('');
    setPhone('');
  };

  return (
    <div className="p-3 sm:p-6 space-y-5 text-black">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-black flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-black" />
            <span>Staff & User Access Control</span>
          </h2>
          <p className="text-xs text-black font-bold mt-0.5">
            Manage admin and staff accounts, role permissions, and cashier credentials.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer border border-black"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* User Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.users.map((u) => (
          <div key={u.id} className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-black shadow-xs space-y-3 text-black">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white border-2 border-black ${
                    u.role === 'admin' ? 'bg-black text-white' : 'bg-neutral-800 text-white'
                  }`}
                >
                  {u.role === 'admin' ? '👑' : '👤'}
                </div>
                <div>
                  <h3 className="font-black text-sm text-black">{u.name}</h3>
                  <p className="text-xs text-black font-mono font-bold">Username: {u.username}</p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-black border-2 border-black ${
                  u.role === 'admin'
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                }`}
              >
                {u.role}
              </span>
            </div>

            <div className="pt-2 border-t-2 border-black flex items-center justify-between text-xs text-black font-bold">
              <span>{u.phone ? `📞 ${u.phone}` : 'No phone listed'}</span>
              
              {u.username !== 'admin' && u.username !== '23571113' && u.username.toLowerCase() !== 'sunil' && (
                <button
                  onClick={() => {
                    if (confirm(`Delete account for ${u.name}?`)) {
                      onDeleteUser(u.id);
                    }
                  }}
                  className="text-black hover:bg-neutral-100 px-2 py-0.5 rounded border border-black font-black"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border-2 border-black max-w-md w-full space-y-4 text-black">
            <h3 className="font-black text-base text-black">Add Staff Account</h3>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-black text-black mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Shrestha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. maya"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-mono font-black text-black"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black bg-white text-black"
                >
                  <option value="staff">Staff (Sales & Billing Access Only)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-black mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-black text-black"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border-2 border-black text-black text-xs font-black rounded-xl cursor-pointer hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black hover:bg-neutral-800 text-white font-black text-xs rounded-xl cursor-pointer border border-black"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
