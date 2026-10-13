import React, { useState } from 'react';
import {
  Scale,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { Committee } from '../types';
import { useAuth } from '../context/AuthContext';

interface CommitteesPageProps {
  committees: Committee[];
  onAddCommittee: () => void;
  onEditCommittee: (committee: Committee) => void;
  onDeleteCommittee: (id: string, name: string) => void;
}

export const CommitteesPage: React.FC<CommitteesPageProps> = ({
  committees,
  onAddCommittee,
  onEditCommittee,
  onDeleteCommittee,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommittees = committees.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.convener.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.responsibilities.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-900 border border-purple-200 text-xs font-bold uppercase tracking-wider">
              <Scale className="w-3.5 h-3.5 text-purple-700" />
              <span>Institutional Governance & Redressal</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Essential College & Department Committees
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Official institutional committees ensuring campus welfare, academic standards, gender equity, anti-ragging compliance, and student grievance redressal.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={onAddCommittee}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Committee</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search committees by name, convener or responsibilities..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredCommittees.length}</strong> active statutory bodies
          </div>
        </div>

        {/* Committee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredCommittees.map((comm) => (
            <div
              key={comm.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-100/70 px-2.5 py-0.5 rounded inline-block mb-1">
                      Statutory Cell
                    </span>
                    <h3 className="font-serif-academic text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-900 transition leading-snug">
                      {comm.name}
                    </h3>
                  </div>
                </div>

                {/* Convener Box */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Convener / Chairperson:
                    </span>
                    <span className="text-[11px] font-semibold text-purple-800">
                      {comm.designation}
                    </span>
                  </div>
                  <p className="font-bold text-slate-900 text-sm">{comm.convener}</p>
                </div>

                {/* Members */}
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    Committee Members & Representatives
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-[11px] leading-relaxed">
                    {comm.members}
                  </p>
                </div>

                {/* Responsibilities */}
                <div className="text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Core Mandate & Responsibilities
                  </span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {comm.responsibilities}
                  </p>
                </div>

                {/* Contact & Location Strip */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                    <a
                      href={`tel:${comm.contactNumber}`}
                      className="truncate hover:text-blue-900 font-mono text-[11px]"
                    >
                      {comm.contactNumber || 'Via Dept Office'}
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <a
                      href={`mailto:${comm.email}`}
                      className="truncate hover:text-amber-900 text-[11px]"
                    >
                      {comm.email || 'college@panchayatcollege.edu.in'}
                    </a>
                  </div>

                  <div className="sm:col-span-2 flex items-center gap-2 text-slate-500 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Office: {comm.office}</span>
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Admin Actions</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditCommittee(comm)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                      title="Edit Committee"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCommittee(comm.id, comm.name)}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
                      title="Delete Committee"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
