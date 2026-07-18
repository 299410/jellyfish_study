import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'user_gemini_api_key';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount (client-side only)
    const storedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (storedKey) {
      setApiKeyState(storedKey);
    }
    setIsLoaded(true);
  }, []);

  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key.trim() === '') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
    }
  };

  return { apiKey, setApiKey, isLoaded };
}
