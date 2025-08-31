import React, { useState } from 'react';
import { Menu } from '@headlessui/react';
import { 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useWeb3 } from '../context/Web3Context';

const Header = () => {
  const { user, logout } = useAuth();
  const { account, isConnected, connectWallet, disconnectWallet, getNetworkName, chainId } = useWeb3();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
          <Bars3Icon className="h-6 w-6" />
        </button>

        {/* Search and breadcrumbs could go here */}
        <div className="flex-1">
          {/* Placeholder for search or breadcrumbs */}
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Web3 Connection Status */}
          {isConnected ? (
            <div className="flex items-center space-x-2">
              <div className="text-sm">
                <div className="text-gray-900 font-medium">
                  {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Connected'}
                </div>
                <div className="text-gray-500 text-xs">
                  {getNetworkName(chainId)}
                </div>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          ) : (
            <button onClick={connectWallet} className="btn-primary text-sm">
              Connect Wallet
            </button>
          )}

          {/* Notifications */}
          <button className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 relative">
            <BellIcon className="h-6 w-6" />
            <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
          </button>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <UserCircleIcon className="h-8 w-8" />
            </Menu.Button>

            <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <div className="p-4 border-b border-gray-100">
                <div className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm text-gray-500">{user?.email}</div>
              </div>
              
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="/app/settings"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Settings
                    </a>
                  )}
                </Menu.Item>
                
                <Menu.Item>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`block px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Help & Support
                    </a>
                  )}
                </Menu.Item>
                
                {isConnected && (
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={disconnectWallet}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        Disconnect Wallet
                      </button>
                    )}
                  </Menu.Item>
                )}
                
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;