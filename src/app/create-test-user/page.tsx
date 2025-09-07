"use client";
import { useState } from "react";

export default function CreateTestUserPage() {
  const [message, setMessage] = useState("");

  const createTestUser = () => {
    try {
      const testUser = {
        id: "test-user-1",
        name: "Test User",
        email: "dyatchinr@gmail.com",
        password: "123456",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const users = JSON.parse(localStorage.getItem('fahrme:users') || '[]');
      const existingUser = users.find((u: { email: string }) => u.email === testUser.email);
      
      if (!existingUser) {
        users.push(testUser);
        localStorage.setItem('fahrme:users', JSON.stringify(users));
        setMessage(`✅ Test user created successfully!
Email: ${testUser.email}
Password: ${testUser.password}`);
      } else {
        setMessage(`ℹ️ Test user already exists!
Email: ${existingUser.email}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    }
  };

  const clearAllData = () => {
    try {
      localStorage.clear();
      setMessage("🗑️ All localStorage data cleared!");
    } catch (error) {
      setMessage(`❌ Error clearing data: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Test User Management</h1>
        
        <div className="space-y-4">
          <button 
            onClick={createTestUser}
            className="btn-primary"
          >
            Create Test User
          </button>
          
          <button 
            onClick={clearAllData}
            className="btn-secondary"
          >
            Clear All Data
          </button>
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Current localStorage data:</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto">
              {typeof window !== 'undefined' ? JSON.stringify({
                users: JSON.parse(localStorage.getItem('fahrme:users') || '[]'),
                session: localStorage.getItem('fahrme:session')
              }, null, 2) : 'Not available'}
            </pre>
          </div>
          
          {message && (
            <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900 rounded">
              <pre className="whitespace-pre-wrap">{message}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
