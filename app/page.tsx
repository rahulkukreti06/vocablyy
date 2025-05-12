'use client';

import React, { useEffect, useState } from 'react';
import { generateRoomId } from '@/lib/client-utils';
import { FaUser, FaLock, FaComments, FaFilter } from 'react-icons/fa';
import { Header, SearchBar } from '../components/Header';
import { RoomList } from '../components/RoomList';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { UserProfile } from '../components/UserProfile';
import RoomCard from '../components/RoomCard';
import JoinRoomModal from '../components/JoinRoomModal';
import { useRouter } from 'next/navigation';
import { useLiveParticipantCounts } from '../hooks/useLiveParticipantCounts';
import BuyMeCoffee from '../components/BuyMeCoffee';

interface Room {
  id: string;
  name: string;
  createdAt: number;
  participants: number;
  maxParticipants: number;
  language: string;
  languageLevel: 'beginner' | 'intermediate' | 'advanced';
  isPublic: boolean;
  password?: string;
  createdBy: string;
  topic?: string;
  tags?: string[];
}

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

export default function Page() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joiningRoom, setJoiningRoom] = useState<Room | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [joinPasswordError, setJoinPasswordError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'alphabetical'>('newest');
  const [roomType, setRoomType] = useState<'all' | 'public' | 'private'>('all');
  const [availability, setAvailability] = useState<'all' | 'available' | 'full'>('all');

  const router = useRouter();
  const participantCounts = useLiveParticipantCounts(rooms);
  const isMobile = useMediaQuery('(max-width: 640px)');

  const handleJoinRoom = async (room: Room) => {
    // Use real participant count
    const realCount = participantCounts[room.id] ?? room.participants;
    if (!room.isPublic) {
      setJoiningRoom(room);
      setShowJoinModal(true);
      setJoinPasswordError(null);
      return;
    }
    // Public room: join instantly
    if (realCount >= room.maxParticipants) {
      alert('Room is full!');
      return;
    }
    // Call backend to increment participant count
    try {
      await fetch('/api/room-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, action: 'join' }),
      });
      // Wait a short moment for the UI/WebSocket to update
      setTimeout(() => {
        router.push(`/rooms/${room.id}`);
      }, 300);
    } catch (err) {
      alert('Failed to join the room.');
      console.error(err);
    }
  };

  const handleModalJoin = (password?: string) => {
    if (!joiningRoom) return;
    setIsJoining(true);
    let passwordIncorrect = false;
    try {
      // Password check for private rooms
      if (!joiningRoom.isPublic && joiningRoom.password && joiningRoom.password !== password) {
        setJoinPasswordError('Incorrect password');
        setIsJoining(false);
        passwordIncorrect = true;
        return;
      }
      const realCount = participantCounts[joiningRoom.id] ?? joiningRoom.participants;
      if (realCount >= joiningRoom.maxParticipants) {
        alert('Room is full!');
      } else {
        router.push(`/rooms/${joiningRoom.id}`);
      }
    } catch (err) {
      alert('An error occurred while joining the room.');
      console.error(err);
    } finally {
      if (!passwordIncorrect) {
        setIsJoining(false);
        setShowJoinModal(false);
        setJoiningRoom(null);
        setJoinPasswordError(null);
      }
    }
  };

  const handleModalCancel = () => {
    setShowJoinModal(false);
    setJoiningRoom(null);
    setJoinPasswordError(null);
    setIsJoining(false);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('vocablyRooms');
      if (saved) {
        setRooms(JSON.parse(saved));
      }
      // Real-time update: listen for localStorage changes
      const handleStorage = (event: StorageEvent) => {
        if (event.key === 'vocablyRooms' && event.newValue) {
          setRooms(JSON.parse(event.newValue));
        }
      };
      window.addEventListener('storage', handleStorage);
      // Poll as fallback for same-tab updates
      const interval = setInterval(() => {
        const saved = localStorage.getItem('vocablyRooms');
        if (saved) {
          let rooms = JSON.parse(saved);
          const now = Date.now();
          // Remove rooms with 0 participants for over 5 minutes
          rooms = rooms.filter((room: any) => {
            if (room.participants > 0) {
              room.emptySince = undefined;
              return true;
            }
            // If no participants, start or check emptySince
            if (!room.emptySince) {
              room.emptySince = now;
              return true;
            }
            // If empty for more than 5 minutes (300000 ms), delete
            return now - room.emptySince < 300000;
          });
          localStorage.setItem('vocablyRooms', JSON.stringify(rooms));
          setRooms(rooms);
        }
      }, 60000); // every 1 minute
      return () => {
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
      };
    }
  }, []);

  const handleCreateRoom = (roomData: {
    name: string;
    language: string;
    languageLevel: 'beginner' | 'intermediate' | 'advanced';
    isPublic: boolean;
    password?: string;
    maxParticipants: number;
    topic?: string;
    tags: string[];
  }) => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('vocablyRooms') : null;
    const prevRooms: Room[] = saved ? JSON.parse(saved) : [];
    const newRoom: Room = {
      id: generateRoomId(),
      name: roomData.name,
      createdAt: Date.now(),
      participants: 0,
      maxParticipants: roomData.maxParticipants,
      language: roomData.language,
      languageLevel: roomData.languageLevel,
      isPublic: roomData.isPublic,
      password: roomData.password,
      createdBy: (typeof window !== 'undefined' && localStorage.getItem('userName')) || 'Anonymous',
      topic: roomData.topic,
      tags: roomData.tags,
    };
    const updatedRooms = [newRoom, ...prevRooms];
    if (typeof window !== 'undefined') {
      localStorage.setItem('vocablyRooms', JSON.stringify(updatedRooms));
    }
    setRooms(updatedRooms);
    setShowCreateModal(false);
  };

  // Merge real participant counts into rooms for display
  const roomsWithRealCounts = rooms.map(room => ({
    ...room,
    participants: typeof participantCounts[room.id] === 'number'
      ? participantCounts[room.id]
      : 0,
  }));

  // Debug: log participantCounts and roomsWithRealCounts
  React.useEffect(() => {
    console.log('participantCounts:', participantCounts);
    console.log('roomsWithRealCounts:', roomsWithRealCounts);
  }, [participantCounts, roomsWithRealCounts]);

  return (
    <>
      <Header
        onCreateRoomClick={() => setShowCreateModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="vocably-landing-main">
        {/* Search bar at top of body for mobile only */}
        {isMobile && (
          <div style={{ margin: '1.5rem 0 0rem 0', width: '100%' }}>
            <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
        )}
        {rooms.length === 0 && (
          <>
            <section className="vocably-hero">
              <h1 className="vocably-hero-title">Talk Freely, Connect Instantly</h1>
              <p className="vocably-hero-desc">
                Real-time voice chat rooms for practicing English, meeting new people, and growing your confidence—all for free.
              </p>
              <a href="/explore" className="vocably-cta-btn">Start Chatting</a>
            </section>
            <section className="vocably-features">
              <div className="vocably-feature">
                <span className="vocably-feature-icon premium-icon"><FaComments size={32} /></span>
                <h3>Instant Rooms</h3>
                <p>Join or create a room in seconds—no sign-up required.</p>
              </div>
              <div className="vocably-feature">
                <span className="vocably-feature-icon premium-icon"><FaUser size={32} /></span>
                <h3>Global Community</h3>
                <p>Connect with people from around the world and make friends.</p>
              </div>
              <div className="vocably-feature">
                <span className="vocably-feature-icon premium-icon"><FaLock size={32} /></span>
                <h3>Safe & Private</h3>
                <p>Public and private rooms, with moderation tools for safety.</p>
              </div>
            </section>
          </>
        )}
        {rooms.length > 0 && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                marginTop: isMobile ? '0.7rem' : '4rem',
                marginBottom: '0.7rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <h2 className="vocably-section-title" style={{ margin: 0, marginRight: '14rem' }}>
                Active Rooms
              </h2>
              <button
                className="btn btn--sm btn--secondary"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(120deg, rgba(16,185,129,0.18) 60%, rgba(17,18,22,0.89) 100%)',
                  color: '#10b981',
                  border: '1.5px solid #10b981',
                  borderRadius: 12,
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: '0 2px 12px 0 rgba(16,185,129,0.13)',
                  padding: '0.7rem 1.7rem',
                  cursor: 'pointer',
                  transition: 'background 0.18s, color 0.18s',
                  outline: 'none',
                  minWidth: 120,
                }}
              >
                <FaFilter style={{ marginRight: 8 }} /> FILTERS
              </button>
              <div style={{ minWidth: 180, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                <select
                  className="input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{
                    background: 'linear-gradient(120deg, rgba(24,26,27,0.92) 70%, rgba(17,18,22,0.89) 100%)',
                    color: '#ffd700',
                    border: '1.5px solid #ffd700',
                    borderRadius: 12,
                    fontWeight: 600,
                    fontSize: 16,
                    boxShadow: '0 2px 12px 0 rgba(255,215,0,0.10)',
                    padding: '0.7rem 1.7rem',
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: 180,
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    MozAppearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1.2rem center',
                    backgroundSize: 18,
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
              </div>
              <BuyMeCoffee />
            </div>
            <RoomList
              rooms={roomsWithRealCounts}
              selectedLanguage={''}
              selectedLevel={''}
              onJoinRoom={handleJoinRoom}
              onParticipantUpdate={() => {}}
              searchTerm={searchTerm}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              roomType={roomType}
              setRoomType={setRoomType}
              availability={availability}
              setAvailability={setAvailability}
            />
          </>
        )}
      </main>
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateRoom={handleCreateRoom}
      />
      <JoinRoomModal
        isOpen={showJoinModal}
        onCancel={handleModalCancel}
        onJoin={handleModalJoin}
        roomName={joiningRoom?.name || ''}
        isJoining={isJoining}
        requirePassword={!!joiningRoom && !joiningRoom.isPublic && !!joiningRoom.password}
        passwordError={joinPasswordError || undefined}
      />
      {showProfileModal && (
        <div className="modal-backdrop flex items-center justify-center z-50 bg-black bg-opacity-40 fixed inset-0">
          <div className="modal-content max-w-lg w-full bg-[#16181c] rounded-2xl shadow-2xl border border-gray-800 p-8 relative animate-fade-in mx-4 my-8">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-primary text-2xl focus:outline-none"
              onClick={() => setShowProfileModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <UserProfile onLanguagePreferenceChange={() => {}} onClose={() => {}} />
          </div>
        </div>
      )}
    </>
  );
}
