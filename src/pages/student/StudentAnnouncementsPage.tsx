import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, Calendar, Search, X,
} from 'lucide-react';
import { api } from '../../utils/api';

type AnnouncementPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

interface Announcement {
  id: string;
  title: string;
  content: string;
  description?: string;
  message?: string;
  date?: string;
  publishDate?: string;
  priority: AnnouncementPriority;
  category: string;
  keywords: string[];
  audience?: string;
  targetAudience?: string;
}

const priorities: Array<'All' | AnnouncementPriority> = ['All', 'Urgent', 'High', 'Medium', 'Low'];

export const StudentAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filterPriority, setFilterPriority] = useState<'All' | AnnouncementPriority>('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = await api.get<Announcement[]>('/student/announcements');
        if (!res.success || !res.data) throw new Error(res.error || 'Could not load announcements.');
        setAnnouncements(res.data);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load announcements.');
      } finally {
        setLoading(false);
      }
    };

    void fetchAnnouncements();
  }, []);

  const categories = useMemo(
    () => [...new Set(announcements.map((announcement) => announcement.category || 'General'))].sort(),
    [announcements]
  );

  const filteredAnnouncements = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    return announcements.filter((announcement) => {
      const priority = announcement.priority || 'Medium';
      const matchesPriority = filterPriority === 'All' || priority.toLowerCase() === filterPriority.toLowerCase();
      const matchesCategory = filterCategory === 'All' || (announcement.category || 'General') === filterCategory;
      const searchableText = [
        announcement.title,
        announcement.content,
        announcement.description,
        announcement.message,
        announcement.category,
        announcement.audience,
        announcement.targetAudience,
        ...(Array.isArray(announcement.keywords) ? announcement.keywords : []),
      ].filter((value): value is string => typeof value === 'string').join(' ').toLocaleLowerCase();
      return matchesPriority && matchesCategory && searchableText.includes(query);
    });
  }, [announcements, filterPriority, filterCategory, searchQuery]);

  return (
    <div className="space-y-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#00245C] mb-2">
          <Bell className="w-3.5 h-3.5" />
          <span>Notice Board</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#00245C]">Announcements &amp; Updates</h1>
        <p className="text-sm text-gray-600 mt-1">
          Stay informed about upcoming live doubt clearings, exam form dates, test series rankings, and institute updates.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {priorities.map((priority) => (
            <button
              key={priority}
              type="button"
              aria-pressed={filterPriority === priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                filterPriority === priority
                  ? priority === 'Urgent'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-[#00245C] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {priority === 'All' ? 'All Notices' : priority}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="relative flex-1">
            <span className="sr-only">Search announcements</span>
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search title, message, category, or keywords..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full pl-9 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00245C]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear announcement search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
          <label className="sr-only" htmlFor="announcement-category">Filter by category</label>
          <select
            id="announcement-category"
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="w-full sm:w-52 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00245C]"
          >
            <option value="All">All Categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((index) => <div key={index} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : loadError ? (
          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-100" role="alert">
            <p className="text-rose-800 font-medium">{loadError}</p>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No announcements found</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => {
            const priority = announcement.priority || 'Medium';
            const publishDate = announcement.publishDate || announcement.date;
            return (
              <article
                key={announcement.id}
                className={`bg-white rounded-2xl p-6 border transition shadow-sm hover:shadow-md ${
                  priority === 'Urgent' ? 'border-rose-200 bg-rose-50/10' : 'border-gray-100'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      priority === 'Urgent' ? 'bg-rose-100 text-rose-700'
                        : priority === 'High' ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}>
                      {priority}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
                      {announcement.category || 'General'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {announcement.audience || announcement.targetAudience || 'All students'}
                    </span>
                  </div>
                  {publishDate && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(publishDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-bold text-[#00245C] mb-2">{announcement.title}</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {announcement.content || announcement.description || announcement.message}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentAnnouncementsPage;
