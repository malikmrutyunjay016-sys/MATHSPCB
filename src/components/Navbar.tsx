import React, { useState } from 'react';
import {
  GraduationCap,
  Menu,
  X,
  Search,
  ShieldCheck,
  UserCheck,
  Bell,
  PhoneCall,
  LogIn,
  LogOut,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Notice } from '../types';
import { CollegeLogo } from './CollegeLogo';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSearch: () => void;
  onOpenStudentPortal?: (mode?: 'register' | 'login') => void;
  marqueeText?: string;
  notices?: Notice[];
  onOpenLogoEditor?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSearch,
  onOpenStudentPortal,
  marqueeText,
  notices = [],
  onOpenLogoEditor,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin, signInWithGoogle, signOut, openAdminLoginModal } = useAuth();
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  // Active notices for scrolling ticker
  const activeNotices = notices.filter((n) => !n.isArchived);

  // Fallback notice items if activeNotices is empty
  const defaultNoticeTicker = [
    {
      id: 'def-1',
      title: 'Admissions 2026–27',
      category: 'Notice',
      description: 'Applications open for B.Sc. (Hons) Mathematics at Panchayat College, Baragada',
    },
    {
      id: 'def-2',
      title: 'Semester Exams Schedule',
      category: 'Examination',
      description: 'Mid-term assessment dates and timetable notified on departmental board',
    },
    {
      id: 'def-3',
      title: 'Guest Lecture Series',
      category: 'Seminar',
      description: 'Special lecture on Riemann Hypothesis and Prime Distribution in Aryabhata Hall',
    },
  ];

  const noticeItemsToScroll = activeNotices.length > 0
    ? activeNotices.map((n) => ({
        id: n.id,
        title: n.title,
        category: n.category,
        description: n.description,
      }))
    : defaultNoticeTicker;

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'faculty', label: 'Faculty' },
    { id: 'students', label: 'Students' },
    { id: 'syllabus', label: 'Syllabus' },
    { id: 'timetable', label: 'Time Table' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'library', label: 'Library' },
    { id: 'pyq', label: 'Previous Year Questions' },
    { id: 'notices', label: 'Notices' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'committees', label: 'Committees' },
    { id: 'contacts', label: 'Important Contacts' },
    { id: 'contact', label: 'Contact' },
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs print:hidden">
      {/* Top Utility & Notification Ribbon */}
      <div className="bg-[#0b172a] text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-4">
          <button
            onClick={() => handleNavClick('notices')}
            className="inline-flex items-center gap-1.5 font-semibold text-amber-400 uppercase tracking-wider text-[11px] shrink-0 bg-amber-950/80 hover:bg-amber-900/90 hover:text-amber-300 px-2.5 py-0.5 rounded border border-amber-700/60 shadow-xs cursor-pointer transition-colors"
            title="Go to Menu -> Notices & Circulars page"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Notice</span>
          </button>

          {/* Continuous Leftward Scrolling Notice Ticker (Title + Description) */}
          <div
            onClick={() => handleNavClick('notices')}
            className="overflow-hidden cursor-pointer flex-1 py-0.5"
            title="Click to view all notices in detail"
          >
            <div className="animate-marquee whitespace-nowrap flex items-center">
              {/* First loop of notices */}
              <div className="flex items-center">
                {noticeItemsToScroll.map((item, idx) => (
                  <span
                    key={`notice-1-${item.id}-${idx}`}
                    className="inline-flex items-center gap-2 px-4 hover:text-amber-300 transition-colors"
                  >
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0">
                      {item.category}
                    </span>
                    <span className="font-semibold text-slate-100 text-xs">{item.title}:</span>
                    <span className="text-slate-300 font-normal text-xs">{item.description}</span>
                    <span className="text-amber-500/50 mx-3 text-xs">◆</span>
                  </span>
                ))}
              </div>

              {/* Second identical loop for seamless continuous scrolling */}
              <div className="flex items-center">
                {noticeItemsToScroll.map((item, idx) => (
                  <span
                    key={`notice-2-${item.id}-${idx}`}
                    className="inline-flex items-center gap-2 px-4 hover:text-amber-300 transition-colors"
                  >
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0">
                      {item.category}
                    </span>
                    <span className="font-semibold text-slate-100 text-xs">{item.title}:</span>
                    <span className="text-slate-300 font-normal text-xs">{item.description}</span>
                    <span className="text-amber-500/50 mx-3 text-xs">◆</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-slate-300 text-[11px]">
          <a
            href="https://panchayatcollege.in/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-300 transition-colors hidden sm:inline"
          >
            College Official Website
          </a>
          <a
            href="https://www.samsodisha.gov.in/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-300 transition-colors hidden sm:inline text-amber-200 font-medium"
          >
            SAMS Odisha Portal
          </a>
          <a
            href="https://www.suniv.ac.in/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-amber-300 transition-colors hidden md:inline"
          >
            Sambalpur University
          </a>

          {/* Admin Auth Pill */}
          <div className="relative">
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('admin')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </button>
                <button
                  onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                  className="text-slate-400 hover:text-white p-1"
                  title="Admin details"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAdminLoginModal({ startMode: 'login' })}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-amber-300 transition px-2.5 py-1 rounded border border-slate-700 hover:border-amber-400/60 bg-slate-900/80 cursor-pointer text-xs font-semibold"
                title="Department Administrator Login"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>
            )}

            {showAdminDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-3 z-50 text-slate-200">
                <div className="text-xs font-semibold text-amber-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Department Administration</span>
                  <button
                    onClick={() => setShowAdminDropdown(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2.5 text-xs space-y-2">
                  {user ? (
                    <div>
                      <p className="text-slate-400">Signed in as:</p>
                      <p className="font-semibold text-white truncate">
                        {user.displayName && !user.displayName.includes('@')
                          ? user.displayName
                          : 'College Official'}
                      </p>
                      <p className="text-[10px] text-amber-300 mt-1">
                        {isAdmin ? '✓ Authorized Administrator' : 'Standard Visitor'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Authorized portal access is strictly restricted to designated administrators possessing Admin ID & Password.
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    {!isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            setShowAdminDropdown(false);
                            openAdminLoginModal({ startMode: 'login' });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition cursor-pointer shadow-xs"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Log In with Admin ID & Password
                        </button>

                        <button
                          onClick={() => {
                            setShowAdminDropdown(false);
                            openAdminLoginModal({ startMode: 'change_password' });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-xs transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Change Administrator Password
                        </button>

                        {!user && (
                          <button
                            onClick={async () => {
                              setShowAdminDropdown(false);
                              try {
                                const res = await signInWithGoogle();
                                if (!res.success && res.error) {
                                  openAdminLoginModal({
                                    startMode: 'login',
                                    authErrorMessage: res.error,
                                  });
                                }
                              } catch (err: any) {
                                openAdminLoginModal({
                                  startMode: 'login',
                                  authErrorMessage: err?.message || 'Google Sign-In failed.',
                                });
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-blue-600/80 hover:bg-blue-600 text-white rounded font-medium text-xs transition cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5" /> Google Sign In (College Official)
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          onClick={() => {
                            setShowAdminDropdown(false);
                            setActiveTab('admin');
                          }}
                          className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-xs transition cursor-pointer"
                        >
                          Open Admin Dashboard
                        </button>

                        <button
                          onClick={() => {
                            setShowAdminDropdown(false);
                            openAdminLoginModal({ startMode: 'change_password' });
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded text-xs transition cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Change Admin Password
                        </button>

                        <button
                          onClick={async () => {
                            setShowAdminDropdown(false);
                            await signOut();
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1 px-3 text-red-300 hover:text-red-200 hover:bg-red-950/40 rounded text-xs transition cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" /> Log Out / Exit Admin
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header / College Seal & Brand Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <div
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3.5 cursor-pointer group"
        >
          {/* Official Emblem / College Logo */}
          <CollegeLogo
            className="w-12 h-12 sm:w-14 sm:h-14 transition-transform group-hover:scale-105"
            onClick={onOpenLogoEditor}
            title={isAdmin ? "Click to edit department logo" : "Department Emblem"}
          />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-serif-academic text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#0c2340] group-hover:text-blue-900 transition-colors">
                Department of Mathematics
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <span className="text-amber-700 font-bold">Panchayat College, Baragada</span>
              <span className="hidden sm:inline text-slate-400">|</span>
              <span className="hidden sm:inline text-slate-500 font-normal">
                District Baragada, Odisha (Pin: 768028)
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition cursor-pointer hover:border-slate-300"
            title="Search Department Portal"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>Search faculty, papers...</span>
            <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
              /
            </kbd>
          </button>

          <button
            onClick={() => handleNavClick('contacts')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold border border-blue-200/80 transition cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-blue-700" />
            <span>Helpline</span>
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer border border-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="hidden sm:inline font-bold">MENU</span>
          </button>
        </div>
      </div>

      {/* Primary Desktop Navigation Bar */}
      <nav className="hidden lg:block bg-[#0f223d] text-white border-t border-[#1d3557]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <ul className="flex items-center space-x-1 py-1 overflow-x-auto no-scrollbar max-w-full">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      className={`px-2.5 xl:px-3 py-1.5 xl:py-2 text-[11px] xl:text-xs uppercase tracking-wider font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Quick SAMS / Admissions Link */}
            <div className="flex items-center gap-3 text-xs text-amber-300">
              <span className="hidden xl:inline text-slate-300 text-[11px]">
                NEP Curriculum • UG / PG
              </span>
              <button
                onClick={() => handleNavClick('admin')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-t border-slate-800 text-white animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-md text-sm font-semibold transition flex items-center justify-between ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-slate-950"></span>}
                </button>
              );
            })}

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={() => handleNavClick('admin')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold rounded text-sm transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Admin Dashboard
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenSearch();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 text-slate-200 rounded text-sm"
              >
                <Search className="w-4 h-4" /> Search Department Website
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
