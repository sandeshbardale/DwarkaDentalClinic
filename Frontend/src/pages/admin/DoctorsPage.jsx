import { useState, useEffect, useCallback } from 'react';
import { Stethoscope, RefreshCw, Search, Edit3, Plus } from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { api } from '../../utils/api';

const DEFAULT_DOCTORS = [
  { id: 'doc-1', name: 'Dr. Bhagwan Rakh', specialization: 'Senior Dental Surgeon & Orthodontist', email: 'dr.bhagwan@dwarkadental.com', phone: '+91 98765 11111', status: 'active' },
  { id: 'doc-2', name: 'Dr. H M Sanap', specialization: 'Endodontist & Root Canal Specialist', email: 'dr.sanap@dwarkadental.com', phone: '+91 98765 22222', status: 'active' },
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState(DEFAULT_DOCTORS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Edit & Add State
  const [editDoc, setEditDoc] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialization: 'General Dentistry' });
  const [saving, setSaving] = useState(false);

  const loadDoctors = useCallback(async () => {
    setLoading(true);
    let localDocs = [];
    try {
      const raw = localStorage.getItem('ddc_doctors_v1');
      if (raw) localDocs = JSON.parse(raw);
    } catch (_) {}

    try {
      const res = await api.getDoctors();
      const apiDocs = Array.isArray(res.data) && res.data.length > 0 ? res.data : [];
      const mergedMap = new Map();
      DEFAULT_DOCTORS.forEach(d => mergedMap.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => mergedMap.set(d.name.toLowerCase(), d));
      apiDocs.forEach(d => mergedMap.set(d.name.toLowerCase(), d));

      const mergedList = Array.from(mergedMap.values());
      setDoctors(mergedList);
      localStorage.setItem('ddc_doctors_v1', JSON.stringify(mergedList));
    } catch (err) {
      console.error(err);
      const mergedMap = new Map();
      DEFAULT_DOCTORS.forEach(d => mergedMap.set(d.name.toLowerCase(), d));
      localDocs.forEach(d => mergedMap.set(d.name.toLowerCase(), d));
      setDoctors(Array.from(mergedMap.values()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDoctors(); }, [loadDoctors]);

  function handleEditClick(doc) {
    setEditDoc(doc);
    setForm({
      name: doc.name || '',
      email: doc.email || '',
      phone: doc.phone || '',
      specialization: doc.specialization || 'General Dentistry',
      password: '',
    });
  }

  function handleAddClick() {
    setIsAdding(true);
    setForm({ name: '', email: '', phone: '', specialization: 'General Dentistry', password: 'Password@123' });
  }

  async function handleSaveSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isAdding) {
        const res = await api.createStaff({ ...form, role: 'doctor' }).catch(() => null);
        const newObj = res?.data || { id: `doc-${Date.now()}`, ...form, role: 'doctor', status: 'active' };
        setDoctors(prev => {
          const updated = [newObj, ...prev];
          try { localStorage.setItem('ddc_doctors_v1', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        setIsAdding(false);
      } else if (editDoc) {
        const targetId = editDoc.id || editDoc._id;
        await api.updateStaff(targetId, form).catch(() => null);
        setDoctors(prev => {
          const updated = prev.map(d => (d.id === targetId || d._id === targetId || d.name === editDoc.name) ? { ...d, ...form } : d);
          try { localStorage.setItem('ddc_doctors_v1', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        setEditDoc(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  const filtered = search
    ? doctors.filter(d =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        (d.specialization || '').toLowerCase().includes(search.toLowerCase())
      )
    : doctors;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Doctors Directory</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {loading ? 'Loading…' : `${doctors.length} active doctor(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadDoctors} className="btn btn-outline btn-sm flex items-center gap-1">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleAddClick} className="btn btn-primary btn-sm flex items-center gap-1.5 font-semibold">
            <Plus size={16} /> Add Doctor
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center gap-2 bg-white border border-[var(--color-border)] rounded-xl shadow-xs">
        <Search size={16} className="text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder="Search by doctor name or specialization…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="form-input flex-1 bg-transparent border-none outline-none text-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[var(--color-border)] animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-[var(--color-border)] rounded animate-pulse" />
                  <div className="h-3 bg-[var(--color-border)] rounded animate-pulse w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-3">
              <EmptyState icon={Stethoscope} title="No doctors found" description="No active doctors in the database." />
            </div>
          ) : (
            filtered.map(doc => {
              const docId = doc.id || doc._id;
              return (
                <div key={docId} className="card p-5 hover:shadow-md transition-shadow bg-white border border-[var(--color-border)] rounded-xl space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={doc.name} size="lg" />
                      <div>
                        <p className="font-bold text-base text-[var(--color-text)]">{doc.name}</p>
                        <p className="text-xs font-semibold text-[var(--color-primary-600)]">{doc.specialization || 'General Dentistry'}</p>
                      </div>
                    </div>
                    <span className="badge badge-green text-xs">Active</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[var(--color-text-muted)] border-t border-[var(--color-border)] pt-3">
                    {doc.phone && <p>📞 {doc.phone}</p>}
                    {doc.email && <p>✉️ {doc.email}</p>}
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      onClick={() => handleEditClick(doc)}
                      className="btn btn-outline btn-xs flex items-center gap-1 text-[var(--color-primary-600)] cursor-pointer"
                    >
                      <Edit3 size={12} /> Edit Doctor Info
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Edit / Add Doctor Modal */}
      {(editDoc || isAdding) && (
        <Modal open={true} onClose={() => { setEditDoc(null); setIsAdding(false); }} title={isAdding ? "Add New Doctor" : `Edit Doctor Info — ${editDoc?.name}`} size="md">
          <form onSubmit={handleSaveSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Doctor Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="form-input text-sm"
                placeholder="e.g. Dr. Bhagwan Rakh"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Specialization *</label>
                <input
                  type="text"
                  required
                  value={form.specialization}
                  onChange={e => setForm({ ...form, specialization: e.target.value })}
                  className="form-input text-sm"
                  placeholder="e.g. Orthodontist, Endodontist"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="form-input text-sm"
                  placeholder="doctor@dwarkadental.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="form-input text-sm"
                  placeholder="+91 98765 00000"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1">
                  {isAdding ? "Set Account Password *" : "Reset Password (Optional)"}
                </label>
                <input
                  type="text"
                  required={isAdding}
                  value={form.password || ''}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="form-input text-sm font-mono text-violet-700 font-bold"
                  placeholder={isAdding ? "Type Login Password (e.g. DocPass123)" : "Leave blank to keep unchanged"}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => { setEditDoc(null); setIsAdding(false); }} className="btn btn-outline btn-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary btn-sm font-semibold">
                {saving ? 'Saving...' : 'Save Doctor Info'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
