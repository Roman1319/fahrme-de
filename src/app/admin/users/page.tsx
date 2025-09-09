"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Users, Search, Filter, MoreVertical, Trash2, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  car_count?: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Error loading auth users:', authError);
        throw authError;
      }

      // Get car counts for each user
      const usersWithCarCounts = await Promise.all(
        authUsers.users.map(async (user) => {
          const { count } = await supabase
            .from('cars')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user.id);
          
          return {
            id: user.id,
            email: user.email || 'No email',
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            car_count: count || 0
          };
        })
      );

      setUsers(usersWithCarCounts);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-4xl font-bold mb-4">Управление пользователями</h1>
        <p className="text-lg text-gray-400">Всего пользователей: {users.length}</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1A1A1A] rounded-xl p-8">
        <div className="flex items-center space-x-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-[#0A0A0A] border border-[#333] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 text-lg"
            />
          </div>
          <button className="flex items-center space-x-3 px-6 py-4 bg-[#0A0A0A] border border-[#333] rounded-xl hover:bg-[#333] transition-colors">
            <Filter className="h-5 w-5" />
            <span className="text-lg">Фильтры</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0A0A0A] border-b border-[#333]">
              <tr>
                <th className="px-8 py-6 text-left text-base font-medium text-gray-300">Пользователь</th>
                <th className="px-8 py-6 text-left text-base font-medium text-gray-300">Автомобили</th>
                <th className="px-8 py-6 text-left text-base font-medium text-gray-300">Регистрация</th>
                <th className="px-8 py-6 text-left text-base font-medium text-gray-300">Последний вход</th>
                <th className="px-8 py-6 text-left text-base font-medium text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#333]/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white text-lg">{user.email}</p>
                        <p className="text-sm text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-900 text-green-300">
                      {user.car_count} авто
                    </span>
                  </td>
                  <td className="px-8 py-6 text-base text-gray-300">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-8 py-6 text-base text-gray-300">
                    {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Никогда'}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-3">
                      <button className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-[#444] rounded-lg">
                        <Shield className="h-5 w-5" />
                      </button>
                      <button className="p-3 text-gray-400 hover:text-red-400 transition-colors hover:bg-[#444] rounded-lg">
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button className="p-3 text-gray-400 hover:text-white transition-colors hover:bg-[#444] rounded-lg">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}
