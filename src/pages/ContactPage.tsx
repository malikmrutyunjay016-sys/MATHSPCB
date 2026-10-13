import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GraduationCap,
} from 'lucide-react';
import { submitContactInquiry } from '../services/db';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('idle');

    try {
      const res = await submitContactInquiry({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (res.success) {
        setSubmissionStatus('success');
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setSubmissionStatus('error');
      }
    } catch {
      setSubmissionStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-900 border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Mail className="w-3.5 h-3.5 text-blue-700" />
            <span>Official Communications</span>
          </div>
          <h1 className="font-serif-academic text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0c2340]">
            Contact Department of Mathematics
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Panchayat College, Baragada, Odisha. We welcome academic inquiries from prospective students, parents, researchers, and alumni.
          </p>
        </div>

        {/* Split Grid: Details & Interactive Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Contact Info & Hours */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0b1a2f] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
              <div>
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-1">
                  Postal Address
                </span>
                <h3 className="font-serif-academic text-lg font-bold">
                  Department of Mathematics
                </h3>
                <p className="text-xs text-amber-300 font-medium">
                  Panchayat College, Baragada
                </p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Ruhunia, Baragada, District Baragada, Odisha, PIN - 768028, India
                  </span>
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-amber-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">
                      Direct Telephone (HoD & Principal)
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white font-mono font-medium">
                      <a
                        href="tel:+917008819698"
                        className="hover:text-amber-300 transition"
                      >
                        +91 70088 19698 (HoD)
                      </a>
                      <span className="text-slate-600 hidden sm:inline">|</span>
                      <a
                        href="tel:+917978520047"
                        className="hover:text-amber-300 transition"
                      >
                        +91 7978520047 (Principal)
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-amber-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">
                      Department Email
                    </span>
                    <a
                      href="mailto:mathoffice.pcb@gmail.com"
                      className="text-white hover:text-amber-300 font-medium"
                    >
                      mathoffice.pcb@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center text-amber-400 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block uppercase font-bold">
                      Office Timings
                    </span>
                    <span className="text-slate-200">
                      Monday to Saturday: 10:00 AM – 5:00 PM
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      Closed on Govt Holidays
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                <a
                  href="https://panchayatcollege.in/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>College Main Site</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-slate-400 text-[11px]">Affiliated to Sambalpur Univ</span>
              </div>
            </div>

            {/* Google Maps Location Preview Card */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-600" />
                  Google Maps Campus Location
                </span>
                <a
                  href="https://maps.google.com/?q=Panchayat+College+Baragada"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-700 hover:underline flex items-center gap-1"
                >
                  <span>Open in Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="h-64 w-full bg-slate-100">
                <iframe
                  title="Panchayat College Baragada Location"
                  src="https://maps.google.com/maps?q=Panchayat+College+Baragada+Odisha&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  className="w-full h-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Contact Inquiry Form (Saves to Firestore) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h2 className="font-serif-academic text-xl sm:text-2xl font-bold text-[#0c2340] mb-1">
              Send an Academic or Administrative Message
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Your inquiry will be logged securely in our department registry and attended to by the office.
            </p>

            {submissionStatus === 'success' && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block font-bold">Thank You! Your message has been received.</strong>
                  The Department of Mathematics will respond to your registered email shortly.
                </div>
              </div>
            )}

            {submissionStatus === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                <div>
                  <strong className="block font-bold">Unable to transmit message.</strong>
                  Please verify your connection or contact us directly at mathoffice.pcb@gmail.com
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Chandra Das"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 94370 12345"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject / Topic *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Admission Inquiry / Syllabus Guidance"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Message Details *
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please state your inquiry, student roll number (if applicable), or relevant details..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-600 text-xs leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#0c2340] hover:bg-blue-950 text-white font-bold rounded-lg uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Department Inquiry</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
