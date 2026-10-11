import React, { useState } from 'react';
import { SEO } from '../components/ui/SEO';
import { materials, MaterialItem } from '../data/materials';
import { MaterialCard } from '../components/ui/MaterialCard';
import {
  FolderDown,
  Sparkles,
  Lock,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MaterialsPage: React.FC = () => {
  const [selectedExam, setSelectedExam] = useState<'All' | 'GATE'>('All');
  const [selectedSubject, setSelectedSubject] = useState<'All' | 'Chemistry' | 'Physics'>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'All',
    'Study Notes',
    'Previous Year Papers',
    'Practice Sets',
    'Mock Tests',
    'Revision Sheets',
  ];

  const filteredMaterials = materials.filter((item) => {
    const matchesExam = selectedExam === 'All' || item.exam === selectedExam;
    const matchesSubject = selectedSubject === 'All' || item.subject === selectedSubject;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesExam && matchesSubject && matchesCategory && matchesSearch;
  });

  return (
    <>
      <SEO
        title="Study Materials, PYQs & Mock Tests — GATE Chemistry & Physics"
        description="Access structured study notes, previous year question banks, mock test papers, and rapid revision sheets for GATE Chemistry and Physics preparation."
      />

      {/* Header */}
      <section className="bg-gradient-to-b from-primary-50/60 to-white py-14 sm:py-20 border-b border-gray-100">
        <div className="container-max text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <FolderDown className="w-3.5 h-3.5" />
            <span>Digital Academic Repository</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-navy-500">
            Study Materials &amp; Resources
          </h1>

          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            High-yield PDF lecture notes, solved 10-year question banks, rapid revision sheets, and exam simulation papers.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Free Sample Sheets Included
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              Complete Library Unlocked for Enrolled Students
            </span>
          </div>
        </div>
      </section>

      {/* Filters and Search Bar Section */}
      <section className="py-8 bg-gray-50/80 border-b border-gray-200">
        <div className="container-max space-y-4">
          {/* Top row: Search input + Exam Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notes, topics or PYQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10 text-sm py-2.5"
              />
            </div>

            {/* Exam Selectors */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {(['All', 'GATE'] as const).map((exam) => (
                <button
                  key={exam}
                  type="button"
                  onClick={() => setSelectedExam(exam)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedExam === exam
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-white text-navy-500 border border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {exam === 'All' ? 'All Exams' : exam}
                </button>
              ))}
            </div>
          </div>

          {/* Bottom row: Subject and Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-200/60">
            {/* Subject Filters */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Subject:
              </span>
              {(['All', 'Chemistry', 'Physics'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedSubject === sub
                      ? 'bg-navy-500 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-primary-50 text-primary-600 font-bold border border-primary-300'
                      : 'text-gray-500 hover:text-navy-500'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Materials Grid */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-navy-500">
              Available Resources ({filteredMaterials.length})
            </h3>
            <span className="text-xs text-gray-400">
              Showing filtered results
            </span>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-200 space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="text-lg font-bold text-navy-500">
                No matching materials found
              </h4>
              <p className="text-xs text-gray-500">
                Try adjusting your search keywords or switching filters to view all documents.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedExam('All');
                  setSelectedSubject('All');
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="btn-secondary text-xs px-4 py-2 mt-2"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredMaterials.map((mat) => (
                <MaterialCard key={mat.id} material={mat} />
              ))}
            </div>
          )}

          {/* Bottom Callout Banner */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="text-xl font-bold text-navy-500">
                Unlock Complete Access to All 50+ Modules &amp; Mock Tests
              </h4>
              <p className="text-xs sm:text-sm text-gray-600">
                Enroll in the 100-day coaching program to download verified solutions, formula charts and mock CBT exams.
              </p>
            </div>
            <Link
              to="/payment"
              className="btn-primary text-xs sm:text-sm font-bold px-6 py-3 whitespace-nowrap shadow-md"
            >
              Enroll Now — ₹10,000
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default MaterialsPage;
