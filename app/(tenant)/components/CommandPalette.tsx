'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  MagnifyingGlassIcon,
  HomeIcon,
  InboxIcon,
  AlertIcon,
  RocketIcon,
  CalendarIcon,
  ImageIcon,
  LinkIcon,
  ChartIcon,
  SettingsIcon,
  XIcon,
  ArrowRightIcon,
} from "./icons";

type Command = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  category: string;
  keywords?: string[];
};

const COMMANDS: Command[] = [
  // Navigation
  { id: 'overview', label: 'Go to Overview', href: '/app', icon: <HomeIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['dashboard', 'home'] },
  { id: 'inbox', label: 'Go to Inbox', href: '/app/inbox', icon: <InboxIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['messages', 'conversations'] },
  { id: 'escalations', label: 'Go to Escalations', href: '/app/escalations', icon: <AlertIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['alerts', 'urgent'] },
  { id: 'campaigns', label: 'Go to Campaigns', href: '/app/campaigns', icon: <RocketIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['posts', 'scheduled'] },
  { id: 'calendar', label: 'Go to Calendar', href: '/app/calendar', icon: <CalendarIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['schedule'] },
  { id: 'media', label: 'Go to Media Library', href: '/app/media', icon: <ImageIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['images', 'videos', 'assets'] },
  { id: 'analytics', label: 'Go to Analytics', href: '/app/analytics', icon: <ChartIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['stats', 'metrics', 'insights'] },
  { id: 'integrations', label: 'Go to Integrations', href: '/app/integrations', icon: <LinkIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['platforms', 'connect'] },
  { id: 'settings', label: 'Go to Settings', href: '/app/settings', icon: <SettingsIcon className="w-5 h-5" />, category: 'Navigation', keywords: ['preferences', 'config'] },
  
  // Actions
  { id: 'new-post', label: 'Create New Post', href: '/app/posts/new', icon: <RocketIcon className="w-5 h-5" />, category: 'Actions', keywords: ['create', 'new', 'post', 'campaign'] },
  { id: 'upload-media', label: 'Upload Media', href: '/app/media', icon: <ImageIcon className="w-5 h-5" />, category: 'Actions', keywords: ['upload', 'image', 'video'] },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return COMMANDS;
    
    const lowerQuery = query.toLowerCase();
    return COMMANDS.filter((cmd) => {
      const matchesLabel = cmd.label.toLowerCase().includes(lowerQuery);
      const matchesCategory = cmd.category.toLowerCase().includes(lowerQuery);
      const matchesKeywords = cmd.keywords?.some((kw) => kw.toLowerCase().includes(lowerQuery));
      return matchesLabel || matchesCategory || matchesKeywords;
    });
  }, [query]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle navigation
  const handleSelect = (command: Command) => {
    router.push(command.href);
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
  };

  // Keyboard navigation within palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          setIsOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }}
      />
      
      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands, pages, or actions..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => {
                setIsOpen(false);
                setQuery("");
                setSelectedIndex(0);
              }}
              className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">No commands found</p>
                <p className="mt-1 text-xs text-gray-400">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedCommands).map(([category, commands]) => (
                  <div key={category}>
                    <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {commands.map((command, index) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;
                        
                        return (
                          <button
                            key={command.id}
                            onClick={() => handleSelect(command)}
                            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                              isSelected
                                ? "bg-accent/10 text-accent dark:bg-accent/20 dark:text-accent-400"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }`}
                          >
                            <div className={`${isSelected ? "text-accent dark:text-accent-400" : "text-gray-400 dark:text-gray-500"}`}>
                              {command.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{command.label}</div>
                            </div>
                            {isSelected && (
                              <ArrowRightIcon className="h-4 w-4 text-accent dark:text-accent-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 font-mono">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 font-mono">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

