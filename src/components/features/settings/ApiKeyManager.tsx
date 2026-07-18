import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeyRound, Save, Eye, EyeOff, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { useApiKey } from '@/lib/hooks/useApiKey';

export function ApiKeyManager() {
  const { apiKey, setApiKey, isLoaded } = useApiKey();
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

  // Initialize input value when editing starts
  const handleEdit = () => {
    setInputValue(apiKey);
    setIsEditing(true);
    setSaveStatus('idle');
  };

  const handleSave = () => {
    setApiKey(inputValue);
    setIsEditing(false);
    setSaveStatus('success');
    
    // Reset status after 3 seconds
    setTimeout(() => {
      setSaveStatus('idle');
    }, 3000);
  };

  const hasKey = apiKey.trim().length > 0;

  if (!isLoaded) {
    return (
      <Card className="border-slate-200/60 shadow-sm animate-pulse h-40">
        <CardContent className="h-full" />
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/60 shadow-sm overflow-hidden bg-white/80">
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <KeyRound className="w-5 h-5 text-indigo-500" />
              AI Configuration
            </CardTitle>
            <CardDescription className="mt-1">
              To use AI features like Writing Check and Interview, you need to provide your own Google Gemini API Key.
            </CardDescription>
          </div>
          <div>
            {hasKey && !isEditing ? (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 px-3 py-1 font-semibold">
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Configured
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-0 px-3 py-1 font-semibold">
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Not Configured
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        <a 
          href="https://aistudio.google.com/app/apikey" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
        >
          👉 Get a free Gemini API Key here <ExternalLink className="w-3.5 h-3.5 ml-1" />
        </a>

        {!isEditing && hasKey ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex justify-between items-center">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <KeyRound className="w-4 h-4 text-slate-500" />
              </div>
              <div className="truncate">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {showKey ? apiKey : '••••••••••••••••••••••••••••••••••••••••'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Stored securely in your browser</p>
              </div>
            </div>
            
            <div className="flex gap-2 ml-4 shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowKey(!showKey)}
                className="text-slate-400 hover:text-slate-600"
                title={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEdit}
                className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
              >
                Edit Key
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Paste your Gemini API Key here (e.g. AIzaSy...)"
                className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                type="button"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="flex justify-end gap-2">
              {hasKey && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleSave} 
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={inputValue.trim() === ''}
              >
                {saveStatus === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Saved
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save Key
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
