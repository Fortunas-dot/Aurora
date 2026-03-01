import { create } from 'zustand';
import { secureStorage } from '../utils/secureStorage';
import { authService, User } from '../services/auth.service';
import { posthogService, POSTHOG_EVENTS, POSTHOG_PROPERTIES } from '../services/posthog.service';
import { facebookAnalytics } from '../services/facebookAnalytics.service';
import { revenueCatService } from '../services/revenuecat.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, displayName?: string) => Promise<boolean>;
  loginWithFacebook: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  updateUser: (user: Partial<User>) => void;
  normalizeAvatarUrl: (url: string | null | undefined) => string | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login(email, password);
      
      if (response.success && response.data) {
        const user = response.data.user;
        
        // Identify user in PostHog (BELANGRIJK: doe dit direct na login)
        posthogService.identify(user._id, {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          last_login: new Date().toISOString(),
        });
        
        // Facebook: log login event (email)
        facebookAnalytics.logLogin('email');

        // Track login event
        posthogService.trackEvent(POSTHOG_EVENTS.USER_LOGGED_IN, {
          [POSTHOG_PROPERTIES.USER_ID]: user._id,
          login_method: 'email',
          timestamp: new Date().toISOString(),
        });
        
        // Cache user data for persistence
        await secureStorage.setItemAsync('cached_user', JSON.stringify(user));
        console.log('✅ User data cached after login');
        
        set({
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        // Track failed login
        posthogService.trackEvent(POSTHOG_EVENTS.LOGIN_FAILED, {
          login_method: 'email',
          [POSTHOG_PROPERTIES.ERROR_MESSAGE]: response.message || 'Login failed',
          timestamp: new Date().toISOString(),
        });
        
        set({
          isLoading: false,
          error: response.message || 'Login failed',
        });
        return false;
      }
    } catch (error: any) {
      // Track failed login
      posthogService.trackEvent(POSTHOG_EVENTS.LOGIN_FAILED, {
        login_method: 'email',
        [POSTHOG_PROPERTIES.ERROR_MESSAGE]: error.message || 'Login failed',
        [POSTHOG_PROPERTIES.ERROR_TYPE]: error.constructor?.name || 'Error',
        timestamp: new Date().toISOString(),
      });
      
      set({
        isLoading: false,
        error: error.message || 'Login failed',
      });
      return false;
    }
  },

  register: async (email: string, password: string, username: string, displayName?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.register(email, password, username, displayName);
      
      if (response.success && response.data) {
        const user = response.data.user;
        
        // Identify user in PostHog (BELANGRIJK: doe dit direct na signup)
        posthogService.identify(user._id, {
          email: user.email,
          username: user.username,
          displayName: user.displayName || displayName,
          signup_date: new Date().toISOString(),
          signup_method: 'email',
        });
        
        // Facebook: log signup event (email)
        facebookAnalytics.logSignup('email');

        // Track signup event
        posthogService.trackEvent(POSTHOG_EVENTS.USER_SIGNED_UP, {
          [POSTHOG_PROPERTIES.USER_ID]: user._id,
          signup_method: 'email',
          timestamp: new Date().toISOString(),
        });
        
        // Cache user data for persistence
        await secureStorage.setItemAsync('cached_user', JSON.stringify(user));
        
        set({
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        // Track failed signup
        posthogService.trackEvent(POSTHOG_EVENTS.SIGNUP_FAILED, {
          signup_method: 'email',
          [POSTHOG_PROPERTIES.ERROR_MESSAGE]: response.message || 'Registration failed',
          timestamp: new Date().toISOString(),
        });
        
        set({
          isLoading: false,
          error: response.message || 'Registration failed',
        });
        return false;
      }
    } catch (error: any) {
      // Track failed signup
      posthogService.trackEvent(POSTHOG_EVENTS.SIGNUP_FAILED, {
        signup_method: 'email',
        [POSTHOG_PROPERTIES.ERROR_MESSAGE]: error.message || 'Registration failed',
        [POSTHOG_PROPERTIES.ERROR_TYPE]: error.constructor?.name || 'Error',
        timestamp: new Date().toISOString(),
      });
      
      set({
        isLoading: false,
        error: error.message || 'Registration failed',
      });
      return false;
    }
  },

  loginWithFacebook: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Import Facebook SDK dynamically to avoid issues if not available
      let FacebookSDK;
      try {
        FacebookSDK = await import('react-native-fbsdk-next');
      } catch (importError: any) {
        // Facebook SDK is not available (e.g., in Expo Go)
        const errorMessage = 'Facebook login is not available in Expo Go. Please create a development build to use Facebook login.';
        console.warn(errorMessage, importError);
        set({
          isLoading: false,
          error: errorMessage,
        });
        return false;
      }
      
      const { LoginManager, AccessToken, GraphRequest, GraphRequestManager } = FacebookSDK;
      
      // Log out any existing session
      LoginManager.logOut();
      
      // Request Facebook login
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        set({
          isLoading: false,
          error: null,
        });
        return false;
      }
      
      // Get access token
      const data = await AccessToken.getCurrentAccessToken();
      
      if (!data) {
        set({
          isLoading: false,
          error: 'Failed to get Facebook access token',
        });
        return false;
      }
      
      // Fetch user info from Facebook Graph API
      const userInfo = await new Promise<any>((resolve, reject) => {
        const infoRequest = new GraphRequest(
          '/me',
          {
            parameters: {
              fields: {
                string: 'email,name,picture.type(large)'
              },
              access_token: {
                string: data.accessToken
              }
            }
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        
        new GraphRequestManager().addRequest(infoRequest).start();
      });
      
      // Send to backend
      const response = await authService.loginWithFacebook(data.accessToken, userInfo);
      
      if (response.success && response.data) {
        const user = response.data.user;
        
        // Identify user in PostHog (BELANGRIJK: doe dit direct na login)
        posthogService.identify(user._id, {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          last_login: new Date().toISOString(),
          signup_method: user.facebookId ? 'facebook' : 'email',
        });
        
        // Track login event
        posthogService.trackEvent(POSTHOG_EVENTS.USER_LOGGED_IN, {
          [POSTHOG_PROPERTIES.USER_ID]: user._id,
          login_method: 'facebook',
          timestamp: new Date().toISOString(),
        });

        // Facebook: log login via Facebook
        facebookAnalytics.logLogin('facebook');
        
        // Cache user data for persistence
        await secureStorage.setItemAsync('cached_user', JSON.stringify(user));
        
        set({
          user: user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        // Track failed login
        posthogService.trackEvent(POSTHOG_EVENTS.LOGIN_FAILED, {
          login_method: 'facebook',
          [POSTHOG_PROPERTIES.ERROR_MESSAGE]: response.message || 'Facebook login failed',
          timestamp: new Date().toISOString(),
        });
        
        set({
          isLoading: false,
          error: response.message || 'Facebook login failed',
        });
        return false;
      }
    } catch (error: any) {
      // Track failed login
      posthogService.trackEvent(POSTHOG_EVENTS.LOGIN_FAILED, {
        login_method: 'facebook',
        [POSTHOG_PROPERTIES.ERROR_MESSAGE]: error.message || 'Facebook login failed',
        [POSTHOG_PROPERTIES.ERROR_TYPE]: error.constructor?.name || 'Error',
        timestamp: new Date().toISOString(),
      });
      
      // Check if error is about native module
      if (error?.message?.includes('native module') || error?.message?.includes('doesn\'t exist')) {
        const errorMessage = 'Facebook login requires a development build. Please create a development build to use Facebook login.';
        set({
          isLoading: false,
          error: errorMessage,
        });
        return false;
      }
      
      set({
        isLoading: false,
        error: error.message || 'Facebook login failed',
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    
    // Track logout event VOOR reset
    posthogService.trackEvent(POSTHOG_EVENTS.USER_LOGGED_OUT, {
      timestamp: new Date().toISOString(),
    });

    // Facebook: log logout
    facebookAnalytics.logLogout();
    
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear cached user data
      await secureStorage.deleteItemAsync('cached_user');
      
      // Reset user identification (BELANGRIJK: doe dit na tracking)
      posthogService.reset();
      
      // Reset RevenueCat user
      revenueCatService.resetUser().catch((error) => {
        console.warn('RevenueCat reset user failed:', error);
      });
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Helper function to normalize avatar URL
  normalizeAvatarUrl: (url: string | null | undefined): string | null => {
    if (!url || typeof url !== 'string' || url.trim() === '') return null;
    
    // Remove any whitespace
    const trimmedUrl = url.trim();
    
    // If already absolute, return as-is
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // If relative, make it absolute
    const baseUrl = 'https://aurora-production.up.railway.app';
    
    // Ensure the relative URL starts with /
    let relativeUrl = trimmedUrl;
    if (!relativeUrl.startsWith('/')) {
      relativeUrl = `/${relativeUrl}`;
    }
    
    // Remove any double slashes (except after http:// or https://)
    const normalized = `${baseUrl}${relativeUrl}`.replace(/([^:]\/)\/+/g, '$1');
    
    return normalized;
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      console.log('🔐 Starting auth check...');
      
      // First, try to restore user from cache for faster startup
      const cachedUserJson = await secureStorage.getItemAsync('cached_user');
      if (cachedUserJson) {
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          console.log('✅ Found cached user:', cachedUser.email || cachedUser.username);
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:390',message:'checkAuth - Avatar URL from cache BEFORE normalization',data:{avatar:cachedUser.avatar,isAbsolute:cachedUser.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          // Normalize avatar URL if present
          if (cachedUser.avatar) {
            const { normalizeAvatarUrl } = get();
            cachedUser.avatar = normalizeAvatarUrl(cachedUser.avatar) || undefined;
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:397',message:'checkAuth - Avatar URL from cache AFTER normalization',data:{avatar:cachedUser.avatar,isAbsolute:cachedUser.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          
          // Set cached user immediately for faster UI
          set({
            user: cachedUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (e) {
          console.warn('⚠️ Invalid cached user, clearing cache');
          await secureStorage.deleteItemAsync('cached_user');
        }
      } else {
        console.log('⚠️ No cached user found');
      }

      const token = await authService.getToken();
      
      if (!token) {
        console.log('❌ No token found, user not authenticated');
        // No token found, clear cache and user is not authenticated
        await secureStorage.deleteItemAsync('cached_user');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
      
      console.log('✅ Token found, verifying with backend...');

      // Token exists, verify it by fetching user data
      // Use a timeout to prevent hanging on network issues
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 10000); // 10 second timeout
      });

      const authPromise = authService.getMe();
      
      let response;
      try {
        response = await Promise.race([authPromise, timeoutPromise]) as any;
        
        // #region agent log
        if (response?.success && response?.data?.avatar) {
          fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:448',message:'checkAuth - Avatar URL from backend BEFORE normalization',data:{avatar:response.data.avatar,isAbsolute:response.data.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }
        // #endregion
      } catch (timeoutError) {
        // Network timeout or error - if we have cached user and token, assume still authenticated
        console.warn('Auth check timeout or network error, using cached user if available');
        const cachedUserJson = await secureStorage.getItemAsync('cached_user');
        if (cachedUserJson) {
          try {
            const cachedUser = JSON.parse(cachedUserJson);
            
            // Normalize avatar URL if present
            if (cachedUser.avatar) {
              const { normalizeAvatarUrl } = get();
              cachedUser.avatar = normalizeAvatarUrl(cachedUser.avatar) || undefined;
            }
            
            set({
              user: cachedUser,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch (e) {
            // Cache invalid, continue to set as not authenticated
          }
        }
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
      
      if (response.success && response.data) {
        const user = response.data;
        console.log('✅ Auth verified successfully for user:', user.email || user.username);
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:476',message:'checkAuth - Avatar URL from backend BEFORE normalization',data:{avatar:user.avatar,isAbsolute:user.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Normalize avatar URL if present BEFORE caching
        if (user.avatar) {
          const { normalizeAvatarUrl } = get();
          user.avatar = normalizeAvatarUrl(user.avatar) || undefined;
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:483',message:'checkAuth - Avatar URL from backend AFTER normalization (before caching)',data:{avatar:user.avatar,isAbsolute:user.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        
        // Cache user data for faster next startup (with normalized avatar URL)
        await secureStorage.setItemAsync('cached_user', JSON.stringify(user));
        console.log('✅ User data cached with normalized avatar URL');
        
        // Identify user in PostHog after successful restore
        posthogService.identify(user._id, {
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          restored_session: true,
        });
        
        set({
          user: user,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      } else {
        // Token is invalid or expired, remove it and cache
        const status = (response as any).status;
        if (status === 401 || status === 403) {
          console.warn('❌ Token is invalid or expired (status:', status, '), removing token and cache');
          await authService.removeToken();
          await secureStorage.deleteItemAsync('cached_user');
        } else {
          console.warn('❌ Auth check failed:', response.message || 'Unknown error');
        }
        
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error checking auth:', error);
      
      // If error is 401 (Unauthorized), token is invalid
      if (error?.response?.status === 401 || error?.message?.includes('401')) {
        console.warn('Token is invalid, removing token and cache');
        await authService.removeToken();
        await secureStorage.deleteItemAsync('cached_user');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }
      
      // For other errors (network issues, etc.), check if we have cached user
      const cachedUserJson = await secureStorage.getItemAsync('cached_user');
      const token = await authService.getToken();
      
      if (cachedUserJson && token) {
        // We have both token and cached user, assume still authenticated
        try {
          const cachedUser = JSON.parse(cachedUserJson);
          console.warn('Using cached user due to network error');
          set({
            user: cachedUser,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        } catch (e) {
          // Cache invalid, continue to set as not authenticated
        }
      }
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => set({ error: null }),

  updateUser: async (userData: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:583',message:'updateUser - Avatar URL input',data:{avatar:userData.avatar,isAbsolute:userData.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Normalize avatar URL before updating
      const normalizedUserData = { ...userData };
      if (userData.avatar !== undefined) {
        const { normalizeAvatarUrl } = get();
        normalizedUserData.avatar = normalizeAvatarUrl(userData.avatar) || undefined;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:591',message:'updateUser - Avatar URL after normalization (before caching)',data:{avatar:normalizedUserData.avatar,isAbsolute:normalizedUserData.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      const updatedUser = { ...currentUser, ...normalizedUserData };
      set({ user: updatedUser });
      
      // Update cached user data
      try {
        await secureStorage.setItemAsync('cached_user', JSON.stringify(updatedUser));
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/083d67a2-e9cc-407e-8327-24cf6b490b99',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'authStore.ts:599',message:'updateUser - Avatar URL cached',data:{avatar:updatedUser.avatar,isAbsolute:updatedUser.avatar?.startsWith('http')},timestamp:Date.now(),runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
      } catch (error) {
        console.error('Error caching user data:', error);
      }
    }
  },
}));

