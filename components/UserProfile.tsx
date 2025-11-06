import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 bg-purple-800/50 hover:bg-purple-700/50 rounded-lg px-4 py-2 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-white font-medium text-sm">
            {user.first_name} {user.last_name}
          </div>
          <div className="text-purple-300 text-xs">
            {user.credits_balance} credits
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-purple-300 transition-transform ${
            isDropdownOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isDropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsDropdownOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-purple-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-purple-500/30 z-20">
            <div className="p-4 border-b border-purple-500/30">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold">
                  {getInitials(user.first_name, user.last_name)}
                </div>
                <div>
                  <div className="text-white font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-purple-300 text-sm">{user.email}</div>
                  <div className="text-cyan-400 text-sm font-medium">
                    {user.subscription_tier.toUpperCase()} Plan
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <div className="px-3 py-2 text-purple-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Credits Balance:</span>
                  <span className="font-semibold text-cyan-400">
                    {user.credits_balance}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">Account Status:</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    user.is_verified 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {user.is_verified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>
              
              <hr className="border-purple-500/30 my-2" />
              
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserProfile;