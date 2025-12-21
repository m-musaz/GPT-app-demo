import { useState, useEffect } from 'react';

// OpenAI Apps SDK Widget interface (2025)
// Reference: https://developers.openai.com/apps-sdk/build/mcp-server/
export interface OpenAIWidget {
  // Data from tool response
  toolOutput?: Record<string, unknown>;
  toolInput?: Record<string, unknown>;
  toolResponseMetadata?: Record<string, unknown>;
  widgetState?: Record<string, unknown>;
  
  // Context signals
  theme?: 'light' | 'dark';
  displayMode?: string;
  maxHeight?: number;
  safeArea?: { top: number; bottom: number; left: number; right: number };
  view?: string;
  userAgent?: string;
  locale?: string;
  
  // APIs
  callTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  openExternal?: (url: string) => void;
  sendFollowUpMessage?: (message: string) => void;
  notifyIntrinsicHeight?: (height: number) => void;
  setWidgetState?: (state: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
  requestDisplayMode?: (mode: string) => void;
  requestModal?: (options: unknown) => void;
  uploadFile?: (file: File) => Promise<unknown>;
  getFileDownloadUrl?: (fileId: string) => Promise<string>;
}

declare global {
  interface Window {
    openai?: OpenAIWidget;
  }
}

export function useOpenAI<T = unknown>() {
  const [openai, setOpenai] = useState<OpenAIWidget | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const checkOpenAI = () => {
      attempts++;
      
      try {
        if (window.openai) {
          // Debug: log what we received
          console.log('[Widget] window.openai found:', Object.keys(window.openai));
          console.log('[Widget] toolOutput:', window.openai.toolOutput);
          console.log('[Widget] theme:', window.openai.theme);
          
          setOpenai(window.openai);
          
          // Widget reads data from toolOutput (server sends as structuredContent)
          // Reference: https://developers.openai.com/apps-sdk/build/mcp-server/
          const toolData = window.openai.toolOutput ?? null;
          
          console.log('[Widget] Using data:', toolData);
          
          setData(toolData as T);
          setTheme(window.openai.theme || 'light');
          setIsLoading(false);
        } else if (attempts < maxAttempts) {
          setTimeout(checkOpenAI, 100);
        } else {
          // Timeout - OpenAI not available
          console.log('[Widget] Timeout - window.openai not available after', attempts, 'attempts');
          setError('OpenAI widget context not available');
          setIsLoading(false);
        }
      } catch (e) {
        console.error('[Widget] Error:', e);
        setError(e instanceof Error ? e.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    checkOpenAI();
  }, []);

  const callTool = async (name: string, args: Record<string, unknown>) => {
    if (!openai?.callTool) throw new Error('OpenAI not initialized');
    return openai.callTool(name, args);
  };

  const openExternal = (url: string) => {
    if (openai?.openExternal) {
      openai.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const sendFollowUp = (message: string) => {
    if (openai?.sendFollowUpMessage) {
      openai.sendFollowUpMessage(message);
    }
  };

  const notifyHeight = () => {
    if (openai?.notifyIntrinsicHeight) {
      openai.notifyIntrinsicHeight(document.body.scrollHeight);
    }
  };

  const setWidgetState = (state: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => {
    if (openai?.setWidgetState) {
      openai.setWidgetState(state);
    }
  };

  return {
    openai,
    data,
    theme,
    isLoading,
    error,
    callTool,
    openExternal,
    sendFollowUp,
    notifyHeight,
    setWidgetState,
  };
}
