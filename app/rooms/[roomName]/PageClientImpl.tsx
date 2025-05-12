'use client';

import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import { FaComments, FaGoogle, FaBars } from 'react-icons/fa';
import { useSession, signIn } from 'next-auth/react';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  LogLevel,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import styles from '../../../styles/Room.module.css';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

function UserAvatar({ name }: { name?: string }) {
  const initial = name && name.length > 0 ? name[0].toUpperCase() : '?';
  return (
    <div
      className="user-avatar-responsive"
      style={{
        width: 'clamp(56px, 20vw, 96px)',
        height: 'clamp(56px, 20vw, 96px)',
        borderRadius: '50%',
        background: 'var(--primary-light, #6366f120)',
        color: 'var(--primary-color, #6366f1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'clamp(28px, 8vw, 48px)',
        fontWeight: 700,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '2px solid var(--primary-color, #6366f1)',
      }}
    >
      {initial}
    </div>
  );
}

export default function PageClientImpl(props: {
  roomId: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  // Track if participant count was incremented
  const [participantReserved, setParticipantReserved] = React.useState(false);
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );
  const [isJoining, setIsJoining] = React.useState(false);
  const [roomReady, setRoomReady] = React.useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom LiveKit hooks
  const livekitRoomRef = React.useRef<Room | null>(null);
  const room = livekitRoomRef.current;
  const localParticipant = room?.localParticipant;
  const remoteParticipants = room ? Array.from(room.remoteParticipants.values()) : [];

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setIsJoining(true);
    // Check room capacity before joining
    const savedRooms = localStorage.getItem('vocablyRooms');
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms);
      const room = rooms.find((r: any) => r.id === props.roomId);
      if (room && room.participants >= room.maxParticipants) {
        alert('This room is full. Please try another room or create a new one.');
        window.location.href = '/';
        return;
      }
    }

    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomId);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
    setParticipantReserved(true);
    setIsJoining(false);

    // Call backend to increment participant count
    console.log('Calling /api/room-participants/join', { roomId: props.roomId });
    fetch('/api/room-participants/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: props.roomId }),
    });
  }, [props.roomId, props.region]);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);
  const handleCancelJoin = React.useCallback(() => {
    setPreJoinChoices(undefined);
    setConnectionDetails(undefined);
    setParticipantReserved(false);
    // Call backend to decrement participant count
    console.log('Calling /api/room-participants/leave', { roomId: props.roomId });
    fetch('/api/room-participants/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: props.roomId }),
    });
    router.push('/');
  }, [props.roomId, router]);

  React.useEffect(() => {
    if (connectionDetails && preJoinChoices && !livekitRoomRef.current) {
      const room = new Room();
      room.connect(connectionDetails.serverUrl, connectionDetails.participantToken)
        .then(() => {
          livekitRoomRef.current = room;
          setRoomReady(true);
        })
        .catch((err) => {
          console.error('Failed to connect to room:', err);
          setRoomReady(false);
        });
    }
  }, [connectionDetails, preJoinChoices]);

  React.useEffect(() => {
    if (roomReady && livekitRoomRef.current) {
      const room = livekitRoomRef.current;
      const handleDisconnect = () => {
        router.push('/');
      };
      room.on('disconnected', handleDisconnect);
      return () => {
        room.off('disconnected', handleDisconnect);
      };
    }
  }, [roomReady, router]);

  React.useEffect(() => {
    if (roomReady && livekitRoomRef.current) {
      // Turn on camera for 0.5s, then turn off
      const room = livekitRoomRef.current;
      room.localParticipant.setCameraEnabled(true);
      const timeout = setTimeout(() => {
        room.localParticipant.setCameraEnabled(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [roomReady]);

  // Decrement participant count on tab close
  React.useEffect(() => {
    const handleTabClose = (e: BeforeUnloadEvent) => {
      navigator.sendBeacon && navigator.sendBeacon('/api/room-participants/leave', JSON.stringify({ roomId: props.roomId }));
    };
    window.addEventListener('beforeunload', handleTabClose);
    return () => {
      window.removeEventListener('beforeunload', handleTabClose);
    };
  }, [props.roomId]);

  const handleLeave = async () => {
    if (livekitRoomRef.current) {
      livekitRoomRef.current.disconnect();
    }
    // Call backend to decrement participant count
    await fetch('/api/room-participants/leave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: props.roomId }),
    });
    // Fetch latest counts to update UI
    await fetch('/api/room-participants');
    router.push('/');
  };

  return (
    <main data-lk-theme="default" className="room-page">
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div className="prejoin-container glass">
          <div className="prejoin-content">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FaComments className="text-primary-color text-3xl" /> Join Room
            </h1>
            {/* Removed search bar */}
            <PreJoin
              defaults={preJoinDefaults}
              onSubmit={handlePreJoinSubmit}
              onError={handlePreJoinError}
            />
            <div className="prejoin-actions mt-6 flex gap-4 justify-center">
              <button
                className="btn btn--secondary min-w-[120px]"
                onClick={handleCancelJoin}
                disabled={isJoining}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        roomReady && livekitRoomRef.current ? (
          <RoomContext.Provider value={livekitRoomRef.current}>
            <VideoConference
              chatMessageFormatter={formatChatMessageLinks}
              SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
            />
            <DebugMode logLevel={LogLevel.debug} />
          </RoomContext.Provider>
        ) : (
          <div style={{ color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 20 }}>Connecting to room...</div>
        )
      )}
    </main>
  );
}
