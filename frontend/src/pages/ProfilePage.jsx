import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building,
  GraduationCap,
  CreditCard
} from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await api.getProfile();
      setProfile(data || {});
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (field, val) => {
    setProfile((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      setSuccessMsg('Profile details successfully updated and verified for autofill!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8 text-xs text-slate-400 space-x-2">
        <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
        <span>Loading verified personal profile...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 font-semibold mb-1">
          <UserCheck className="w-4 h-4" />
          <span>Verified Citizen Master Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">My Application Profile</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          This approved data is used by Smart Autofill to complete scholarship, college, and government application forms.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Personal & Identity */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Personal & Identity Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Full Legal Name</label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => handleChange('full_name', e.target.value)}
                placeholder="Ramesh Kumar Reddy"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Father's Name</label>
              <input
                type="text"
                value={profile.father_name || ''}
                onChange={(e) => handleChange('father_name', e.target.value)}
                placeholder="Venkata Subbaiah Reddy"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Mother's Name</label>
              <input
                type="text"
                value={profile.mother_name || ''}
                onChange={(e) => handleChange('mother_name', e.target.value)}
                placeholder="Lakshmi Devi"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Date of Birth</label>
              <input
                type="text"
                value={profile.dob || ''}
                onChange={(e) => handleChange('dob', e.target.value)}
                placeholder="DD/MM/YYYY"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Gender</label>
              <select
                value={profile.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Social Category</label>
              <select
                value={profile.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              >
                <option value="">Select Category</option>
                <option value="General">General / OC</option>
                <option value="OBC">OBC (BC-A, B, C, D, E)</option>
                <option value="SC">Scheduled Caste (SC)</option>
                <option value="ST">Scheduled Tribe (ST)</option>
                <option value="EWS">Economically Weaker Section (EWS)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Aadhaar (Masked)</label>
              <input
                type="text"
                value={profile.aadhaar_masked || ''}
                onChange={(e) => handleChange('aadhaar_masked', e.target.value)}
                placeholder="XXXX-XXXX-1234"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl font-mono text-cyan-300 focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">PAN Number</label>
              <input
                type="text"
                value={profile.pan_number || ''}
                onChange={(e) => handleChange('pan_number', e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl font-mono text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Annual Family Income (INR)</label>
              <input
                type="text"
                value={profile.annual_income || ''}
                onChange={(e) => handleChange('annual_income', e.target.value)}
                placeholder="150000"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>Contact & Residential Address</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Mobile Phone (10 digits)</label>
              <input
                type="text"
                value={profile.mobile_number || ''}
                onChange={(e) => handleChange('mobile_number', e.target.value)}
                placeholder="9876543210"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="citizen@example.com"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">PIN / Postal Code</label>
              <input
                type="text"
                value={profile.pincode || ''}
                onChange={(e) => handleChange('pincode', e.target.value)}
                placeholder="500081"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-300 mb-1">Address Line</label>
              <input
                type="text"
                value={profile.address_line1 || ''}
                onChange={(e) => handleChange('address_line1', e.target.value)}
                placeholder="Door No, Street Name, Village/Town, District, State"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Education & Banking */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1E2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span>Education & Bank Account Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Current Degree / Course</label>
              <input
                type="text"
                value={profile.education_degree || ''}
                onChange={(e) => handleChange('education_degree', e.target.value)}
                placeholder="B.Tech Computer Science"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Institution / College Name</label>
              <input
                type="text"
                value={profile.institution_name || ''}
                onChange={(e) => handleChange('institution_name', e.target.value)}
                placeholder="Osmania University / JNTU"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Percentage / CGPA</label>
              <input
                type="text"
                value={profile.percentage_marks || ''}
                onChange={(e) => handleChange('percentage_marks', e.target.value)}
                placeholder="85.4%"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank Name</label>
              <input
                type="text"
                value={profile.bank_name || ''}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="State Bank of India"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank Account Number</label>
              <input
                type="text"
                value={profile.account_number_masked || ''}
                onChange={(e) => handleChange('account_number_masked', e.target.value)}
                placeholder="30981234567"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl font-mono text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Bank IFSC Code</label>
              <input
                type="text"
                value={profile.ifsc_code || ''}
                onChange={(e) => handleChange('ifsc_code', e.target.value.toUpperCase())}
                placeholder="SBIN0001234"
                className="w-full px-3 py-2 bg-[#0D1527] border border-[#1E2D4A] rounded-xl font-mono text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="py-3 px-8 rounded-xl bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-600/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Update Profile</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

