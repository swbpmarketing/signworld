import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  const [previewState, setPreviewState] = useState<PreviewState>({ type: null });
  const initializeRef = useRef(false);

  const isPreviewMode = previewState.type !== null && user?.role === 'admin';

  // Initialize preview state from sessionStorage when user becomes an admin
  useEffect(() => {
    // Only run this once and only when user is an admin
    if (user?.role === 'admin' && !initializeRef.current) {
      initializeRef.current = true;

      try {
        if (typeof window !== 'undefined' && typeof sessionStorage !== 'undefined') {
          const stored = sessionStorage.getItem(PREVIEW_MODE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.type === 'role' || parsed.type === 'user') {
              setPreviewState(parsed);
            }
          } else {
            // If sessionStorage is empty, clear any preview state
            setPreviewState({ type: null });
          }
        }
      } catch (error) {
        // Silently fail if sessionStorage is not available
      }
    }
  }, [user?.role]);

  // Persist preview state to sessionStorage
  useEffect(() => {
    try {
      if (previewState.type !== null) {
        const stateStr = JSON.stringify(previewState);
        sessionStorage.setItem(PREVIEW_MODE_KEY, stateStr);
      }
      // Don't remove the key here - only remove it in exitPreview()
      // This prevents a race condition where the persistence effect deletes the key
      // before the initialization effect can restore it on page refresh
    } catch (error) {
      // Silently fail if sessionStorage is not available
    }
  }, [previewState]);

  // Clear preview mode if user is not an admin or logged out
  useEffect(() => {
    if (!user) {
      // User logged out - reset everything
      initializeRef.current = false;
      setPreviewState({ type: null });
    } else if (user.role !== 'admin' && previewState.type !== null) {
      // User is not admin - clear preview mode
      setPreviewState({ type: null });
    }
  }, [user]);

  const startPreview = useCallback((role: 'owner' | 'vendor') => {
    setPreviewState({
      type: 'role',
      role,
    });
  }, []);

  const startUserPreview = useCallback((userId: string, userName: string, userEmail: string, userRole: 'owner' | 'vendor') => {
    const newState: PreviewState = {
      type: 'user',
      userId,
      userName,
      userEmail,
      userRole,
    };
    setPreviewState(newState);
  }, []);

  const exitPreview = useCallback(() => {
    setPreviewState({ type: null });
    try {
      sessionStorage.removeItem(PREVIEW_MODE_KEY);
    } catch (error) {
      // Silently fail if sessionStorage is not available
    }
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
    // Check if we have preview state with user data (don't require isPreviewMode to be true
    // because user might still be loading when this is called)
    if (previewState.type === 'user' && previewState.userId && user?.role === 'admin') {
      return {
        id: previewState.userId,
        name: previewState.userName || '',
        email: previewState.userEmail || '',
        role: previewState.userRole || 'owner',
      };
    }
    return null;
  }, [previewState, user?.role]);

  const contextValue = useMemo(() => ({
    previewState,
    isPreviewMode,
    startPreview,
    startUserPreview,
    exitPreview,
    getEffectiveRole,
    getPreviewedUser,
  }), [previewState, isPreviewMode]);

  return (
    <PreviewModeContext.Provider value={contextValue}>
      {children}
    </PreviewModeContext.Provider>
  );
};
