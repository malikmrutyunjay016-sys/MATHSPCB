import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Image as ImageIcon,
} from 'lucide-react';
import { Facility } from '../types';
import { useAuth } from '../context/AuthContext';
import { CollegeLogo } from './CollegeLogo';

interface HeroSectionProps {
  onNavigate: (tabId: string) => void;
  facilities?: Facility[];
  onAddFacility?: () => void;
  onEditFacility?: (facility: Facility) => void;
  onDeleteFacility?: (id: string, name: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onNavigate,
  facilities = [],
  onAddFacility,
  onEditFacility,
  onDeleteFacility,
}) => {
  const { isAdmin } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      badge: 'DEPARTMENT OF MATHEMATICS',
      title: 'MATHEMATICS,',
      highlight: 'WHERE MINDS SHAPE THE INFINITE',
      subtext:
        'Panchayat College, Baragada — Established 1960. Fostering analytical rigor, pure discovery, and computational brilliance in Western Odisha.',
      tagline: 'Excellence in Mathematical Education, Learning and Research',
      accentColor: 'from-amber-400 to-amber-200',
    },
    {
      badge: 'PANCHAYAT COLLEGE, BARAGADA',
      title: 'INSPIRING DISCOVERY,',
      highlight: 'ADVANCING KNOWLEDGE & RESEARCH',
      subtext:
        'Undergraduate Honours and Postgraduate curriculum aligned with Sambalpur University, equipped with computational simulation labs and digital resources.',
      tagline: 'Empowering future mathematicians, researchers, and educators.',
      accentColor: 'from-blue-400 to-indigo-200',
    },
    {
      badge: 'STUDENT PORTAL & RESOURCES',
      title: 'EMPOWERING STUDENTS,',
      highlight: 'FROM FOUNDATIONS TO FRONTIERS',
      subtext:
        'Access comprehensive question banks, syllabus guides, reference library books, and direct faculty mentoring.',
      tagline: 'A vibrant academic ecosystem dedicated to student success.',
      accentColor: 'from-emerald-400 to-teal-200',
    },
  ];

  const featuredFacilities = [
    {
      title: 'Ramanujan Smart Classroom',
      category: 'Smart Learning Space',
      desc: 'Air-conditioned digital theatre equipped with 86" interactive touch flat panel, 4K lecture recording, and high-fidelity acoustics for hybrid seminars.',
      image:
        'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=700&q=80',
      tab: 'students',
      linkText: 'Department & Academic Programs',
    },
    {
      title: 'Computational Mathematics Lab',
      category: '32-Seat High-Performance Lab',
      desc: 'Configured with MATLAB Campus Suite, Python SciPy Stack, and Mathematica for simulation, data analysis, and numerical algorithms.',
      image:
        'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=700&q=80',
      tab: 'students',
      linkText: 'Computing Curriculum',
    },
    {
      title: 'Srinivasa Ramanujan Library',
      category: 'Department Reference Wing',
      desc: 'Over 1,250 curated mathematical textbooks, national competitive examination handbooks (CSIR NET, GATE, JAM), and e-resources.',
      image:
        'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=700&q=80',
      tab: 'library',
      linkText: 'Search Book Catalog',
    },
  ];

  const [facilityIndex, setFacilityIndex] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  // Auto-scroll hero slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Dynamic showcase items populated from facilities collection
  const showcaseItems =
    facilities.length > 0
      ? facilities.map((f) => ({
          id: f.id,
          raw: f,
          title: f.name,
          category: f.category || 'Department Showcase',
          desc: f.description || '',
          image: f.photoUrl,
          tab: 'home',
          linkText: 'Campus Infrastructure',
        }))
      : featuredFacilities.map((f, i) => ({
          id: `featured-${i}`,
          raw: null as Facility | null,
          title: f.title,
          category: f.category,
          desc: f.desc,
          image: f.image,
          tab: f.tab,
          linkText: f.linkText,
        }));

  // Auto-scroll showcase facility photos every 5 seconds
  useEffect(() => {
    if (showcaseItems.length <= 1) return;
    const timer = setInterval(() => {
      setFacilityIndex((prev) => (prev + 1) % showcaseItems.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [showcaseItems.length]);

  const safeFacilityIndex =
    showcaseItems.length > 0
      ? Math.min(facilityIndex, Math.max(0, showcaseItems.length - 1))
      : 0;

  const nextFacility = () => {
    if (showcaseItems.length <= 1) return;
    setFacilityIndex((prev) => (prev + 1) % showcaseItems.length);
  };
  const prevFacility = () => {
    if (showcaseItems.length <= 1) return;
    setFacilityIndex(
      (prev) => (prev - 1 + showcaseItems.length) % showcaseItems.length
    );
  };

  const activeSlideData = heroSlides[currentSlide];
  const activeFacilityData = showcaseItems[safeFacilityIndex];

  return (
    <section className="relative bg-[#071324] text-white min-h-[580px] lg:min-h-[660px] flex flex-col justify-between overflow-hidden border-b border-slate-800">
      {/* Background Architectural & Geometric Pattern Overlays */}
      <div
        className="absolute inset-0 opacity-25 mix-blend-screen pointer-events-none bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1800&q=80')`,
        }}
      />
      {/* Mathematical grid and dark gradient vignettes */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#071324] via-[#091b33]/90 to-[#0c2343]/80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.35),rgba(255,255,255,0))]" />

      {/* Floating Mathematical Glyphs Background Texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5 select-none font-serif text-8xl text-white">
        <span className="absolute top-12 left-10">∫</span>
        <span className="absolute top-32 left-1/3">∑</span>
        <span className="absolute top-20 right-1/4">π</span>
        <span className="absolute bottom-24 left-1/4">√x</span>
        <span className="absolute bottom-16 right-16">∞</span >
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-12 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Title & Emblem (Mirroring Yonsei University Style) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Academic Crest Icon Badge */}
            <div className="flex items-center gap-3">
              <CollegeLogo className="w-14 h-14" />
              <div className="flex flex-col">
                <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">
                  {activeSlideData.badge}
                </span>
                <span className="text-slate-300 text-[11px] tracking-wide italic">
                  Panchayat College, Baragada, Sambalpur University Affiliated
                </span>
              </div>
            </div>

            {/* Grand Headline & Academic Tagline (Smooth animated slide) */}
            <div key={currentSlide} className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h1 className="font-serif-academic text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] text-white">
                  {activeSlideData.title}
                  <br />
                  <span className={`bg-gradient-to-r ${activeSlideData.accentColor} bg-clip-text text-transparent`}>
                    {activeSlideData.highlight}
                  </span>
                </h1>
              </div>

              {/* Academic Tagline & Subtext */}
              <div className="space-y-2 max-w-xl">
                <p className="font-playfair italic text-amber-300 text-base sm:text-lg">
                  &ldquo;{activeSlideData.tagline}&rdquo;
                </p>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {activeSlideData.subtext}
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('faculty')}
                className="px-5 py-2.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>Faculty Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => onNavigate('students')}
                className="px-5 py-2.5 rounded-sm bg-white/10 hover:bg-white/20 text-white font-semibold text-xs uppercase tracking-wider border border-white/20 transition cursor-pointer flex items-center gap-2"
              >
                <span>Student Database</span>
              </button>

              <button
                onClick={() => onNavigate('pyq')}
                className="px-5 py-2.5 rounded-sm bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 font-semibold text-xs uppercase tracking-wider border border-blue-700/50 transition cursor-pointer"
              >
                <span>Previous Year Questions</span>
              </button>
            </div>

            {/* Carousel Navigation & 7-Second Auto-Scroll Indicator */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={prevSlide}
                className="p-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
                title="Previous slide"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-2">
                {heroSlides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 transition-all duration-500 rounded-full cursor-pointer ${
                      currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              <button
                onClick={nextSlide}
                className="p-1 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
                title="Next slide"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-mono text-slate-400 ml-1">
                {currentSlide + 1} / {heroSlides.length}
              </span>
            </div>
          </div>

          {/* Right Column: Floating Campus / Department Facility Card (Mirroring Right Card in Photo) */}
          <div className="lg:col-span-5">
            <div className="bg-[#0b1d35]/90 border border-slate-700/80 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md relative group">
              {showcaseItems.length === 0 ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif-academic text-base font-bold text-white">
                      Department Campus Showcase
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      No photos added yet. Admins can upload photos and add descriptions to feature here.
                    </p>
                  </div>
                  {isAdmin && onAddFacility && (
                    <button
                      onClick={onAddFacility}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 mx-auto shadow-md transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add First Photo &amp; Description</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Card Photo Preview */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
                    <img
                      key={safeFacilityIndex}
                      src={activeFacilityData.image}
                      alt={activeFacilityData.title}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105 animate-fadeIn"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=700&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b1d35] via-transparent to-black/35" />
                    
                    {/* Category Badge */}
                    <span className="absolute top-3 left-3 bg-[#0c2340]/90 text-amber-300 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded border border-amber-400/30 uppercase shadow-xs">
                      {activeFacilityData.category}
                    </span>

                    {/* 5-Second Auto-Scroll Indicator Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800/80 overflow-hidden">
                      <div
                        key={`timer-${safeFacilityIndex}`}
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-[5000ms] ease-linear w-full"
                      />
                    </div>

                    {/* Admin Action Controls: Edit photo & description, Remove photo */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                        {activeFacilityData.raw && onEditFacility && (
                          <button
                            onClick={() => onEditFacility(activeFacilityData.raw!)}
                            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-amber-400/50 rounded shadow-md transition cursor-pointer"
                            title="Edit photo & description"
                            aria-label="Edit photo & description"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {activeFacilityData.raw && onDeleteFacility && (
                          <button
                            onClick={() =>
                              onDeleteFacility(
                                activeFacilityData.raw!.id,
                                activeFacilityData.raw!.name
                              )
                            }
                            className="p-1.5 bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-500/50 rounded shadow-md transition cursor-pointer"
                            title="Remove this photo"
                            aria-label="Remove this photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif-academic text-base sm:text-lg font-bold text-white">
                        {activeFacilityData.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-amber-400">
                          {safeFacilityIndex + 1} / {showcaseItems.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={prevFacility}
                            disabled={showcaseItems.length <= 1}
                            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition cursor-pointer"
                            aria-label="Previous photo"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={nextFacility}
                            disabled={showcaseItems.length <= 1}
                            className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white transition cursor-pointer"
                            aria-label="Next photo"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-3">
                      {activeFacilityData.desc || 'No description provided.'}
                    </p>

                    {/* Sub-links & Admin Quick Edit */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onNavigate(activeFacilityData.tab)}
                        className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>{activeFacilityData.linkText}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <div className="flex items-center gap-2">
                        {isAdmin && activeFacilityData.raw && onEditFacility && (
                          <button
                            onClick={() => onEditFacility(activeFacilityData.raw!)}
                            className="text-amber-400 hover:text-amber-300 transition text-[11px] font-semibold underline underline-offset-2 cursor-pointer"
                          >
                            Edit Description
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtle Down Chevron Scroll Indicator (Mirroring Photo) */}
      <div className="pb-3 flex justify-center items-center text-slate-400 hover:text-white transition">
        <a
          href="#gateway-section"
          className="flex flex-col items-center gap-1 text-[10px] uppercase tracking-widest opacity-80 hover:opacity-100"
        >
          <ChevronDown className="w-5 h-5 text-amber-400/80 animate-bounce" />
        </a>
      </div>
    </section>
  );
};
