import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? 'http://localhost:5000/api'
    : 'https://sign-company.onrender.com/api');

// Create axios instance with base configuration
const calendarAPI = axios.create({
  baseURL: `${API_URL}/events`,
  timeout: 10000,
});

// Add auth token to requests
calendarAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface CalendarEvent {
  _id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  category: 'training' | 'webinar' | 'convention' | 'meeting' | 'social' | 'other';
  color: string;
  location?: string;
  isOnline: boolean;
  onlineLink?: string;
  organizer: {
    _id: string;
    name: string;
    email: string;
  };
  attendees: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    status: 'pending' | 'confirmed' | 'declined';
    rsvpDate: Date;
  }>;
  maxAttendees?: number;
  isPublished: boolean;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
  }>;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CalendarInfo {
  calendarName: string;
  description: string;
  eventsCount: number;
  upcomingEvents: Array<{
    _id: string;
    title: string;
    startDate: Date;
    category: string;
  }>;
  feedUrl: string;
  lastUpdated: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Calendar service functions
export const calendarService = {
  // Get all public events (no authentication required)
  getEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await calendarAPI.get<APIResponse<CalendarEvent[]>>('/public');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new Error('Failed to fetch events');
    }
  },

  // Get all events (requires authentication for admin/management)
  getAllEvents: async (): Promise<CalendarEvent[]> => {
    try {
      const response = await calendarAPI.get<APIResponse<CalendarEvent[]>>('/');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching all events:', error);
      throw new Error('Failed to fetch all events');
    }
  },

  // Get single event
  getEvent: async (id: string): Promise<CalendarEvent> => {
    try {
      const response = await calendarAPI.get<APIResponse<CalendarEvent>>(`/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching event:', error);
      throw new Error('Failed to fetch event');
    }
  },

  // Create new event
  createEvent: async (eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      const response = await calendarAPI.post<APIResponse<CalendarEvent>>('/', eventData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Failed to create event');
    }
  },

  // Update event
  updateEvent: async (id: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    try {
      const response = await calendarAPI.put<APIResponse<CalendarEvent>>(`/${id}`, eventData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Failed to update event');
    }
  },

  // Delete event
  deleteEvent: async (id: string): Promise<void> => {
    try {
      await calendarAPI.delete(`/${id}`);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Failed to delete event');
    }
  },

  // RSVP to event
  rsvpToEvent: async (id: string, status: 'confirmed' | 'declined' | 'pending'): Promise<CalendarEvent> => {
    try {
      const response = await calendarAPI.post<APIResponse<CalendarEvent>>(`/${id}/rsvp`, { status });
      return response.data.data;
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw new Error('Failed to update RSVP');
    }
  },

  // Get calendar info (public endpoint)
  getCalendarInfo: async (): Promise<CalendarInfo> => {
    try {
      // Use full URL for public endpoint
      const response = await axios.get<APIResponse<CalendarInfo>>(`${API_URL}/events/calendar/info`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching calendar info:', error);
      throw new Error('Failed to fetch calendar info');
    }
  },

  // Get iCal feed URL (public endpoint)
  getCalendarFeedUrl: (): string => {
    return `${API_URL}/events/calendar.ics`;
  },

  // Generate share links
  generateShareLinks: async (): Promise<{
    ical: string;
    google: string;
    outlook: string;
    apple: string;
  }> => {
    try {
      const info = await calendarService.getCalendarInfo();
      const icalUrl = info.feedUrl;
      
      return {
        ical: icalUrl,
        google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(icalUrl)}`,
        outlook: `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addsubscription&url=${encodeURIComponent(icalUrl)}&name=${encodeURIComponent(info.calendarName)}`,
        apple: `webcal://${icalUrl.replace('http://', '').replace('https://', '')}`
      };
    } catch (error) {
      console.error('Error generating share links:', error);
      throw new Error('Failed to generate share links');
    }
  }
};

export default calendarService;