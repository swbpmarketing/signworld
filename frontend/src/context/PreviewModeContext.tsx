import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

type PreviewRole = 'owner' | 'vendor' | null;

const PREVIEW_MODE_KEY = 'preview-mode-role';

// Helper to get initial state from sessionStorage
const getInitialPreviewRole = (): PreviewRole => {
  try {
    const stored = sessionStorage.getItem(PREVIEW_MODE_KEY);
    if (stored === 'owner' || stored === 'vendor') {
      return stored;
    }
  } catch {
    // sessionStorage not available
  }
  return null;
};

interface PreviewModeContextType {
  previewRole: PreviewRole;
  isPreviewMode: boolean;
  startPreview: (role: 'owner' | 'vendor') => void;
  exitPreview: () => void;
  getEffectiveRole: () => 'admin' | 'owner' | 'vendor';
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
  const [previewRole, setPreviewRole] = useState<PreviewRole>(getInitialPreviewRole);

  const isPreviewMode = previewRole !== null && user?.role === 'admin';

  // Persist preview role to sessionStorage
  useEffect(() => {
    try {
      if (previewRole) {
        sessionStorage.setItem(PREVIEW_MODE_KEY, previewRole);
      } else {
        sessionStorage.removeItem(PREVIEW_MODE_KEY);
      }
    } catch {
      // sessionStorage not available
    }
  }, [previewRole]);

  // Clear preview mode if user is not an admin
  useEffect(() => {
    if (user && user.role !== 'admin' && previewRole !== null) {
      setPreviewRole(null);
    }
  }, [user, previewRole]);

  const startPreview = useCallback((role: 'owner' | 'vendor') => {
    // Only admins can enter preview mode
    if (user?.role === 'admin') {
      setPreviewRole(role);
    }
  }, [user?.role]);

  const exitPreview = useCallback(() => {
    setPreviewRole(null);
  }, []);

  const getEffectiveRole = useCallback((): 'admin' | 'owner' | 'vendor' => {
    // If in preview mode and user is admin, return the preview role
    if (isPreviewMode && previewRole) {
      return previewRole;
    }
    // Otherwise return the actual user role
    return user?.role || 'owner';
  }, [isPreviewMode, previewRole, user?.role]);

  return (
    <PreviewModeContext.Provider
      value={{
        previewRole,
        isPreviewMode,
        startPreview,
        exitPreview,
        getEffectiveRole,
      }}
    >
      {children}
    </PreviewModeContext.Provider>
  );
};
