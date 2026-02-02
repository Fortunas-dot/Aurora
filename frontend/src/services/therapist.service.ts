import { apiService, ApiResponse } from './api.service';

export interface OnlineTherapistsInfo {
  count: number;
  message: string;
}

class TherapistService {
  async getOnlineCount(): Promise<ApiResponse<OnlineTherapistsInfo>> {
    return apiService.get<OnlineTherapistsInfo>('/therapists/online-count');
  }
}

export const therapistService = new TherapistService();

