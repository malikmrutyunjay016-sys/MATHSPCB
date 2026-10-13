import React from 'react';
import { X, HelpCircle, ChevronRight } from 'lucide-react';

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

export const FAQModal: React.FC<FAQModalProps> = ({ isOpen, onClose, onNavigate }) => {
  if (!isOpen) return null;

  const faqs = [
    {
      q: 'How can I take admission into B.Sc. (Hons) Mathematics at Panchayat College?',
      a: 'Admissions are conducted through the centralized Student Academic Management System (SAMS Odisha) portal of the Higher Education Department, Govt. of Odisha. Candidates must have completed +2 Science with Mathematics as a compulsory subject.',
    },
    {
      q: 'Which university curriculum is followed for examinations?',
      a: 'The department follows the Choice Based Credit System (CBCS) model syllabus approved by the Department of Higher Education, Odisha and affiliated to Sambalpur University, Jyoti Vihar, Burla.',
    },
    {
      q: 'How many books can a student borrow from the Department Library?',
      a: 'Honours students may borrow up to 3 textbook volumes simultaneously for 15 days, renewable upon verification. Reference monographs and research journals are reserved for in-library reading.',
    },
    {
      q: 'Where can I access Previous Year Question Papers?',
      a: 'The website features a dedicated Previous Year Questions repository organized by Academic Sessions (2023–26) and Semesters I through VI, with instant PDF downloads.',
    },
    {
      q: 'Who should students approach for Anti-Ragging or Grievance concerns?',
      a: 'Students may contact the Head of the Department or the Convener of the Anti-Ragging Committee directly via phone, email, or visit Room 32 in the Department of Mathematics.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-[#0b1a2f] text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                Department Helpdesk
              </span>
              <h3 className="text-lg font-bold">Frequently Asked Questions</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
            >
              <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2">
                <span className="text-blue-700 font-mono">Q{idx + 1}.</span>
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed pl-6">
                {faq.a}
              </p>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Need more assistance? Reach out to our department office.
          </span>
          <button
            onClick={() => {
              onClose();
              onNavigate('contact');
            }}
            className="px-4 py-2 bg-[#0c2340] hover:bg-blue-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
          >
            <span>Contact Us</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
