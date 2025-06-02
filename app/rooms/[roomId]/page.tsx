import * as React from 'react';
import PageClientImpl from './PageClientImpl';

export default function Page({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: {
    region?: string;
    hq?: string;
    codec?: string;
  };
}) {
  const allowedCodecs = ['vp8', 'h264', 'vp9', 'av1'] as const;
  type AllowedCodec = typeof allowedCodecs[number];
  const codec =
    typeof searchParams.codec === 'string' && allowedCodecs.includes(searchParams.codec as AllowedCodec)
      ? (searchParams.codec as AllowedCodec)
      : 'vp9';
  const hq = searchParams.hq === 'true';

  return (
    <PageClientImpl
      roomId={params.roomId}
      region={searchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
