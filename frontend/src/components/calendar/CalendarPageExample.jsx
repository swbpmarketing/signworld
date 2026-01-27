import React, { useState, useEffect } from 'react';
import CalendarShareLinks from './CalendarShareLinks';
import CalendarShareLinksCompact from './CalendarShareLinksCompact';
import { calendarService } from '../../services/calendarService';

/**
 * Example integration of CalendarShareLinks components
 * Shows how to use both full and compact versions in different contexts
 */
const CalendarPageExample = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sample mock events for demonstration
  const mockEvents = [
    {
      id: '1',
      title: 'Monthly Owner Meeting',
      date: new Date(2025, 7, 15, 14, 0),
      time: '2:00 PM - 3:30 PM',
      location: 'Virtual - Zoom',
      type: 'meeting',
      attendees: 45,
      description: 'Monthly meeting to discuss Q3 goals and performance metrics.'
    },
    {
      id: '2',
      title: 'Sign Design Workshop',
      date: new Date(2025, 7, 8, 10, 0),
      time: '10:00 AM - 12:00 PM',
      location: 'Training Center - Room A',
      type: 'training',
      attendees: 25,
      description: 'Learn advanced techniques for creating eye-catching sign designs.'
    },
    {
      id: '3',
      title: 'Annual Convention 2025',
      date: new Date(2025, 7, 22, 9, 0),
      time: 'All Day Event',
      location: 'Las Vegas Convention Center',
      type: 'convention',
      attendees: 500,
      description: 'The biggest Sign Company event of the year! Network, learn, and celebrate.'
    }
  ];

  useEffect(() => {
    // In a real application, you would fetch events from the API
    // For this example, we'll use mock data
    const loadEvents = async () => {
      try {
        setLoading(true);
        // Uncomment the line below to use real API data
        // const eventsData = await calendarService.getEvents();
        // setEvents(eventsData);
        
        // Using mock data for demonstration
        setTimeout(() => {
          setEvents(mockEvents);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('Failed to load events');
        setEvents(mockEvents); // Fallback to mock data
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const handleShareLinkGenerated = (links) => {
    // You can add custom logic here when share links are generated
    // For example, tracking analytics or showing notifications
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="bg-white shadow-sm rounded-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Calendar Integration Example</h1>
              <p className="mt-2 text-gray-600">
                Demonstrating calendar share functionality in different layouts
              </p>
            </div>
            
            {/* Compact share component in header */}
            <div className="mt-4 sm:mt-0">
              <CalendarShareLinksCompact 
                events={events}
                calendarName="Sign Company Demo Calendar"
                onShareLinkGenerated={handleShareLinkGenerated}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Calendar Component Would Go Here */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar View</h2>
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-500">Calendar component would be rendered here</p>
              </div>
            </div>

            {/* Events List */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
              <div className="space-y-4">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <span>{event.time}</span>
                      <span className="mx-2">•</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Full Calendar Share Links Component */}
            <CalendarShareLinks 
              events={events}
              calendarName="Sign Company Demo Calendar"
              onShareLinkGenerated={handleShareLinkGenerated}
            />

            {/* Additional sidebar content */}
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Notes</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <strong className="text-gray-900">Compact Version:</strong>
                  <p>Use in headers, toolbars, or anywhere space is limited</p>
                </div>
                <div>
                  <strong className="text-gray-900">Full Version:</strong>
                  <p>Use in sidebars or dedicated share sections</p>
                </div>
                <div>
                  <strong className="text-gray-900">Event Data:</strong>
                  <p>Pass current events to enable context-aware sharing</p>
                </div>
                <div>
                  <strong className="text-gray-900">Callbacks:</strong>
                  <p>Use onShareLinkGenerated for custom analytics</p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-8 bg-white shadow-sm rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Basic Usage</h3>
              <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
{`import CalendarShareLinks from './CalendarShareLinks';

<CalendarShareLinks 
  events={events}
  calendarName="My Calendar"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">With Callback</h3>
              <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
{`<CalendarShareLinks 
  events={events}
  calendarName="My Calendar"
  onShareLinkGenerated={(links) => {
    console.log('Links:', links);
  }}
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Compact Version</h3>
              <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
{`import CalendarShareLinksCompact from './CalendarShareLinksCompact';

<CalendarShareLinksCompact 
  events={events}
  calendarName="My Calendar"
  className="ml-auto"
/>`}
              </pre>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">API Integration</h3>
              <pre className="bg-gray-100 rounded p-3 text-sm overflow-x-auto">
{`import { calendarService } from './calendarService';

const events = await calendarService.getEvents();
const info = await calendarService.getCalendarInfo();`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPageExample;