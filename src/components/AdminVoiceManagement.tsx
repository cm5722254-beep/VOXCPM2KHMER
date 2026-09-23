import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Plus, Trash2, Volume2, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { GlassCard, GlassButton, GlassBadge, GlassModal } from './GlassCard';

interface Voice {
  id: number;
  voice_id: string;
  voice_name: string;
  voice_label: string;
  gender: string;
  is_premium: number;
  is_admin_only: number;
  enabled_for_free: number;
}

interface User {
  id: number;
  username: string;
  tier: string;
}

export default function AdminVoiceManagement() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadVoices();
    loadUsers();
  }, []);

  const loadVoices = async () => {
    try {
      const response = await axios.get('/api/admin/voices');
      setVoices(response.data.voices || []);
    } catch (err) {
      console.error('Failed to load voices:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const toggleVoiceAccess = async (voiceId: string, field: string, currentValue: number) => {
    setLoading(true);
    try {
      await axios.post('/api/admin/voices/toggle', {
        voiceId,
        field,
        value: currentValue === 1 ? 0 : 1
      });
      await loadVoices();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'មានបញ្ហាកើតឡើង');
    } finally {
      setLoading(false);
    }
  };

  const grantVoiceToUser = async (userId: number) => {
    if (!selectedVoice) return;

    setLoading(true);
    try {
      await axios.post('/api/admin/voices/grant', {
        userId,
        voiceId: selectedVoice.voice_id,
        days: 365
      });
      alert('បានផ្តល់សិទ្ធិប្រើសំឡេងជោគជ័យ!');
      setShowGrantModal(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'មានបញ្ហាកើតឡើង');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlassCard className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text">Voice Library Management</h2>
            <p className="text-sm text-slate-400">គ្រប់គ្រងសំឡេង និងសិទ្ធិប្រើប្រាស់</p>
          </div>
        </div>
      </GlassCard>

      {/* Voice List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {voices.map((voice) => (
          <GlassCard key={voice.id} className="p-5 space-y-4">
            {/* Voice Info */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
                  <Volume2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-200 mb-1">{voice.voice_label}</h3>
                  <p className="text-xs text-slate-400 mb-2">{voice.voice_name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <GlassBadge
                      variant={voice.gender === 'male' ? 'sky' : voice.gender === 'female' ? 'violet' : 'emerald'}
                      className="text-[9px]"
                    >
                      {voice.gender === 'male' ? 'ប្រុស' : voice.gender === 'female' ? 'ស្រី' : 'ទូទៅ'}
                    </GlassBadge>
                    {voice.is_premium === 1 && (
                      <GlassBadge variant="amber" className="text-[9px]">
                        Premium
                      </GlassBadge>
                    )}
                    {voice.is_admin_only === 1 && (
                      <GlassBadge variant="red" className="text-[9px]">
                        Admin Only
                      </GlassBadge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Access Controls */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              {/* Free Users Access */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {voice.enabled_for_free === 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className="text-xs text-slate-400">Free Users</span>
                </div>
                <button
                  onClick={() => toggleVoiceAccess(voice.voice_id, 'enabled_for_free', voice.enabled_for_free)}
                  disabled={loading}
                  className={`
                    relative w-10 h-5 rounded-full transition-all duration-300
                    ${voice.enabled_for_free === 1 ? 'bg-emerald-500' : 'bg-slate-600'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                    transition-transform duration-300 shadow-lg
                    ${voice.enabled_for_free === 1 ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </button>
              </div>

              {/* Premium Only */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {voice.is_premium === 1 ? (
                    <Lock className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Unlock className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-xs text-slate-400">Premium Only</span>
                </div>
                <button
                  onClick={() => toggleVoiceAccess(voice.voice_id, 'is_premium', voice.is_premium)}
                  disabled={loading}
                  className={`
                    relative w-10 h-5 rounded-full transition-all duration-300
                    ${voice.is_premium === 1 ? 'bg-amber-500' : 'bg-slate-600'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                    transition-transform duration-300 shadow-lg
                    ${voice.is_premium === 1 ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </button>
              </div>

              {/* Admin Only */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 ${voice.is_admin_only === 1 ? 'text-red-400' : 'text-slate-400'}`} />
                  <span className="text-xs text-slate-400">Admin Only</span>
                </div>
                <button
                  onClick={() => toggleVoiceAccess(voice.voice_id, 'is_admin_only', voice.is_admin_only)}
                  disabled={loading}
                  className={`
                    relative w-10 h-5 rounded-full transition-all duration-300
                    ${voice.is_admin_only === 1 ? 'bg-red-500' : 'bg-slate-600'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full
                    transition-transform duration-300 shadow-lg
                    ${voice.is_admin_only === 1 ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </button>
              </div>
            </div>

            {/* Grant to User Button */}
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedVoice(voice);
                setShowGrantModal(true);
              }}
              icon={<Plus className="w-4 h-4" />}
              className="w-full"
            >
              ផ្តល់សិទ្ធិអោយ User
            </GlassButton>
          </GlassCard>
        ))}
      </div>

      {/* Grant Voice Modal */}
      <GlassModal
        isOpen={showGrantModal}
        onClose={() => setShowGrantModal(false)}
        title={`ផ្តល់សិទ្ធិ: ${selectedVoice?.voice_label}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            ជ្រើសរើស User ដែលអ្នកចង់ផ្តល់សិទ្ធិប្រើសំឡេងនេះ
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {users
              .filter(u => u.tier !== 'premium')
              .map(user => (
                <button
                  key={user.id}
                  onClick={() => grantVoiceToUser(user.id)}
                  disabled={loading}
                  className="w-full glass-card p-4 hover:bg-white/[0.03] transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{user.username}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Tier: <span className="text-sky-400">{user.tier}</span>
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-emerald-400" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
