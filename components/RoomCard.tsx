import React, { useState } from 'react';
import { FaUser, FaLock, FaGlobe, FaEllipsisV, FaFlag } from 'react-icons/fa';
import styles from '../styles/RoomCard.module.css';
import { ViewUserProfileModal } from './ViewUserProfileModal';

interface RoomCardProps {
  room: {
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
  };
  onJoin: (room: any) => void;
  onRemoveRoom?: (roomId: string) => void;
  onParticipantUpdate?: (roomId: string, participantCount: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin, onRemoveRoom, onParticipantUpdate }) => {
  const isFull = room.participants >= room.maxParticipants;

  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Debug: log the room prop to check participant count
  React.useEffect(() => {
    console.log('RoomCard room prop:', room);
  }, [room]);

  // Helper to get reporterId
  const getReporterId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userName') || 'Anonymous';
    }
    return 'Anonymous';
  };

  const handleReport = async () => {
    setReporting(true);
    setMenuOpen(false);
    try {
      const res = await fetch('/api/report-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room.id,
          reporterId: getReporterId(),
          ownerId: room.createdBy,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.shouldDelete) {
          // Remove from localStorage
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('vocablyRooms');
            if (saved) {
              const rooms = JSON.parse(saved);
              const updated = rooms.filter((r: any) => r.id !== room.id);
              localStorage.setItem('vocablyRooms', JSON.stringify(updated));
            }
            // Notify owner if current user is the owner
            const userName = localStorage.getItem('userName') || 'Anonymous';
            if (userName === room.createdBy) {
              alert('Your room was removed because it was reported by multiple users.');
            } else {
              alert('Room has been removed due to multiple reports. The owner will be notified.');
            }
          }
          if (onRemoveRoom) onRemoveRoom(room.id);
        } else {
          alert(`Room reported. Current report count: ${data.count}/5`);
        }
      } else {
        alert(data.error || 'Failed to report room.');
      }
    } catch (err) {
      alert('Failed to report room.');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className={styles['room-card'] + ' room-card'} tabIndex={0} aria-label={`Room card for ${room.name}`} role="region" style={{ position: 'relative' }}>
      {/* View Profile Modal */}
      {showProfile && (
        <ViewUserProfileModal username={room.createdBy} onClose={() => setShowProfile(false)} />
      )}
      {/* Three-dot menu in top right */}
      <div style={{ position: 'absolute', top: 12, right: 16, zIndex: 2 }}>
        <button
          aria-label="Room settings"
          style={{ background: 'none', border: 'none', color: '#bdbdbd', fontSize: 20, cursor: 'pointer', padding: 4 }}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <FaEllipsisV />
        </button>
        {menuOpen && (
          <div style={{ position: 'absolute', top: 28, right: 0, background: '#23272f', border: '1px solid #22242a', borderRadius: 8, boxShadow: '0 4px 16px #0008', minWidth: 140, zIndex: 10 }}>
            <button
              onClick={handleReport}
              disabled={reporting}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', color: '#ff4d4f', fontWeight: 600, fontSize: 15, padding: '10px 16px', cursor: 'pointer', borderRadius: 8 }}
            >
              <FaFlag style={{ marginRight: 6 }} /> Report Room
            </button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <div
          className={styles['room-card__host-avatar']}
          style={{ minWidth: 44, minHeight: 44, borderRadius: '50%', background: '#23272f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, color: '#fff', cursor: 'pointer' }}
          onClick={() => setShowProfile(true)}
          title={`View ${room.createdBy}'s profile`}
        >
          {room.createdBy?.[0]?.toUpperCase() || <FaUser />}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 2, cursor: 'pointer', textDecoration: 'underline dotted' }}
            onClick={() => setShowProfile(true)}
            title={`View ${room.createdBy}'s profile`}
          >
            {room.name}
          </div>
          <div style={{ color: '#bdbdbd', fontSize: 14, marginBottom: 8 }}>
            <span
              style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
              onClick={() => setShowProfile(true)}
              title={`View ${room.createdBy}'s profile`}
            >
              {room.createdBy}
            </span> &bull; {room.topic || 'General Discussion'}
          </div>
          <div style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
            <span className={styles['room-card__badge']} style={{ background: '#ffd70022', color: '#ffd700', borderRadius: 7, padding: '2.5px 10px', fontSize: 13, fontWeight: 600 }}>
              {room.languageLevel.charAt(0).toUpperCase() + room.languageLevel.slice(1)}
            </span>
            <span className={styles['room-card__badge']} style={{ background: '#23272f', color: '#ffd700', borderRadius: 7, padding: '2.5px 10px', fontSize: 13, fontWeight: 600, border: '1.5px solid #ffd70044' }}>
              {room.language.toUpperCase()}
            </span>
            <span className={styles['room-card__badge']} style={{ background: room.isPublic ? '#10b98122' : '#ff4d4f22', color: room.isPublic ? '#10b981' : '#ff4d4f', borderRadius: 7, padding: '2.5px 10px', fontSize: 13, fontWeight: 600, border: room.isPublic ? '1.5px solid #10b98144' : '1.5px solid #ff4d4f44', display: 'flex', alignItems: 'center', gap: 5 }}>
              {room.isPublic ? <FaGlobe style={{ marginRight: 4 }} /> : <FaLock style={{ marginRight: 4 }} />} {room.isPublic ? 'Public' : 'Private'}
            </span>
          </div>
          <div style={{ color: '#bdbdbd', fontSize: 13, marginBottom: 8 }}>Created {new Date(room.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 70 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ background: '#191b20', borderRadius: 8, padding: '4px 10px', color: '#10b981', fontWeight: 700, fontSize: 14, minWidth: 44, textAlign: 'center' }}>{Math.min(room.participants, room.maxParticipants)}/{room.maxParticipants}</div>
          </div>
          <div style={{ width: 54, height: 6, background: '#23272f', borderRadius: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${Math.min(100, Math.round((room.participants / room.maxParticipants) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #ffd700 100%)', borderRadius: 6 }}></div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
        {isFull ? (
          <span style={{ fontSize: 15, padding: '0.5rem 1.6rem', borderRadius: 8, background: '#23272f', color: '#ff4d4f', fontWeight: 700, minWidth: 100, textAlign: 'center' }}>Room Full</span>
        ) : (
          <button className={styles['room-card__join-btn']} onClick={() => onJoin(room)} aria-label="Join Room" style={{ fontSize: 15, padding: '0.5rem 1.6rem', borderRadius: 8, background: '#191b20', color: '#ffd700', border: 'none', fontWeight: 700, boxShadow: 'none', transition: 'background 0.18s, color 0.18s', outline: 'none', minWidth: 100 }} disabled={isFull}>Join</button>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 }}></span>
          <span style={{ color: '#bdbdbd', fontSize: 14 }}>Active</span>
        </div>
      </div>
    </div>
  );
};

export default RoomCard;
