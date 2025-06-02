'use client';

import React from 'react';
import { VideoConference, LiveKitRoom } from '@livekit/components-react';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { useRouter } from 'next/navigation';

// Fallback formatter in case formatChatMessageLinks is not available
const formatChatMessageLinks = (msg: string) => msg;

export function VideoConferenceClientImpl(props: {
  token: string;
  serverUrl: string;
}) {
  const router = useRouter();
  const showSettings = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true';

  // Call leave API on LiveKit disconnect
  const handleDisconnected = React.useCallback(async () => {
    // Try to extract roomId from the token (if possible) or pass via props if needed
    // For now, try to get from URL
    const match = window.location.pathname.match(/rooms\/(.+)/);
    const roomId = match ? match[1] : null;
    if (roomId) {
      await fetch('/api/room-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, action: 'leave' }),
        keepalive: true,
      });
    }
    router.push('/');
  }, [router]);

  return (
    <div className="lk-room-container">
      <LiveKitRoom serverUrl={props.serverUrl} token={props.token} onDisconnected={handleDisconnected}>
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          {...(showSettings ? { SettingsComponent: SettingsMenu } : {})}
        />
      </LiveKitRoom>
    </div>
  );
}
