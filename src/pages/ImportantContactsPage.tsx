import React, { useState } from 'react';
import {
  PhoneCall,
  Mail,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  ShieldAlert,
  Building,
} from 'lucide-react';
import { ImportantContact } from '../types';
import { useAuth } from '../context/AuthContext';

interface ImportantContactsPageProps {
  contacts: ImportantContact[];
  onAddContact: () => void;
  onEditContact: (contact: ImportantContact) => void;
  onDeleteContact: (id: string, name: string) => void;
}

export const ImportantContactsPage: React.FC<ImportantContactsPageProps> = ({
  contacts,
  onAddContact,
  onEditContact,
  onDeleteContact,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.office.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold uppercase tracking-wider">
              <PhoneCall className="w-3.5 h-3.5 text-amber-700" />
              <span>Official Institutional Directory</span>
            </div>
            <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
              Important Contacts & Emergency Helpdesk
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              Direct telephone and email directory for the Head of Department, Principal Secretariat, Examination Controller, Admission Desk, Library, and 24x7 Anti-Ragging Helplines.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={onAddContact}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
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
              placeholder="Search by office name, designation, location..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:outline-hidden focus:border-blue-600"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-900">{filteredContacts.length}</strong> official contacts
          </div>
        </div>

        {/* Contacts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0c2340] to-blue-800 text-amber-300 flex items-center justify-center font-bold text-xs shadow-xs">
                    <Building className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    Order #{contact.order || 1}
                  </span>
                </div>

                <div>
                  <h3 className="font-serif-academic text-base sm:text-lg font-bold text-[#0c2340] group-hover:text-blue-900 transition leading-snug">
                    {contact.name}
                  </h3>
                  <p className="text-xs font-semibold text-amber-800 mt-0.5">
                    {contact.designation}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{contact.office}</span>
                  </p>
                </div>

                {/* Direct Action Buttons (Call / Email) */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${contact.phone}`}
                    className="py-2 px-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`mailto:${contact.email}`}
                    className="py-2 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                </div>

                <div className="space-y-1 text-xs text-slate-600 pt-1">
                  <div className="text-[11px] font-mono text-slate-800 truncate">
                    <strong>Tel:</strong> {contact.phone}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    <strong>Email:</strong> {contact.email}
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Admin Control</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onEditContact(contact)}
                      className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600"
                      title="Edit Contact"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteContact(contact.id, contact.name)}
                      className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600"
                      title="Delete Contact"
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
