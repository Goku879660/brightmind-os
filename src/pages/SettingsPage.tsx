import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('focusos_openai_key') || '';
    setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('focusos_openai_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-screen overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-6 pb-20">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your FocusOS.</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">OpenAI API Key</label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Required for AI features. Never sent anywhere except OpenAI directly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave}>Save</Button>
          {saved && (
            <span className="text-sm text-success animate-in fade-in duration-200">Saved.</span>
          )}
        </div>
      </div>
    </div>
  );
}
