import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  PlusIcon, 
  CogIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: HomeIcon },
  { name: 'New Monitor', href: '/app/monitors/new', icon: PlusIcon },
  { name: 'Analytics', href: '/app/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/app/settings', icon: CogIcon },
];

const Sidebar = () => {
  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-6">
          <h1 className="text-xl font-bold text-gradient">Web3 Monitor</h1>
        </div>
        
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
        
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Powered by Web3 Technology
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;