import React from 'react';
import RoomCard from './RoomCard';
import styles from '../styles/RoomList.module.css';

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

interface RoomListProps {
  rooms: Room[];
  selectedLanguage: string;
  selectedLevel: string;
  onJoinRoom: (room: Room) => void;
  onParticipantUpdate: (roomId: string, participantCount: number) => void;
  searchTerm?: string;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  sortBy: 'newest' | 'popular' | 'alphabetical';
  setSortBy: (sort: 'newest' | 'popular' | 'alphabetical') => void;
  roomType: 'all' | 'public' | 'private';
  setRoomType: (type: 'all' | 'public' | 'private') => void;
  availability: 'all' | 'available' | 'full';
  setAvailability: (avail: 'all' | 'available' | 'full') => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  rooms,
  selectedLanguage,
  selectedLevel,
  onJoinRoom,
  onParticipantUpdate,
  searchTerm,
  showFilters,
  setShowFilters,
  sortBy,
  setSortBy,
  roomType,
  setRoomType,
  availability,
  setAvailability,
}) => {
  // Filter rooms based on search term and filters
  const filteredRooms = rooms.filter(room => {
    const term = (searchTerm || '').toLowerCase();
    let matches = (
      term === '' ||
      (room.name && room.name.toLowerCase().includes(term)) ||
      (room.topic && room.topic.toLowerCase().includes(term)) ||
      (room.createdBy && room.createdBy.toLowerCase().includes(term)) ||
      (room.language && room.language.toLowerCase().includes(term)) ||
      (room.languageLevel && room.languageLevel.toLowerCase().includes(term))
    );
    if (roomType !== 'all') {
      matches = matches && (roomType === 'public' ? room.isPublic : !room.isPublic);
    }
    if (availability !== 'all') {
      matches = matches && (availability === 'available'
        ? room.participants < room.maxParticipants
        : room.participants >= room.maxParticipants);
    }
    return matches;
  });

  // Sort rooms
  const sortedRooms = [...filteredRooms].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.createdAt - a.createdAt;
    } else if (sortBy === 'popular') {
      return b.participants - a.participants;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

  return (
    <div className="room-list-container" style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: 0, background: 'none', boxShadow: 'none', border: 'none' }}>
      {/* Advanced Filters (shown when showFilters is true) */}
      {showFilters && (
        <div className="advanced-filters slide-up">
          <div className="filter-group">
            <span className="filter-label">Room Type:</span>
            <button className="btn btn--sm btn--secondary" onClick={() => setRoomType('all')} style={{ fontWeight: roomType === 'all' ? 700 : 400 }}>All</button>
            <button className="btn btn--sm btn--secondary" onClick={() => setRoomType('public')} style={{ fontWeight: roomType === 'public' ? 700 : 400 }}>Public</button>
            <button className="btn btn--sm btn--secondary" onClick={() => setRoomType('private')} style={{ fontWeight: roomType === 'private' ? 700 : 400 }}>Private</button>
          </div>
          <div className="filter-group">
            <span className="filter-label">Availability:</span>
            <button className="btn btn--sm btn--secondary" onClick={() => setAvailability('all')} style={{ fontWeight: availability === 'all' ? 700 : 400 }}>All</button>
            <button className="btn btn--sm btn--secondary" onClick={() => setAvailability('available')} style={{ fontWeight: availability === 'available' ? 700 : 400 }}>Available</button>
            <button className="btn btn--sm btn--secondary" onClick={() => setAvailability('full')} style={{ fontWeight: availability === 'full' ? 700 : 400 }}>Full</button>
          </div>
        </div>
      )}
      {sortedRooms.length === 0 ? (
        <div className="no-rooms">No rooms found.</div>
      ) : (
        <div className={styles['room-list-grid']}>
          {sortedRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onJoin={onJoinRoom}
              onRemoveRoom={undefined}
              onParticipantUpdate={onParticipantUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};
