"use client";

import { Search, Bell, Menu } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';

export function Header() {
  const notifications = useStore(state => state.notifications);
  const unreadCount = notifications.filter(n => !n.read).length;
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        <button className="md:hidden text-muted-foreground hover:text-foreground">
          <Menu size={20} />
        </button>
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text" 
            placeholder="Search properties, customers, orders..." 
            className="w-full bg-background border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
          />
          {searchOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-md shadow-lg p-2">
              <p className="text-xs text-muted-foreground p-2">Global search demo enabled...</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-muted-foreground hover:text-foreground transition-colors p-2">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card"></span>
          )}
        </button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
          A
        </div>
      </div>
    </header>
  );
}
