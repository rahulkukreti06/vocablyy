'use client';

import { formatChatMessageLinks, RoomContext, VideoConference } from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  LogLevel,
  Room,
  RoomConnectOptions,
  RoomOptions,
  VideoPresets,
  type VideoCodec,
  LocalAudioTrack,
  LocalVideoTrack,
} from 'livekit-client';
import { DebugMode } from '@/lib/Debug';
import { useEffect, useMemo } from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { SettingsMenu } from '@/lib/SettingsMenu';

export function VideoConferenceClientImpl(props: {
  liveKitUrl: string;
  token: string;
  codec: VideoCodec | undefined;
}) {
  const worker =
    typeof window !== 'undefined' &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const keyProvider = new ExternalE2EEKeyProvider();

  const e2eePassphrase =
    typeof window !== 'undefined' ? decodePassphrase(window.location.hash.substring(1)) : undefined;
  const e2eeEnabled = !!(e2eePassphrase && worker);
  const roomOptions = useMemo((): RoomOptions => {
    return {
      publishDefaults: {
        videoSimulcastLayers: [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec: props.codec,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, []);

  const room = useMemo(() => new Room(roomOptions), []);
  if (e2eeEnabled) {
    keyProvider.setKey(e2eePassphrase);
    room.setE2EEEnabled(true);
  }
  const connectOptions = useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  useEffect(() => {
    room.connect(props.liveKitUrl, props.token, connectOptions).then(async () => {
      // Create a silent audio track
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = ctx.createMediaStreamDestination();
      const silentTrack = dest.stream.getAudioTracks()[0];
      if (silentTrack) {
        const localAudioTrack = new LocalAudioTrack(silentTrack);
        await room.localParticipant.publishTrack(localAudioTrack);
        await localAudioTrack.mute();
      }
      // Create a black video track
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.fillStyle = 'black';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      }
      const videoStream = canvas.captureStream(5); // 5 FPS is enough for placeholder
      const blackTrack = videoStream.getVideoTracks()[0];
      if (blackTrack) {
        const localVideoTrack = new LocalVideoTrack(blackTrack);
        await room.localParticipant.publishTrack(localVideoTrack);
        await localVideoTrack.mute();
      }
      // Optionally enable camera/mic as before
      room.localParticipant.enableCameraAndMicrophone().catch((error) => {
        console.error(error);
      });
    }).catch((error) => {
      console.error(error);
    });
  }, [room, props.liveKitUrl, props.token, connectOptions]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <VideoConference
          chatMessageFormatter={formatChatMessageLinks}
          SettingsComponent={
            process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU === 'true' ? SettingsMenu : undefined
          }
        />
        <DebugMode logLevel={LogLevel.debug} />
      </RoomContext.Provider>
    </div>
  );
}
