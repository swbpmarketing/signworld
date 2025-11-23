import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarDaysIcon, ClockIcon, MapPinIcon, UserGroupIcon, XMarkIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, startOfDay, addDays } from 'date-fns';
import CalendarShareLinks from '../components/calendar/CalendarShareLinks';
import CalendarShareLinksCompact from '../components/calendar/CalendarShareLinksCompact';
import CalendarShareSection from '../components/calendar/CalendarShareSection';
import calendarService, { type CalendarEvent } from '../services/calendarService';
import toast from 'react-hot-toast';
import CustomSelect from '../components/CustomSelect';

// Map backend CalendarEvent to frontend Event interface
interface Event {
  id: string;
  title: string;
  date: Date;
  time: string;
  location: string;
  type: 'meeting' | 'training' | 'convention' | 'webinar' | 'deadline' | 'social' | 'other';
  attendees: number;
  description: string;
  color?: string;
  isOnline?: boolean;
  onlineLink?: string;
  organizer?: string;
}

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<Event['type'] | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    category: '' as Event['type'],
    location: '',
    description: '',
    isOnline: false,
  });

  // Convert CalendarEvent to Event format
  const mapCalendarEventToEvent = (calendarEvent: CalendarEvent): Event => {
    const startDate = new Date(calendarEvent.startDate);
    const endDate = new Date(calendarEvent.endDate);
    
    // Format time display
    const timeFormat = 'h:mm a';
    let time: string;
    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
      // Same day event
      time = `${format(startDate, timeFormat)} - ${format(endDate, timeFormat)}`;
    } else {
      // Multi-day event
      time = `${format(startDate, 'MMM d, yyyy h:mm a')} - ${format(endDate, 'MMM d, yyyy h:mm a')}`;
    }
    
    return {
      id: calendarEvent._id,
      title: calendarEvent.title,
      date: startDate,
      time,
      location: calendarEvent.location || (calendarEvent.isOnline ? 'Online' : 'TBD'),
      type: calendarEvent.category as Event['type'],
      attendees: calendarEvent.attendees?.filter(a => a.status === 'confirmed').length || 0,
      description: calendarEvent.description,
      color: calendarEvent.color,
      isOnline: calendarEvent.isOnline,
      onlineLink: calendarEvent.onlineLink,
      organizer: calendarEvent.organizer?.name
    };
  };

  // Fetch events from backend
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const calendarEvents = await calendarService.getEvents();
      const mappedEvents = calendarEvents.map(mapCalendarEventToEvent);
      setEvents(mappedEvents);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load calendar events. Please try again.');
      // Fallback to empty array
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle form submission
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // Combine date and time into ISO strings
      const startDateTime = new Date(`${formData.date}T${formData.time}`);
      const endDateTime = formData.endTime
        ? new Date(`${formData.date}T${formData.endTime}`)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000); // Default: 1 hour later

      // Prepare event data for API
      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        category: formData.category,
        location: formData.location,
        isOnline: formData.isOnline,
        color: getEventColor(formData.category),
        isPublished: true,
      };

      // Create event via API
      await calendarService.createEvent(eventData);

      // Show success message
      toast.success('Event created successfully!');

      // Reset form
      setFormData({
        title: '',
        date: '',
        time: '',
        endTime: '',
        category: '' as Event['type'],
        location: '',
        description: '',
        isOnline: false,
      });

      // Close modal
      setShowAddModal(false);

      // Refresh events list
      await fetchEvents();

    } catch (err) {
      console.error('Error creating event:', err);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get color for event category
  const getEventColor = (category: Event['type']): string => {
    const colors = {
      meeting: '#3b82f6',
      training: '#10b981',
      convention: '#8b5cf6',
      webinar: '#f59e0b',
      deadline: '#ef4444',
      social: '#ec4899',
      other: '#6b7280',
    };
    return colors[category] || colors.other;
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training': return 'bg-green-100 text-green-800 border-green-200';
      case 'convention': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'webinar': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'deadline': return 'bg-red-100 text-red-800 border-red-200';
      case 'social': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'other': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventsForDate = (date: Date) => {
    const dateEvents = events.filter(event => isSameDay(event.date, date));
    if (selectedEventType === 'all') return dateEvents;
    return dateEvents.filter(event => event.type === selectedEventType);
  };

  const filteredEvents = selectedEventType === 'all'
    ? events
    : events.filter(event => event.type === selectedEventType);

  const upcomingEvents = filteredEvents
    .filter(event => event.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading calendar events...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={fetchEvents}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
              Calendar & Events
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">Manage your schedule and stay updated with Sign Company events</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
            <CalendarShareLinksCompact
              events={events}
              calendarName="Sign Company Calendar"
              className="order-last sm:order-first w-full sm:w-auto"
            />
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg text-sm font-medium"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Event
            </button>
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
              <button
                onClick={() => setViewMode('month')}
                className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 ${
                  viewMode === 'month'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'week'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 border-l border-gray-300 dark:border-gray-600 ${
                  viewMode === 'day'
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-3 sm:p-6 border border-gray-100 dark:border-gray-700">
            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                >
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 active:from-primary-800 active:to-primary-900 rounded-lg transition-all duration-200 shadow-sm"
                >
                  Today
                </button>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600"
                >
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg sm:rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-inner">
              {/* Week days */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-0.5 sm:px-2 py-2 sm:py-3 text-center border-b-2 border-gray-300 dark:border-gray-600">
                  <span className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">{day}</span>
                </div>
              ))}

              {/* Calendar days */}
              {days.map((day, idx) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      bg-white dark:bg-gray-800 p-0.5 sm:p-1.5 md:p-2 min-h-[60px] sm:min-h-[85px] md:min-h-[110px] cursor-pointer transition-all duration-200 border-r border-b border-gray-100 dark:border-gray-700 last:border-r-0 overflow-hidden
                      ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-gray-900/50' : 'text-gray-900 dark:text-gray-100'}
                      ${isSelected ? 'ring-1 sm:ring-2 ring-primary-500 dark:ring-primary-400 bg-primary-50/50 dark:bg-primary-900/20 shadow-sm' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}
                    `}
                  >
                    <div className={`
                      inline-flex items-center justify-center w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 text-[10px] sm:text-xs md:text-base rounded-full mb-0.5 sm:mb-1 transition-all duration-200
                      ${isTodayDate
                        ? 'bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-500 dark:to-primary-600 text-white font-bold shadow-sm ring-1 sm:ring-2 ring-primary-200 dark:ring-primary-800'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'}
                    `}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          className={`
                            text-[8px] sm:text-[10px] md:text-xs px-0.5 sm:px-1 md:px-1.5 py-0.5 sm:py-1 rounded border cursor-pointer
                            ${getEventTypeColor(event.type)}
                            hover:shadow-sm transition-all duration-200
                          `}
                        >
                          <p className="truncate font-semibold">{event.title}</p>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <p className="text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 px-0.5 sm:px-1 font-medium">+{dayEvents.length - 2}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Calendar Share Section - New prominent placement below calendar */}
          <CalendarShareSection 
            events={events}
            calendarName="Sign Company Calendar"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming Events</h3>
              {selectedEventType !== 'all' && (
                <button
                  onClick={() => setSelectedEventType('all')}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
                >
                  <XMarkIcon className="h-3 w-3" />
                  Clear filter
                </button>
              )}
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {selectedEventType === 'all' ? 'No upcoming events' : `No upcoming ${selectedEventType} events`}
                  </p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
                  >
                    Create your first event
                  </button>
                </div>
              ) : (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-850 hover:from-primary-50 hover:to-primary-100 dark:hover:from-primary-900/20 dark:hover:to-primary-800/20 transition-all duration-200 cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{event.title}</h4>
                      <span className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm
                        ${getEventTypeColor(event.type)}
                      `}>
                        {event.type}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <CalendarDaysIcon className="h-3.5 w-3.5 mr-2 text-primary-500 dark:text-primary-400" />
                        <span className="font-medium">{format(event.date, 'MMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <ClockIcon className="h-3.5 w-3.5 mr-2 text-primary-500 dark:text-primary-400" />
                        <span className="font-medium">{event.time}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                        <MapPinIcon className="h-3.5 w-3.5 mr-2 text-primary-500 dark:text-primary-400" />
                        <span className="font-medium truncate">{event.location}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event Types Filter */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-5">
              <FunnelIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Event Types</h3>
            </div>
            <div className="space-y-2">
              {[
                { type: 'all', label: 'All Events', color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200', count: events.length },
                { type: 'meeting', label: 'Meetings', color: 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-800 dark:text-blue-200', count: events.filter(e => e.type === 'meeting').length },
                { type: 'training', label: 'Training Sessions', color: 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 text-green-800 dark:text-green-200', count: events.filter(e => e.type === 'training').length },
                { type: 'convention', label: 'Conventions', color: 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800 text-purple-800 dark:text-purple-200', count: events.filter(e => e.type === 'convention').length },
                { type: 'webinar', label: 'Webinars', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 dark:from-yellow-900 dark:to-yellow-800 text-yellow-800 dark:text-yellow-200', count: events.filter(e => e.type === 'webinar').length },
                { type: 'social', label: 'Social Events', color: 'bg-gradient-to-r from-pink-100 to-pink-200 dark:from-pink-900 dark:to-pink-800 text-pink-800 dark:text-pink-200', count: events.filter(e => e.type === 'social').length },
                { type: 'other', label: 'Other Events', color: 'bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-800 dark:text-gray-200', count: events.filter(e => e.type === 'other').length },
              ].map(({ type, label, color, count }) => (
                <button
                  key={type}
                  onClick={() => setSelectedEventType(type as Event['type'] | 'all')}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 border-2
                    ${selectedEventType === type
                      ? 'border-primary-500 dark:border-primary-400 shadow-lg ring-2 ring-primary-200 dark:ring-primary-800 transform scale-105'
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-4 h-4 rounded-full ${color.split(' ')[0]} shadow-sm`}></span>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                  </div>
                  <span className={`
                    px-2.5 py-1 rounded-full text-xs font-bold shadow-sm
                    ${color}
                  `}>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 z-50 animate-fadeIn"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-slideUp sm:animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{selectedEvent.title}</h3>
                <span className={`
                  inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold mt-2 shadow-sm
                  ${getEventTypeColor(selectedEvent.type)}
                `}>
                  {selectedEvent.type}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 mr-3">
                  <CalendarDaysIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-semibold">{format(selectedEvent.date, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 mr-3">
                  <ClockIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-semibold">{selectedEvent.time}</span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 mr-3">
                  <MapPinIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <span className="font-semibold">{selectedEvent.location}</span>
              </div>
              {selectedEvent.attendees > 0 && (
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 mr-3">
                    <UserGroupIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="font-semibold">{selectedEvent.attendees} attendees confirmed</span>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Description</h4>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{selectedEvent.description}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => toast.success('Edit functionality coming soon!')}
                className="flex-1 px-5 py-3 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-all duration-200 border-2 border-primary-200 dark:border-primary-800 hover:border-primary-300 dark:hover:border-primary-700 text-center font-semibold"
              >
                Edit Event
              </button>
              <button
                onClick={() => toast.success('Joined event successfully!')}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-center font-semibold transform hover:-translate-y-0.5"
              >
                Join Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddModal && (
        <div
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-end sm:items-center justify-center sm:p-4 z-50 animate-fadeIn"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-slideUp sm:animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-400 dark:to-primary-600 bg-clip-text text-transparent">
                  Create New Event
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add a new event to your calendar</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleCreateEvent}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none"
                  placeholder="e.g., Team Meeting"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleFormChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none"
                  />
                </div>
              </div>

              <CustomSelect
                label="Event Type"
                value={formData.category}
                onChange={(value) => {
                  handleFormChange({ target: { name: 'category', value } } as any);
                }}
                options={[
                  { value: '', label: 'Select event type' },
                  { value: 'meeting', label: 'Meeting' },
                  { value: 'training', label: 'Training Session' },
                  { value: 'convention', label: 'Convention' },
                  { value: 'webinar', label: 'Webinar' },
                  { value: 'social', label: 'Social Event' },
                  { value: 'other', label: 'Other' },
                ]}
                placeholder="Select event type"
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none"
                  placeholder="e.g., Conference Room A or Online"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows={4}
                  required
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:border-primary-500 dark:focus:border-primary-400 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-800 transition-all outline-none resize-none"
                  placeholder="Provide event details..."
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all duration-200 text-center font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-5 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-center font-semibold transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;