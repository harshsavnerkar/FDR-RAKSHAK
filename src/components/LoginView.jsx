import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  X,
  RefreshCw,
  Server,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

const ROLE_PRESETS = [
  {
    id: 'chief',
    role: 'BUREAU_CHIEF',
    title: 'AICTE Bureau Chief',
    icon: '👑',
    subtitle: 'Sign-off on releases & overrides',
    username: 'aicte_admin',
    password: 'Admin@123',
    badge: 'Approver',
    badgeColor: 'bg-purple-100 text-purple-700 border border-purple-300'
  },
  {
    id: 'scrutiny',
    role: 'SCRUTINY_OFFICER',
    title: 'Scrutiny Officer',
    icon: '🔍',
    subtitle: 'Audit, OCR & recommend releases',
    username: 'scrutiny_officer',
    password: 'Scrutiny@2026!',
    badge: 'Maker',
    badgeColor: 'bg-cyan-100 text-cyan-800 border border-cyan-300'
  },
  {
    id: 'college',
    role: 'INSTITUTION_USER',
    title: 'Institutional User',
    icon: '🏛️',
    subtitle: 'Upload FDRs, renewals & compliance status',
    username: 'vit_mumbai',
    password: 'College@2026!',
    badge: 'Institutional',
    badgeColor: 'bg-blue-100 text-blue-700 border border-blue-300'
  },
  {
    id: 'bank',
    role: 'BANK_NODE',
    title: 'Bank Nodal Desk',
    icon: '🏦',
    subtitle: 'State Bank of India confirmation',
    username: 'sbi_nodal',
    password: 'Bank@2026!',
    badge: 'Bank Node',
    badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300'
  }
];

