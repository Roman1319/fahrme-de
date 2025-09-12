'use client';

import { useState } from 'react';

export default function TestAvatarPage() {
  const [avatar, setAvatar] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      addLog('No file selected');
      return;
    }

    addLog(`File selected: ${file.name}, type: ${file.type}, size: ${file.size}`);

    if (!file.type.startsWith('image/')) {
      addLog('ERROR: Not an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addLog('ERROR: File too large');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      addLog('FileReader onload triggered');
      const result = String(reader.result);
      addLog(`Data URL length: ${result.length}`);
      
      // Test image loading
      const img = new Image();
      img.onload = () => {
        addLog(`Image loaded: ${img.width}x${img.height}`);
        setAvatar(result);
        addLog('Avatar state updated');
      };
      img.onerror = () => {
        addLog('ERROR: Image load failed');
      };
      img.src = result;
    };

    reader.onerror = () => {
      addLog(`ERROR: FileReader failed - ${reader.error}`);
    };

    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    addLog('Save button clicked');
    
    if (!avatar) {
      addLog('ERROR: No avatar to save');
      return;
    }

    try {
      const profileData = {
        id: 'test',
        displayName: 'Test User',
        avatarUrl: avatar
      };

      addLog(`Saving profile with avatar length: ${avatar.length}`);
      localStorage.setItem('test-profile', JSON.stringify(profileData));
      addLog('Profile saved to localStorage');

      // Verify
      const saved = localStorage.getItem('test-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        addLog(`Verification: saved avatar length: ${parsed.avatarUrl?.length || 0}`);
      } else {
        addLog('ERROR: Verification failed - no data in localStorage');
      }

    } catch (error) {
      addLog(`ERROR: Save failed - ${error}`);
    }
  };

  const handleLoad = () => {
    addLog('Load button clicked');
    
    try {
      const saved = localStorage.getItem('test-profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        addLog(`Loaded profile with avatar length: ${parsed.avatarUrl?.length || 0}`);
        setAvatar(parsed.avatarUrl || null);
      } else {
        addLog('No saved profile found');
      }
    } catch (error) {
      addLog(`ERROR: Load failed - ${error}`);
    }
  };

  const handleClear = () => {
    addLog('Clear button clicked');
    localStorage.removeItem('test-profile');
    setAvatar(null);
    setLogs([]);
    addLog('Cleared all data');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Safari Avatar Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Upload */}
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">File Upload</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-2"
          />
          
          {avatar && (
            <div className="mt-2">
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-32 h-32 object-cover rounded"
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Actions</h2>
          <div className="space-y-2">
            <button 
              onClick={handleSave}
              className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            >
              Save
            </button>
            <button 
              onClick={handleLoad}
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
            >
              Load
            </button>
            <button 
              onClick={handleClear}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Debug Logs</h2>
        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browser Info */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Browser Info</h2>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
          <p><strong>FileReader Support:</strong> {typeof FileReader !== 'undefined' ? 'Yes' : 'No'}</p>
          <p><strong>localStorage Support:</strong> {typeof localStorage !== 'undefined' ? 'Yes' : 'No'}</p>
          <p><strong>Image Support:</strong> {typeof Image !== 'undefined' ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}

