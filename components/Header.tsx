"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Plus, Sun, Moon } from "lucide-react";
import { FaUser } from "react-icons/fa";
import "../styles/header.css";

// Custom hook for media query
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);
  return matches;
}

export function SearchBar({ searchTerm, onSearchChange }: { searchTerm?: string, onSearchChange?: (term: string) => void }) {
  return (
    <div className="search-input" style={{ width: '100%', maxWidth: '100%' }}>
      <input
        type="text"
        placeholder="Search by room, language, level, or username..."
        value={searchTerm || ''}
        onChange={e => onSearchChange && onSearchChange(e.target.value)}
        aria-label="Search rooms"
        style={{ width: '100%' }}
      />
    </div>
  );
}

interface HeaderProps {
  onCreateRoomClick?: () => void;
  onProfileClick?: () => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onCreateRoomClick, onProfileClick, searchTerm, onSearchChange }) => {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 641px)');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    // Initialize theme from localStorage after mount
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else {
        // Optionally: detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <header className={`header-root${scrolled ? " shadow-md" : ""}`}>
      <div className="header-container">
        {/* Brand Title */}
        <div className="header-logo">
          <Link href="/" className="header-brand-text">
            <span>Vocably</span>
          </Link>
        </div>
        {/* Search Bar: only on desktop */}
        {isDesktop && (
          <SearchBar searchTerm={searchTerm} onSearchChange={onSearchChange} />
        )}
        {/* Desktop Navigation */}
        <nav className="header-actions">
          <button className="header-btn" tabIndex={0} onClick={onCreateRoomClick}>
            <Plus size={18} /> Create Room
          </button>
        </nav>
        {/* Actions: Profile & Mobile Menu */}
        <div className="header-actions">
          <button
            className="header-btn header-profile-btn"
            tabIndex={0}
            aria-label="Profile"
            onClick={onProfileClick}
          >
            <FaUser size={22} />
          </button>
          {isDesktop && mounted && (
            <button
              className="header-btn"
              tabIndex={0}
              aria-label="Toggle theme"
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          )}
          <button
            className="header-menu-btn"
            aria-label="Open menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="header-mobile-menu">
          <button className="header-btn" tabIndex={0} onClick={onCreateRoomClick}>
            <Plus size={18} /> Create Room
          </button>
          <button
            className="header-btn header-profile-btn"
            tabIndex={0}
            aria-label="Profile"
            onClick={() => {
              onProfileClick && onProfileClick();
              setMenuOpen(false);
            }}
          >
            <FaUser size={22} />
          </button>
          {mounted && (
            <button
              className="header-btn"
              tabIndex={0}
              aria-label="Toggle theme"
              onClick={toggleTheme}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
