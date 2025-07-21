export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  user: User;
  access_token: string;
  expires_at: number;
}

const STORAGE_KEYS = {
  USER: 'lb_user',
  SESSION: 'lb_session',
  BUDGET_DATA: 'lb_budget_data',
} as const;

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Local Storage Auth
export const localAuth = {
  signUp: async (email: string, password: string, fullName?: string) => {
    try {
      // Check if user already exists
      const existingUsers = JSON.parse(localStorage.getItem('lb_users') || '[]');
      const userExists = existingUsers.find((u: User) => u.email === email);
      
      if (userExists) {
        return {
          data: null,
          error: { message: 'User already exists' }
        };
      }

      // Create new user
      const now = new Date().toISOString();
      const user: User = {
        id: generateId(),
        email,
        full_name: fullName || null,
        avatar_url: null,
        created_at: now,
        updated_at: now,
      };

      // Store user credentials
      const users = [...existingUsers, user];
      const credentials = JSON.parse(localStorage.getItem('lb_credentials') || '[]');
      credentials.push({ email, password });
      
      localStorage.setItem('lb_users', JSON.stringify(users));
      localStorage.setItem('lb_credentials', JSON.stringify(credentials));

      // Create session
      const session: Session = {
        user,
        access_token: generateId(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return { data: { user, session }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      // Check credentials
      const credentials = JSON.parse(localStorage.getItem('lb_credentials') || '[]');
      const validCredential = credentials.find((c: any) => c.email === email && c.password === password);
      
      if (!validCredential) {
        return {
          data: null,
          error: { message: 'Invalid email or password' }
        };
      }

      // Get user
      const users = JSON.parse(localStorage.getItem('lb_users') || '[]');
      const user = users.find((u: User) => u.email === email);
      
      if (!user) {
        return {
          data: null,
          error: { message: 'User not found' }
        };
      }

      // Create session
      const session: Session = {
        user,
        access_token: generateId(),
        expires_at: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

      return { data: { user, session }, error: null };
    } catch (error) {
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  signOut: async () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.USER);
      return { error: null };
    } catch (error) {
      return { error: { message: error instanceof Error ? error.message : 'Unknown error' } };
    }
  },

  getCurrentUser: async () => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!session) {
        return { user: null, error: null };
      }

      const parsedSession: Session = JSON.parse(session);
      
      // Check if session is expired
      if (parsedSession.expires_at < Date.now()) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return { user: null, error: { message: 'Session expired' } };
      }

      return { user: parsedSession.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  getSession: async () => {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      if (!session) {
        return { data: { session: null }, error: null };
      }

      const parsedSession: Session = JSON.parse(session);
      
      // Check if session is expired
      if (parsedSession.expires_at < Date.now()) {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return { data: { session: null }, error: null };
      }

      return { data: { session: parsedSession }, error: null };
    } catch (error) {
      return {
        data: { session: null },
        error: { message: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  },

  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    // Simple implementation for local storage
    // In a real app, you might want to use storage events or custom events
    const checkSession = () => {
      const session = localStorage.getItem(STORAGE_KEYS.SESSION);
      const parsedSession = session ? JSON.parse(session) : null;
      
      if (parsedSession && parsedSession.expires_at > Date.now()) {
        callback('SIGNED_IN', parsedSession);
      } else {
        callback('SIGNED_OUT', null);
      }
    };

    // Initial check
    checkSession();

    // Listen for storage changes (across tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.SESSION) {
        checkSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            window.removeEventListener('storage', handleStorageChange);
          }
        }
      }
    };
  }
};

// Utility function to get current user ID
export const getCurrentUserId = (): string | null => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    if (user) {
      const parsedUser: User = JSON.parse(user);
      return parsedUser.id;
    }
    return null;
  } catch {
    return null;
  }
};

// Budget data storage utilities
export const budgetStorage = {
  getKey: (userId: string, category: string, profileName: string, month: number, year: number) => {
    return `${STORAGE_KEYS.BUDGET_DATA}_${userId}_${category}_${profileName}_${month}_${year}`;
  },

  save: (userId: string, category: string, profileName: string, month: number, year: number, data: any) => {
    const key = budgetStorage.getKey(userId, category, profileName, month, year);
    localStorage.setItem(key, JSON.stringify(data));
  },

  load: (userId: string, category: string, profileName: string, month: number, year: number) => {
    const key = budgetStorage.getKey(userId, category, profileName, month, year);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  },

  remove: (userId: string, category: string, profileName: string, month: number, year: number) => {
    const key = budgetStorage.getKey(userId, category, profileName, month, year);
    localStorage.removeItem(key);
  },

  // Get all keys for a user (for cleanup or migration)
  getUserKeys: (userId: string) => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${STORAGE_KEYS.BUDGET_DATA}_${userId}_`)) {
        keys.push(key);
      }
    }
    return keys;
  },

  // Clear all data for a user
  clearUserData: (userId: string) => {
    const keys = budgetStorage.getUserKeys(userId);
    keys.forEach(key => localStorage.removeItem(key));
  }
};
