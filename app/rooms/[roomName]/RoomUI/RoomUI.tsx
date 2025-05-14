import React, { useState } from 'react';
import {
  TrackLoop,
  ParticipantTile,
  useRoomContext,
  useTracks,
  TrackToggle,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { FaSignOutAlt, FaComments, FaUsers } from 'react-icons/fa';

export default function RoomUI({ roomName, onLeave }: { roomName: string; onLeave: () => void }) {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  // Room context is provided by RoomContext.Provider in the parent
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(120deg, #181a1b 70%, #23272f 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        width: '100%',
        padding: '1.2rem 2rem 1rem 2rem',
        borderBottom: '1.5px solid #23272f',
        background: 'rgba(24, 26, 32, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '1.1rem',
      }}>
        <span style={{ fontWeight: 800, fontSize: '1.35rem', letterSpacing: '0.01em' }}>{roomName}</span>
        <div style={{ display: 'flex', gap: 18 }}>
          <button title="Participants" onClick={() => setShowParticipants((v) => !v)} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: 22, cursor: 'pointer' }}><FaUsers /></button>
          <button title="Chat" onClick={() => setShowChat((v) => !v)} style={{ background: 'none', border: 'none', color: '#ffd700', fontSize: 22, cursor: 'pointer' }}><FaComments /></button>
        </div>
      </div>

      {/* Main content */}
      <LiveKitRoomContent showChat={showChat} showParticipants={showParticipants} onLeave={onLeave} />
    </div>
  );
}

function LiveKitRoomContent({ showChat, showParticipants, onLeave }: { showChat: boolean; showParticipants: boolean; onLeave: () => void }) {
  // Get all camera, microphone, and screen share tracks
  const trackRefs = useTracks([Track.Source.Camera, Track.Source.Microphone, Track.Source.ScreenShare]);
  return (
    <>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Video grid */}
        <div style={{ flex: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', minHeight: 320, borderRight: '1.5px solid #23272f', gap: 16 }}>
          <TrackLoop tracks={trackRefs}>
            <ParticipantTile />
          </TrackLoop>
        </div>
        {/* Chat or Participants */}
        {showChat && (
          <div style={{ flex: 1, minWidth: 320, maxWidth: 400, background: 'rgba(24,26,32,0.92)', borderLeft: '1.5px solid #23272f', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              <div style={{ color: '#bdbdbd', fontSize: 18, textAlign: 'center', marginTop: 40 }}>Chat (coming soon)</div>
            </div>
            <div style={{ padding: 12, borderTop: '1.5px solid #23272f' }}>
              <input type="text" placeholder="Type a message..." style={{ width: '100%', background: '#181a1b', color: '#fff', border: '1.5px solid #22242a', borderRadius: 8, padding: '0.7rem 1.1rem', fontSize: 16 }} disabled />
            </div>
          </div>
        )}
        {showParticipants && (
          <div style={{ flex: 1, minWidth: 260, maxWidth: 320, background: 'rgba(24,26,32,0.92)', borderLeft: '1.5px solid #23272f', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              <div style={{ color: '#bdbdbd', fontSize: 18, textAlign: 'center', marginTop: 40 }}>
                <b>Participants</b>
                {/* You can use useParticipants here for a list */}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Floating controls */}
      <div style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 24,
        background: 'rgba(24,26,32,0.92)',
        borderRadius: 32,
        boxShadow: '0 4px 24px #0008',
        padding: '18px 36px',
        zIndex: 50,
        alignItems: 'center',
      }}>
        <TrackToggle source={Track.Source.Microphone}>
          <button className="lk-button" title="Toggle Microphone" style={{ background: '#23272f', color: '#10b981', border: 'none', borderRadius: '50%', width: 54, height: 54, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #10b98133', transition: 'background 0.18s, color 0.18s' }}>🎤</button>
        </TrackToggle>
        <TrackToggle source={Track.Source.Camera}>
          <button className="lk-button" title="Toggle Camera" style={{ background: '#23272f', color: '#ffd700', border: 'none', borderRadius: '50%', width: 54, height: 54, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #ffd70033', transition: 'background 0.18s, color 0.18s' }}>📷</button>
        </TrackToggle>
        <TrackToggle source={Track.Source.ScreenShare}>
          <button className="lk-button" title="Toggle Screen Share" style={{ background: '#23272f', color: '#6366f1', border: 'none', borderRadius: '50%', width: 54, height: 54, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #6366f133', transition: 'background 0.18s, color 0.18s' }}>🖥️</button>
        </TrackToggle>
        <button onClick={onLeave} title="Leave Room" style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 54, height: 54, fontSize: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 12px #ef444433', transition: 'background 0.18s, color 0.18s' }}><FaSignOutAlt /></button>
      </div>
    </>
  );
}