'use client';

import React, { useEffect, useState } from 'react';
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
import { supabase } from '@/lib/supabaseClient';
import { useSession } from 'next-auth/react';

interface Room {
  id: string;
  name: string;
  created_at: number;
  participants: number;
  max_participants: number;
  language: string;
  language_level: 'beginner' | 'intermediate' | 'advanced';
  is_public: boolean;
  password?: string;
  created_by: string;
  created_by_name: string; // <-- added field
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
  const [roomsLoading, setRoomsLoading] = useState(true);
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
  const { data: session } = useSession();

  // Custom error modal for sign-in required
  const [showSignInError, setShowSignInError] = useState(false);
  const [signInErrorMessage, setSignInErrorMessage] = useState('');

  const showSignInModal = (message: string) => {
    setSignInErrorMessage(message);
    setShowSignInError(true);
  };

  // Fetch rooms from Supabase and subscribe to real-time changes
  useEffect(() => {
    let subscription: any;
    async function fetchRooms() {
      setRoomsLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      console.log('Supabase fetchRooms result:', { data, error }); // <-- log result
      if (!error && data) {
        setRooms(data);
      }
      setRoomsLoading(false);
    }
    fetchRooms();
    // Subscribe to real-time changes
    subscription = supabase
      .channel('public:rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, (payload) => {
        fetchRooms();
      })
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  const handleJoinRoom = async (room: Room) => {
    if (!session || !session.user) {
      showSignInModal('You must be signed in to join or create a room. Please sign in with your Google account to continue.');
      return;
    }
    // Use real participant count
    const realCount = participantCounts[room.id] ?? room.participants;
    if (!room.is_public) {
      // Only show join modal if password is set (not empty)
      if (room.password && room.password.length > 0) {
        setJoiningRoom(room);
        setShowJoinModal(true);
        setJoinPasswordError(null);
        return;
      } else {
        // If private but no password, allow join directly
        if (realCount >= room.max_participants) {
          alert('Room is full!');
          return;
        }
        try {
          await fetch('/api/room-participants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: room.id, action: 'join' }),
          });
          router.push(`/rooms/${room.id}`); // Removed setTimeout for instant navigation
        } catch (err) {
          alert('Failed to join the room.');
          console.error(err);
        }
        return;
      }
    }
    // Public room: join instantly
    if (realCount >= room.max_participants) {
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
      router.push(`/rooms/${room.id}`); // Removed setTimeout for instant navigation
    } catch (err) {
      alert('Failed to join the room.');
      console.error(err);
    }
  };

