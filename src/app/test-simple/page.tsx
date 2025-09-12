'use client';

export default function TestSimplePage() {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('File selected:', file);
    
    if (!file) {
      alert('No file selected');
      return;
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    if (!file.type.startsWith('image/')) {
      alert('Not an image file');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      console.log('FileReader success');
      const result = String(reader.result);
      console.log('Data URL length:', result.length);
      
      // Test localStorage
      try {
        localStorage.setItem('test-avatar', result);
        console.log('Saved to localStorage');
        
        // Verify
        const saved = localStorage.getItem('test-avatar');
        console.log('Verification - saved length:', saved?.length);
        
        alert('Success! Check console for details.');
      } catch (error) {
        console.error('localStorage error:', error);
        alert('localStorage error: ' + error);
      }
    };

    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      alert('FileReader error: ' + reader.error);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Simple Test (No React State)</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Select an image file:
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open browser console (F12 or right-click → Inspect → Console)</li>
            <li>Select an image file</li>
            <li>Check console for logs</li>
            <li>Check if alert appears</li>
          </ol>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Browser Info:</h2>
          <p className="text-sm">User Agent: {navigator.userAgent}</p>
          <p className="text-sm">FileReader: {typeof FileReader !== 'undefined' ? 'Supported' : 'Not Supported'}</p>
          <p className="text-sm">localStorage: {typeof localStorage !== 'undefined' ? 'Supported' : 'Not Supported'}</p>
        </div>
      </div>
    </div>
  );
}

