// Mock authentication system for development when Supabase is unavailable
interface MockUser {
  id: string;
  email: string;
  name:   {
    "dependencies": {
      "tailwindcss": "^3.x.x",
      "recharts": "^2.x.x",
      "lucide-react": "^0.x.x", // For icons
      "react": "^18.x.x",
      "typescript": "^5.x.x"
    }
  }string;
  organization?: string;
  created_at: string;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  user: MockUser;
}

interface MockAuthResult {
  data: {
    user: MockUser | null;
    session: MockSession | null;
  };
  error: { message: string } | null;
}

class MockAuth {
  private currentUser: MockUser | null = null;
  private currentSession: MockSession | null = null;
  private users: Map<string, { password: string; user: MockUser }> = new Map();

  constructor() {
    // Load from localStorage if available
    const savedSession = localStorage.getItem('mockAuth_session');
    if (savedSession) {
      try {
        this.currentSession = JSON.parse(savedSession);
        this.currentUser = this.currentSession?.user || null;
      } catch (e) {
        console.warn('Failed to parse saved mock session');
      }
    }
  }

  private saveSession(session: MockSession | null) {
    if (session) {
      localStorage.setItem('mockAuth_session', JSON.stringify(session));
      this.currentSession = session;
      this.currentUser = session.user;
    } else {
      localStorage.removeItem('mockAuth_session');
      this.currentSession = null;
      this.currentUser = null;
    }
  }

  private generateToken(): string {
    return 'mock_token_' + Math.random().toString(36).substr(2) + Date.now().toString(36);
  }

  async signUp(email: string, password: string, metadata: { name: string; organization?: string }): Promise<MockAuthResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check if user already exists
    if (this.users.has(email)) {
      return {
        data: { user: null, session: null },
        error: { message: 'User already registered' }
      };
    }

    // Create new user
    const user: MockUser = {
      id: 'mock_user_' + Date.now(),
      email,
      name: metadata.name,
      organization: metadata.organization,
      created_at: new Date().toISOString()
    };

    const session: MockSession = {
      access_token: this.generateToken(),
      refresh_token: this.generateToken(),
      user
    };

    // Store user
    this.users.set(email, { password, user });
    
    // Auto sign in after signup
    this.saveSession(session);

    console.log('✅ Mock signup successful for:', email);
    
    return {
      data: { user, session },
      error: null
    };
  }

  async signInWithPassword(email: string, password: string): Promise<MockAuthResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const userRecord = this.users.get(email);
    
    if (!userRecord || userRecord.password !== password) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };
    }

    const session: MockSession = {
      access_token: this.generateToken(),
      refresh_token: this.generateToken(),
      user: userRecord.user
    };

    this.saveSession(session);

    console.log('✅ Mock signin successful for:', email);

    return {
      data: { user: userRecord.user, session },
      error: null
    };
  }

  async signOut(): Promise<{ error: null }> {
    this.saveSession(null);
    console.log('✅ Mock signout successful');
    return { error: null };
  }

  getUser(): MockUser | null {
    return this.currentUser;
  }

  getSession(): MockSession | null {
    return this.currentSession;
  }
}

export const mockAuth = new MockAuth();
