import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

// @desc    Get online therapists count
// @route   GET /api/therapists/online-count
// @access  Public
export const getOnlineTherapistsCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get current hour (0-23)
    const currentHour = new Date().getUTCHours();
    
    // Deterministic function that varies per hour between 1-5
    // Uses hour as seed to ensure consistency within the same hour
    // Formula: (hour * 7 + dayOfYear) % 5 + 1
    // This ensures variation per hour and day
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    const count = ((currentHour * 7 + dayOfYear) % 5) + 1;
    
    res.json({
      success: true,
      data: {
        count,
        message: count === 1 
          ? 'Er is 1 A.I. mentale gezondheid companion online die vragen kan beantwoorden'
          : `Er zijn ${count} A.I. mentale gezondheid companions online die vragen kunnen beantwoorden`,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching online therapists count',
    });
  }
};