  const handleModalJoin = async (password?: string) => {
    if (!joiningRoom) return;
    setIsJoining(true);
    let passwordIncorrect = false;
    try {
      // Password check for private rooms
      if (!joiningRoom.is_public && joiningRoom.password && joiningRoom.password !== password) {
        setJoinPasswordError('Incorrect password');
        setIsJoining(false);
        passwordIncorrect = true;
        return;
      }
      const realCount = participantCounts[joiningRoom.id] ?? joiningRoom.participants;
      if (realCount >= joiningRoom.max_participants) {
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

  const handleCreateRoom = async (roomData: {
    name: string;
    language: string;
    language_level: 'beginner' | 'intermediate' | 'advanced';
    isPublic: boolean;
    password?: string;
    maxParticipants: number;
    topic?: string;
    tags: string[];
  }) => {
    if (!session || !session.user) {
      showSignInModal('You must be signed in to create a room. Please sign in with your Google account to continue.');
      return;
    }
    if (!session.user.id) {
      showSignInModal('You must be signed in to create a room. Please sign in with your Google account to continue.');
      return;
    }
    // Use only a real UUID for created_by
    let created_by = String(session.user.id).trim();
    
    const newRoom: Room = {
      id: crypto.randomUUID(),
      name: roomData.name,
      created_at: new Date().toISOString(),
      participants: 0,
      max_participants: roomData.maxParticipants,
      language: roomData.language,
      language_level: roomData.language_level,
      is_public: roomData.isPublic,
      password: roomData.password ?? '', // default to empty string
      created_by: created_by, // always a UUID
      created_by_name: session.user.name || '', // store real name
      topic: roomData.topic ?? '',       // default to empty string
      tags: roomData.tags ?? [],         // default to empty array
    };
    // Debug: log the newRoom object before inserting
    console.log('Creating new room:', newRoom);
    // Log the Supabase key being used
    console.log('Supabase key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    // Final fallback for created_by (should always be a UUID or a valid provider user ID)
    if (!newRoom.created_by || typeof newRoom.created_by !== 'string' || newRoom.created_by.length < 6) {
      showSignInModal('You must be signed in with a valid account to create a room. Please sign in with your Google account to continue.');
      return;
    }
    console.log('Final newRoom object before insert:', newRoom);
    // Debug: log the newRoom object and created_by before inserting
    console.log('DEBUG: About to insert newRoom:', newRoom);
    console.log('DEBUG: newRoom.created_by value:', newRoom.created_by);

    // Minimal insert for debugging
    const minimalRoom = {
      id: newRoom.id,
      name: newRoom.name,
      created_at: newRoom.created_at,
      participants: newRoom.participants,
      max_participants: newRoom.max_participants,
      language: newRoom.language,
      language_level: newRoom.language_level,
      is_public: newRoom.is_public,
      password: newRoom.password, // <-- ensure password is included
      created_by: newRoom.created_by,
      created_by_name: newRoom.created_by_name,
      topic: newRoom.topic, // <-- ensure topic is included
    };
    console.log('DEBUG: Minimal insert payload:', minimalRoom);
    const { data, error } = await supabase.from('rooms').insert([minimalRoom]);
    console.log('Supabase insert result:', { data, error });
    if (error) {
      alert('Failed to create room: ' + error.message + '\n' + JSON.stringify(error, null, 2));
      return;
    }
    setShowCreateModal(false);
    setRooms(prevRooms => [newRoom, ...prevRooms]);
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

  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
      }
      const listener = () => {
        setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      };
      window.addEventListener('storage', listener);
      return () => window.removeEventListener('storage', listener);
    }
  }, []);

  return (
    <>
      <Header
        onCreateRoomClick={() => setShowCreateModal(true)}
        onProfileClick={() => setShowProfileModal(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />
      <main className="vocably-landing-main">
        {/* Remove duplicate 'Active Rooms' and filter row here, keep only the one inside the rooms.length > 0 conditional below */}
        {roomsLoading ? (
          <div className="loading-indicator">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div
            style={{
              minHeight: '60vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: `'Inter', 'Segoe UI', Arial, sans-serif`,
              color: theme === 'dark' ? '#fff' : '#232e4d',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '2.1rem',
              letterSpacing: '0.01em',
              opacity: 0.92,
            }}
          >
            <span style={{ fontSize: '2.7rem', fontWeight: 800, marginBottom: 12, color: theme === 'dark' ? '#ffe066' : '#10b981', fontFamily: 'inherit', display: 'block' }}>
              Welcome to Vocably
            </span>
            <span style={{ fontSize: '1.25rem', fontWeight: 500, color: theme === 'dark' ? '#bdbdbd' : '#444', marginBottom: 18, display: 'block' }}>
              There are no active rooms right now.<br />Be the first to create a new conversation!
            </span>
            <button
              className="btn btn--primary"
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                padding: '0.8rem 2.2rem',
                borderRadius: 16,
                background: theme === 'dark' ? 'linear-gradient(90deg, #ffe066 60%, #bfa500 100%)' : 'linear-gradient(90deg, #10b981 60%, #1de9b6 100%)',
                color: theme === 'dark' ? '#181a1b' : '#fff',
                border: 'none',
                boxShadow: theme === 'dark' ? '0 2px 12px #ffe06644' : '0 2px 12px #10b98144',
                marginTop: 18,
                cursor: 'pointer',
                transition: 'background 0.18s, color 0.18s',
              }}
              onClick={() => setShowCreateModal(true)}
            >
              + Create Room
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                marginTop: isMobile ? '6.5rem' : '8rem', // add a bit more gap for mobile
                marginBottom: '0.7rem',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <h2 className="vocably-section-title" style={{ margin: 0, marginRight: isMobile ? 'auto' : '14rem', alignSelf: 'flex-start' }}>
                Active Rooms
              </h2>
              <button
                className="btn btn--sm btn--secondary"
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(16,185,129,0.18) 60%, rgba(17,18,22,0.89) 100%)',
                  color: theme === 'dark' ? '#10b981' : '#10b981',
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
                    background: theme === 'dark' ? '#000' : 'linear-gradient(120deg, rgba(24,26,27,0.92) 70%, rgba(17,18,22,0.89) 100%)',
                    color: theme === 'dark' ? '#ffd700' : '#ffd700',
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
              participantCounts={participantCounts}
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
        requirePassword={!!joiningRoom && !joiningRoom.is_public && !!joiningRoom.password}
        passwordError={joinPasswordError || undefined}
        defaultUserName={session?.user?.name || ''}
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
      {showSignInError && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.45)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#181a1b',
            color: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px #0008',
            padding: '2.5rem 2.2rem',
            maxWidth: 380,
            width: '90vw',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 500,
            position: 'relative',
          }}>
            <div style={{ fontSize: 38, marginBottom: 16 }}>🚫</div>
            <div style={{ marginBottom: 18 }}>{signInErrorMessage}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={() => {
                  // @ts-ignore
                  if (typeof window !== 'undefined') {
                    import('next-auth/react').then(({ signIn }) => signIn('google'));
                  }
                }}
                style={{
                  background: 'linear-gradient(90deg, #4285F4 0%, #1a73e8 100%)', // solid blue gradient
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px 0 rgba(66,133,244,0.17)'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignInError(false)}
                style={{
                  background: 'linear-gradient(90deg, #10b981 80%, #1de9b6 100%)',
                  color: '#181a1b',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '0.7rem 2.2rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px 0 rgba(16,185,129,0.17)'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