export function LoginView({ onLoginSuccess }) {
  const [selectedRole, setSelectedRole] = useState('chief');
  const [username, setUsername] = useState('aicte_admin');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Password Recovery Modal State
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState(1); // 1: request token, 2: enter token & new password
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('aicte_admin');
  const [recoveryToken, setRecoveryToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both administrative username and master password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const data = await api.login({
        username: username.trim(),
        password: password
      });

      if (data && (data.authenticated || data.status === 'success')) {
        const adminUser = data.admin || { username: data.username, email: data.email };
        onLoginSuccess(adminUser);
      } else {
        setErrorMessage(data?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err) {
      console.error('Login authentication error:', err);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitiateRecovery = async (e) => {
    e.preventDefault();
    if (!recoveryIdentifier.trim()) {
      setRecoveryError('Please provide administrative username or registered email.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');
    setRecoveryMessage('');

    try {
      const res = await api.initiatePasswordRecovery({
        identifier: recoveryIdentifier.trim()
      });
      setRecoveryMessage(res.message || 'Recovery token dispatched. Check administrative console logs.');
      setRecoveryStep(2);
    } catch (err) {
      setRecoveryError(err.message || 'Failed to initiate password recovery.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!recoveryToken.trim() || !newPassword) {
      setRecoveryError('Both recovery token and new master password are required.');
      return;
    }

    if (newPassword.length < 8) {
      setRecoveryError('New password must be at least 8 characters in length.');
      return;
    }

    setRecoveryLoading(true);
    setRecoveryError('');

    try {
      const res = await api.resetPassword({
        recovery_token: recoveryToken.trim(),
        new_password: newPassword
      });
      setRecoveryMessage(res.message || 'Password successfully updated. All sessions invalidated.');
      setTimeout(() => {
        setShowRecoveryModal(false);
        setRecoveryStep(1);
        setRecoveryToken('');
        setNewPassword('');
        setPassword('');
        setErrorMessage('');
      }, 2000);
    } catch (err) {
      setRecoveryError(err.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chassis flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-accent-orange selection:text-white">
      
      {/* Top Header / Ministry Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between border-b border-[#d1d9e6]/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl skeuo-panel-elevated bg-white p-1 border border-[#d1d9e6] flex items-center justify-center shadow-sm overflow-hidden">
            <img src="/logo.png" alt="FDR Rakshak Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-wider text-accent-orange uppercase">
              All India Council for Technical Education
            </div>
            <div className="text-sm font-bold text-text-primary">
              Regulation Bureau — FDR Rakshak Vault
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-text-muted">
          <span className="led-indicator led-green" />
          <span>STATUTORY SECURITY GATEWAY</span>
        </div>
      </div>

      {/* Center Authentication Module */}
      <div className="w-full max-w-lg my-8 animate-in fade-in duration-300">
        
        {/* Terminal Header Plate */}
        <div className="skeuo-panel-elevated p-8 rounded-3xl border border-chassis relative overflow-hidden shadow-skeuo-modal">
          
          {/* Subtle Corner Screw Accents */}
          <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full skeuo-recessed border border-[#babecc]" />
          <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full skeuo-recessed border border-[#babecc]" />
          <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full skeuo-recessed border border-[#babecc]" />
          <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full skeuo-recessed border border-[#babecc]" />

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl skeuo-panel-elevated bg-white p-2 border border-[#d1d9e6] shadow-md mb-3 overflow-hidden">
              <img src="/logo.png" alt="FDR Rakshak" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-xl font-bold text-text-primary tracking-tight">
              Administrative Authentication
            </h2>
            <p className="text-xs text-text-muted font-mono mt-1">
              AICTE Regulation Bureau &bull; Sovereign RBAC Depository
            </p>
          </div>

          {/* Quick Role Demo Selector (4 Sovereign Personas) */}
          <div className="mb-6 p-3 rounded-2xl skeuo-recessed border border-[#d1d9e6]/70">
            <div className="flex items-center justify-between mb-2.5 px-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary">
                <Shield className="w-3.5 h-3.5 text-accent-orange" />
                <span>Select Sovereign RBAC Persona:</span>
              </div>
              <span className="text-[10px] font-mono text-accent-orange font-semibold">1-Click Auto-Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ROLE_PRESETS.map((preset) => {
                const isSelected = selectedRole === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedRole(preset.id);
                      setUsername(preset.username);
                      setPassword(preset.password);
                      setErrorMessage('');
                    }}
                    className={`p-2 rounded-xl text-left transition-all text-xs ${
                      isSelected
                        ? 'bg-white shadow-sm border border-accent-orange text-text-primary ring-1 ring-accent-orange/40'
                        : 'bg-white/40 border border-[#d1d9e6] hover:bg-white/70 text-text-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1 text-[11px] truncate">
                        <span>{preset.icon}</span>
                        <span className={isSelected ? 'text-text-primary' : 'text-text-primary/90'}>
                          {preset.title}
                        </span>
                      </span>
                      <span className={`text-[8.5px] font-mono font-bold px-1 py-0.2 rounded ${preset.badgeColor}`}>
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-[9.5px] leading-tight text-text-muted truncate">
                      {preset.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-[#ffebee] border border-[#ffcdd2] text-xs font-mono text-[#c62828] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username Field */}
            <div>
              <label className="block text-xs font-mono font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>Bureau Administrator ID</span>
                <span className="text-[10px] text-text-muted font-normal">Default: aicte_admin</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter administrator ID"
                  required
                  autoFocus
                  disabled={isSubmitting}
                  className="skeuo-input w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-mono text-text-primary focus:outline-none placeholder:text-text-muted/60"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-mono font-semibold text-text-primary mb-1.5 flex items-center justify-between">
                <span>Master Vault Password</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(true);
                    setRecoveryError('');
                    setRecoveryMessage('');
                  }}
                  className="text-[11px] text-accent-orange font-semibold hover:underline"
                >
                  Forgot Password?
                </button>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  disabled={isSubmitting}
                  className="skeuo-input w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-mono text-text-primary focus:outline-none placeholder:text-text-muted/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="skeuo-btn skeuo-btn-primary w-full py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Argon2id Hash...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Access FDR Depository</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Hardened Security Badge */}
          <div className="mt-6 pt-5 border-t border-[#d1d9e6]/70">
            <div className="px-3 py-2 rounded-xl bg-chassis/60 border border-[#d1d9e6] text-[11px] font-mono text-text-muted space-y-1">
              <div className="flex items-center gap-2 text-text-primary font-semibold">
                <Server className="w-3.5 h-3.5 text-accent-orange" />
                <span>Regulatory Security Profile</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Key Derivation:</span>
                <span className="font-bold text-text-primary">Argon2id / Bcrypt</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Session Transit:</span>
                <span className="font-bold text-text-primary">HTTP-Only / SameSite=Lax</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Rate Limiting:</span>
                <span className="font-bold text-text-primary">5 Attempts / 15m Lockout</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Password Recovery Modal */}
      {showRecoveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="skeuo-panel-elevated w-full max-w-md p-6 rounded-3xl border border-chassis relative shadow-skeuo-modal">
            
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-text-muted hover:text-text-primary skeuo-btn"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl skeuo-recessed flex items-center justify-center text-accent-orange border border-recessed">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-text-primary">
                  Administrative Password Recovery
                </h3>
                <p className="text-[11px] font-mono text-text-muted">
                  Expiring One-Time Token Protocol (15m TTL)
                </p>
              </div>
            </div>

            {/* Feedback Messages */}
            {recoveryMessage && (
              <div className="mb-4 p-3 rounded-xl bg-[#eafaf1] border border-[#b7ebcd] text-xs font-mono text-[#1b7943] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{recoveryMessage}</span>
              </div>
            )}

            {recoveryError && (
              <div className="mb-4 p-3 rounded-xl bg-[#ffebee] border border-[#ffcdd2] text-xs font-mono text-[#c62828] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{recoveryError}</span>
              </div>
            )}

            {recoveryStep === 1 ? (
              <form onSubmit={handleInitiateRecovery} className="space-y-4">
                <p className="text-xs text-text-muted leading-relaxed">
                  Enter your administrative username or verified email. Because FDR Rakshak runs in high-security sovereign mode, the one-time recovery token is issued securely directly to the backend operational console.
                </p>
                <div>
                  <label className="block text-xs font-mono font-semibold text-text-primary mb-1">
                    Administrator Identifier
                  </label>
                  <input
                    type="text"
                    value={recoveryIdentifier}
                    onChange={(e) => setRecoveryIdentifier(e.target.value)}
                    placeholder="aicte_admin or admin@aicte-india.org"
                    required
                    className="skeuo-input w-full px-3.5 py-2.5 rounded-xl text-sm font-mono text-text-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(false)}
                    className="skeuo-btn px-4 py-2 rounded-xl text-xs font-semibold text-text-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="skeuo-btn skeuo-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                  >
                    {recoveryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Issue Recovery Token</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-2.5 rounded-lg bg-[#fff8e6] border border-[#ffd166] text-[11px] font-mono text-[#b36b00]">
                  Inspect the backend terminal output to retrieve the active 15-minute recovery token.
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-text-primary mb-1">
                    One-Time Recovery Token
                  </label>
                  <input
                    type="text"
                    value={recoveryToken}
                    onChange={(e) => setRecoveryToken(e.target.value)}
                    placeholder="Paste recovery token from console"
                    required
                    className="skeuo-input w-full px-3.5 py-2.5 rounded-xl text-sm font-mono text-text-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-text-primary mb-1">
                    New Master Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new strong password"
                    required
                    className="skeuo-input w-full px-3.5 py-2.5 rounded-xl text-sm font-mono text-text-primary focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep(1)}
                    className="text-xs text-text-muted hover:underline"
                  >
                    &larr; Back to Step 1
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRecoveryModal(false)}
                      className="skeuo-btn px-4 py-2 rounded-xl text-xs font-semibold text-text-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={recoveryLoading}
                      className="skeuo-btn skeuo-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"
                    >
                      {recoveryLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                      <span>Reset Master Password</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Statutory Footer */}
      <div className="w-full max-w-4xl pt-4 border-t border-[#d1d9e6]/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-text-muted">
        <div>
          FDR Rakshak &copy; 2026 AICTE Regulation Bureau &bull; Ministry of Education
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span>Single Administrator Gateway</span>
          <span>&bull;</span>
          <span>ISO 27001 Certified Vault Architecture</span>
        </div>
      </div>

    </div>
  );
}
