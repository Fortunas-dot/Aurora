import { api, ApiResponse } from './api.service';

export interface CalendarEvent {
  _id: string;
  user: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay: boolean;
  location?: string;
  type: 'appointment' | 'therapy' | 'medication' | 'reminder' | 'other';
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
    interval: number;
    endDate?: string;
    count?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  type?: 'appointment' | 'therapy' | 'medication' | 'reminder' | 'other';
  reminder?: {
    enabled: boolean;
    minutesBefore: number;
  };
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none';
    interval: number;
    endDate?: string;
    count?: number;
  };
}

export interface UpdateCalendarEventData extends Partial<CreateCalendarEventData> {}

class CalendarService {
  async getEvents(params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
  }): Promise<ApiResponse<CalendarEvent[]>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.type) queryParams.append('type', params.type);

      const queryString = queryParams.toString();
      const endpoint = `/calendar${queryString ? `?${queryString}` : ''}`;
      
      const response = await api.get<CalendarEvent[]>(endpoint);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error fetching calendar events',
      };
    }
  }

  async getEvent(id: string): Promise<ApiResponse<CalendarEvent>> {
    try {
      const response = await api.get<CalendarEvent>(`/calendar/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error fetching calendar event',
      };
    }
  }

  async createEvent(data: CreateCalendarEventData): Promise<ApiResponse<CalendarEvent>> {
    try {
      const response = await api.post<CalendarEvent>('/calendar', data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error creating calendar event',
      };
    }
  }

  async updateEvent(id: string, data: UpdateCalendarEventData): Promise<ApiResponse<CalendarEvent>> {
    try {
      const response = await api.put<CalendarEvent>(`/calendar/${id}`, data);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error updating calendar event',
      };
    }
  }

  async deleteEvent(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await api.delete<void>(`/calendar/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error deleting calendar event',
      };
    }
  }

  async getUpcomingEvents(limit: number = 10): Promise<ApiResponse<CalendarEvent[]>> {
    try {
      const response = await api.get<CalendarEvent[]>(`/calendar/upcoming?limit=${limit}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error fetching upcoming events',
      };
    }
  }
}

export const calendarService = new CalendarService();
