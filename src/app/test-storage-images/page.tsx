'use client';

import { useState } from 'react';
import { getLogbookImage, getAvatarImage, getCarImage, getStorageUrl } from '@/lib/storage-helpers';
import { StorageImage, StorageImg } from '@/components/ui/StorageImage';

export default function TestStorageImagesPage() {
  const [testStoragePath, setTestStoragePath] = useState('test/user123/entry456/image.jpg');

  const testImages = [
    {
      name: 'Logbook Image',
      image: getLogbookImage(testStoragePath),
      type: 'logbook'
    },
    {
      name: 'Avatar Image',
      image: getAvatarImage(testStoragePath),
      type: 'avatars'
    },
    {
      name: 'Car Image',
      image: getCarImage(testStoragePath),
      type: 'cars'
    },
    {
      name: 'Empty Logbook Image',
      image: getLogbookImage(null),
      type: 'logbook'
    },
    {
      name: 'Empty Avatar Image',
      image: getAvatarImage(undefined),
      type: 'avatars'
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Storage Images Test</h1>
      
      {/* Test Input */}
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Test Storage Path</h2>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">
              Storage Path:
            </label>
            <input
              type="text"
              value={testStoragePath}
              onChange={(e) => setTestStoragePath(e.target.value)}
              placeholder="e.g., test/user123/entry456/image.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p><strong>Generated URL:</strong> {getStorageUrl(testStoragePath, 'logbook')}</p>
        </div>
      </div>

      {/* Test Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testImages.map((test, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">{test.name}</h3>
            
            {/* Next.js Image Component */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Next.js Image Component:</h4>
              <div className="relative w-32 h-24 border border-gray-300 rounded">
                <StorageImage
                  image={test.image}
                  fill
                  className="object-cover rounded"
                />
              </div>
            </div>

            {/* Regular img tag */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Regular img tag:</h4>
              <div className="w-32 h-24 border border-gray-300 rounded overflow-hidden">
                <StorageImg
                  image={test.image}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Image Info */}
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Type:</strong> {test.type}</p>
              <p><strong>Src:</strong> {test.image.src}</p>
              <p><strong>Alt:</strong> {test.image.alt}</p>
              <p><strong>Fallback:</strong> {test.image.fallback}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Error Handling Test */}
      <div className="mt-8 bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">
          Error Handling Test
        </h2>
        <p className="text-red-700 dark:text-red-300 mb-4">
          These images should show fallback placeholders when they fail to load:
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">Invalid Logbook Path</h4>
            <div className="relative w-24 h-16 border border-gray-300 rounded">
              <StorageImage
                image={getLogbookImage('invalid/path/image.jpg')}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">Empty Avatar</h4>
            <div className="relative w-24 h-16 border border-gray-300 rounded">
              <StorageImage
                image={getAvatarImage('')}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">Null Car Image</h4>
            <div className="relative w-24 h-16 border border-gray-300 rounded">
              <StorageImage
                image={getCarImage(null)}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium mb-2">Undefined Image</h4>
            <div className="relative w-24 h-16 border border-gray-300 rounded">
              <StorageImage
                image={getLogbookImage(undefined)}
                fill
                className="object-cover rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">
          Usage Examples
        </h2>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium">Feed Images:</h4>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
              {`const image = getLogbookImage(post.media_preview);
<StorageImg image={image} className="w-full h-full object-cover" />`}
            </code>
          </div>
          
          <div>
            <h4 className="font-medium">Profile Avatars:</h4>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
              {`const image = getAvatarImage(profile.avatar_url);
<StorageImage image={image} fill className="rounded-full object-cover" />`}
            </code>
          </div>
          
          <div>
            <h4 className="font-medium">Car Photos:</h4>
            <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
              {`const image = getCarImage(photo.storage_path);
<StorageImage image={image} width={200} height={150} className="object-cover" />`}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
