import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Key, Users, Plus, Copy, Check, Trash2, Sparkles, ToggleLeft, ToggleRight, Loader2, Search, Smartphone, KeyRound } from 'lucide-react';
import { api } from '../../services/api';
import { User, LicenseKey } from '../../types';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'keys'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');

  // Key creation state
  const [newKeyDays, setNewKeyDays] = useState<number>(30);
  const [isCreatingKey, setIsCreatingKey] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, keysRes] = await Promise.all([
        api.adminListUsers(),
        api.adminListLicenseKeys(),
      ]);
      if (usersRes.users) setUsers(usersRes.users);
      if (keysRes.keys) setKeys(keysRes.keys);
    } catch (e: any) {
      onShowToast(`កំហុសទាញយកទិន្នន័យ: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSetPremium = async (userId: number) => {
    try {
      await api.adminSetPremium(userId, 30);
      onShowToast('បានតម្លើង Premium (30 ថ្ងៃ) ជោគជ័យ!', 'success');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុស: ${e.message}`, 'error');
    }
  };

  const handleRevokePremium = async (userId: number) => {
    try {
      await api.adminRevokePremium(userId);
      onShowToast('បានដក Premium មកជា Free រួចរាល់', 'info');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុស: ${e.message}`, 'error');
    }
  };

  const handleResetDevice = async (userId: number) => {
    try {
      const res = await api.adminResetDevice(userId);
      onShowToast(res.message || 'បានដោះសោរឧបករណ៍ Device រួចរាល់!', 'success');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុស: ${e.message}`, 'error');
    }
  };

  const handleResetPassword = async (userId: number, currentUsername: string) => {
    const newPass = window.prompt(`កំណត់ពាក្យសម្ងាត់ថ្មីសម្រាប់ ${currentUsername}:`, '123456');
    if (!newPass || !newPass.trim()) return;
    try {
      const res = await api.adminResetPassword(userId, newPass.trim());
      onShowToast(res.message || 'បានប្តូរពាក្យសម្ងាត់ជោគជ័យ!', 'success');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុស: ${e.message}`, 'error');
    }
  };

  const handleDeleteUser = async (userId: number, currentUsername: string) => {
    if (!window.confirm(`តើអ្នកពិតជាចង់លុបគណនី "${currentUsername}" មែនទេ?`)) return;
    try {
      await api.adminDeleteUser(userId);
      onShowToast(`បានលុបគណនី ${currentUsername} រួចរាល់`, 'info');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុសលុបគណនី: ${e.message}`, 'error');
    }
  };

  const handleToggleVoxcpm = async (userId: number, currentStatus: boolean | number | undefined) => {
    try {
      const nextStatus = !currentStatus;
      await api.adminToggleUserVoxcpm(userId, nextStatus, 30);
      onShowToast(
        nextStatus ? 'បានបើកសិទ្ធិ VoxCPM2 ជោគជ័យ!' : 'បានបិទសិទ្ធិ VoxCPM2 រួចរាល់!',
        'success'
      );
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុស: ${e.message}`, 'error');
    }
  };

  const handleCreateKey = async () => {
    setIsCreatingKey(true);
    try {
      const res = await api.adminCreateLicenseKey(newKeyDays, 'voxcpm2');
      onShowToast(`បានបង្កើត Key License ថ្មី: ${res.key.key_code}`, 'success');
      loadData();
    } catch (e: any) {
      onShowToast(`កំហុសបង្កើត Key: ${e.message}`, 'error');
    } finally {
      setIsCreatingKey(false);
    }
  };

  const handleDeleteKey = async (keyId: number) => {
    try {
      await api.adminDeleteLicenseKey(keyId);
      onShowToast('បានលុប Key License រួចរាល់', 'info');
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } catch (e: any) {
      onShowToast(`កំហុសលុប Key: ${e.message}`, 'error');
    }
  };

  const handleCopyKey = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(code);
    onShowToast(`បានចម្លង Key: ${code}`, 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const premiumCount = users.filter((u) => u.tier === 'premium').length;
  const voxcpmCount = users.filter((u) => u.role === 'admin' || u.has_voxcpm_license).length;
  const availableKeysCount = keys.filter((k) => !k.is_used).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-white/[0.1] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 px-6 border-b border-white/[0.08] flex items-center justify-between bg-[#0b0f19]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-khmer">
                ផ្ទាំងគ្រប់គ្រង Admin (Users & License Keys)
              </h3>
              <p className="text-[11px] text-slate-400 font-khmer">
                គ្រប់គ្រងអ្នកប្រើប្រាស់ និងសិទ្ធិប្រើប្រាស់ VoxCPM2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation & Stats */}
        <div className="px-6 pt-4 pb-2 border-b border-white/[0.06] bg-[#0d1322] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold font-khmer transition-all ${
                activeTab === 'users'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>អ្នកប្រើប្រាស់ ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('keys')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold font-khmer transition-all ${
                activeTab === 'keys'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Key License VoxCPM2 ({availableKeysCount} នៅទំនេរ)</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-khmer">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Premium: {premiumCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              VoxCPM2: {voxcpmCount}
            </span>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs font-khmer">កំពុងទាញយកទិន្នន័យ...</span>
            </div>
          ) : activeTab === 'users' ? (
            /* Tab 1: Users Table */
            <div className="space-y-3">
              {/* User Search Bar */}
              <div className="flex items-center gap-2 bg-[#0b0f19] border border-white/[0.08] rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="ស្វែងរកតាមឈ្មោះអ្នកប្រើ ឬ ID..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full font-khmer"
                />
                {userSearch && (
                  <button
                    onClick={() => setUserSearch('')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-bold text-slate-400 font-khmer">
                      <th className="py-2.5 px-3">ID</th>
                      <th className="py-2.5 px-3">ឈ្មោះអ្នកប្រើ</th>
                      <th className="py-2.5 px-3">តួនាទី</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3">VoxCPM2 សិទ្ធិ</th>
                      <th className="py-2.5 px-3 text-right">សកម្មភាពគ្រប់គ្រង</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {users
                      .filter((u) =>
                        !userSearch
                          ? true
                          : u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                            String(u.id).includes(userSearch)
                      )
                      .map((u) => {
                        const hasVox = Boolean(u.role === 'admin' || u.has_voxcpm_license);
                        return (
                          <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3 font-mono text-slate-400">#{u.id}</td>
                            <td className="py-2.5 px-3 font-medium text-white">
                              <div>{u.username}</div>
                              {u.current_device_id ? (
                                <div className="text-[10px] text-amber-400/80 font-mono flex items-center gap-1">
                                  <span>🔒 Dev: {u.current_device_id.slice(0, 8)}...</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-emerald-400/80">
                                  🔓 គ្មាន Lock ឧបករណ៍
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  u.role === 'admin'
                                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                    : 'bg-sky-500/15 text-sky-300'
                                }`}
                              >
                                {u.role}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                  u.tier === 'premium'
                                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-500/15 text-slate-400'
                                }`}
                              >
                                {u.tier}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => handleToggleVoxcpm(u.id, u.has_voxcpm_license)}
                                disabled={u.role === 'admin'}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-khmer font-semibold transition-all ${
                                  hasVox
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                                } disabled:opacity-75`}
                              >
                                {hasVox ? (
                                  <ToggleRight className="w-3.5 h-3.5 text-cyan-400" />
                                ) : (
                                  <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                <span>{hasVox ? 'បានបើក' : 'បិទ'}</span>
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {u.role !== 'admin' && (
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.tier === 'premium' ? (
                                    <button
                                      onClick={() => handleRevokePremium(u.id)}
                                      title="ដក Premium មកជា Free"
                                      className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[10px] font-semibold font-khmer transition-colors border border-amber-500/20"
                                    >
                                      ដក Premium
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSetPremium(u.id)}
                                      title="ដាក់ Premium (30 ថ្ងៃ)"
                                      className="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-[10px] font-semibold font-khmer transition-colors border border-sky-500/20"
                                    >
                                      + Premium
                                    </button>
                                  )}

                                  {/* Unlock Device */}
                                  <button
                                    onClick={() => handleResetDevice(u.id)}
                                    title="ដោះសោរឧបករណ៍ (Reset Device ID)"
                                    className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-cyan-400 transition-colors"
                                  >
                                    <Smartphone className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Reset Password */}
                                  <button
                                    onClick={() => handleResetPassword(u.id, u.username)}
                                    title="ប្តូរពាក្យសម្ងាត់ (Reset Password)"
                                    className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-amber-400 transition-colors"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete User */}
                                  <button
                                    onClick={() => handleDeleteUser(u.id, u.username)}
                                    title="លុបគណនីនេះ"
                                    className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Tab 2: License Keys Management */
            <div className="space-y-4">
              {/* Generate Key Bar */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white font-khmer">
                    បង្កើត Key License VoxCPM2 ថ្មី:
                  </span>
                  <select
                    value={newKeyDays}
                    onChange={(e) => setNewKeyDays(Number(e.target.value))}
                    className="bg-[#0b0f19] border border-white/[0.1] text-xs text-white rounded-lg px-2.5 py-1 font-khmer focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value={7}>សាកល្បង ៧ ថ្ងៃ (7-Day Trial)</option>
                    <option value={30}>១ ខែ (1 Month / 30 Days)</option>
                    <option value={365}>១ ឆ្នាំ (1 Year / 365 Days)</option>
                    <option value={-1}>ជារៀងរហូត (Lifetime VIP)</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateKey}
                  disabled={isCreatingKey}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold font-khmer transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50"
                >
                  {isCreatingKey ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>បង្កើត Key ឥឡូវនេះ</span>
                </button>
              </div>

              {/* Keys List */}
              <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11px] font-bold text-slate-400 font-khmer">
                      <th className="py-2.5 px-3">លេខកូដ Key</th>
                      <th className="py-2.5 px-3">សុពលភាព (Tier)</th>
                      <th className="py-2.5 px-3">ស្ថានភាព</th>
                      <th className="py-2.5 px-3">អ្នកប្រើប្រាស់</th>
                      <th className="py-2.5 px-3">កាលបរិច្ឆេទ</th>
                      <th className="py-2.5 px-3 text-right">សកម្មភាព</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {keys.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500 font-khmer text-xs">
                          មិនទាន់មាន Key License ណាមួយនៅឡើយ
                        </td>
                      </tr>
                    ) : (
                      keys.map((k) => {
                        const isUsed = Boolean(k.is_used);
                        return (
                          <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white tracking-wider">
                                  {k.key_code}
                                </span>
                                <button
                                  onClick={() => handleCopyKey(k.key_code)}
                                  title="ចម្លង Key"
                                  className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-cyan-300 transition-colors"
                                >
                                  {copiedKey === k.key_code ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-khmer">
                              {k.days_valid === 7 ? (
                                <span className="px-2 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
                                  សាកល្បង ៧ ថ្ងៃ
                                </span>
                              ) : k.days_valid === 30 ? (
                                <span className="px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                                  ១ ខែ (30 ថ្ងៃ)
                                </span>
                              ) : k.days_valid === 365 ? (
                                <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                                  ១ ឆ្នាំ (365 ថ្ងៃ)
                                </span>
                              ) : (k.days_valid === -1 || k.days_valid === 0) ? (
                                <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                  ជារៀងរហូត (Lifetime VIP)
                                </span>
                              ) : (
                                `${k.days_valid} ថ្ងៃ`
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded font-khmer ${
                                  isUsed
                                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/20'
                                    : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                                }`}
                              >
                                {isUsed ? 'ប្រើរួច' : 'នៅទំនេរ'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-300">
                              {k.used_by_username || '—'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 text-[11px] font-mono">
                              {k.created_at ? k.created_at.slice(0, 10) : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => handleDeleteKey(k.id)}
                                title="លុប Key"
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-white/[0.08] bg-[#0b0f19] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs font-khmer transition-colors"
          >
            បិទ
          </button>
        </div>
      </div>
    </div>
  );
};
