import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface PreviewState {
  type: 'role' | 'user' | null;
  role?: 'owner' | 'vendor';
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: 'owner' | 'vendor';
}

const PREVIEW_MODE_KEY = 'preview-mode-state';

// Helper to get initial state from sessionStorage
const getInitialPreviewState = (): PreviewState => {
  try {
    const stored = sessionStorage.getItem(PREVIEW_MODE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the parsed state
      if (parsed.type === 'role' || parsed.type === 'user') {
        return parsed;
      }
    }
  } catch {
    // sessionStorage not available or invalid JSON
  }
  return { type: null };
};

interface PreviewModeContextType {
  previewState: PreviewState;
  isPreviewMode: boolean;
  startPreview: (role: 'owner' | 'vendor') => void;
  startUserPreview: (userId: string, userName: string, userEmail: string, userRole: 'owner' | 'vendor') => void;
  exitPreview: () => void;
  getEffectiveRole: () => 'admin' | 'owner' | 'vendor';
  getPreviewedUser: () => { id: string; name: string; email: string; role: 'owner' | 'vendor' } | null;
}

const PreviewModeContext = createContext<PreviewModeContextType | undefined>(undefined);

export const usePreviewMode = () => {
  const context = useContext(PreviewModeContext);
  if (!context) {
    throw new Error('usePreviewMode must be used within a PreviewModeProvider');
  }
  return context;
};

export const PreviewModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [previewState, setPreviewState] = useState<PreviewState>(getInitialPreviewState);

  const isPreviewMode = previewState.type !== null && user?.role === 'admin';

  // Persist preview state to sessionStorage
  useEffect(() => {
    try {
      if (previewState.type !== null) {
        sessionStorage.setItem(PREVIEW_MODE_KEY, JSON.stringify(previewState));
      } else {
        sessionStorage.removeItem(PREVIEW_MODE_KEY);
      }
    } catch {
      // sessionStorage not available
    }
  }, [previewState]);

  // Clear preview mode if user is not an admin
  useEffect(() => {
    if (user && user.role !== 'admin' && previewState.type !== null) {
      setPreviewState({ type: null });
    }
  }, [user, previewState]);

  const startPreview = useCallback((role: 'owner' | 'vendor') => {
    // Only admins can enter preview mode
    if (user?.role === 'admin') {
      setPreviewState({
        type: 'role',
        role,
      });
    }
  }, [user?.role]);

  const startUserPreview = useCallback((userId: string, userName: string, userEmail: string, userRole: 'owner' | 'vendor') => {
    // Only admins can enter preview mode
    if (user?.role === 'admin') {
      setPreviewState({
        type: 'user',
        userId,
        userName,
        userEmail,
        userRole,
      });
    }
  }, [user?.role]);

  const exitPreview = useCallback(() => {
    setPreviewState({ type: null });
  }, []);

  const getEffectiveRole = useCallback((): 'admin' | 'owner' | 'vendor' => {
    // If in preview mode and user is admin
    if (isPreviewMode) {
      if (previewState.type === 'role') {
        return previewState.role || 'owner';
      } else if (previewState.type === 'user') {
        return previewState.userRole || 'owner';
      }
    }
    // Otherwise return the actual user role
    return user?.role || 'owner';
  }, [isPreviewMode, previewState, user?.role]);

  const getPreviewedUser = useCallback(() => {
    if (isPreviewMode && previewState.type === 'user' && previewState.userId) {
      return {
        id: previewState.userId,
        name: previewState.userName || '',
        email: previewState.userEmail || '',
        role: previewState.userRole || 'owner',
      };
    }
    return null;
  }, [isPreviewMode, previewState]);

  return (
    <PreviewModeContext.Provider
      value={{
        previewState,
        isPreviewMode,
        startPreview,
        startUserPreview,
        exitPreview,
        getEffectiveRole,
        getPreviewedUser,
      }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};
