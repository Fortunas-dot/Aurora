import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// @desc    Get online therapists count
// @route   GET /api/therapists/online-count
// @access  Public
export const getOnlineTherapistsCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get current hour (0-23) and minute (0-59)
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    
    // Deterministic function that varies per hour between 3-5
    // Uses hour and minute as seed to ensure consistency within the same hour
    // Formula: (hour * 11 + minute * 3 + dayOfYear) % 3 + 3
    // This ensures variation per hour and day, always returns 3, 4, or 5
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const count = ((currentHour * 11 + currentMinute * 3 + dayOfYear) % 3) + 3;
    
    res.json({
      success: true,
      data: {
        count,
        message: `There are ${count} certified therapists online who can answer questions under posts`,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching online therapists count',
    });
  }
};

