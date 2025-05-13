import * as React from 'react';
import PageClientImpl from './PageClientImpl';

const allowedCodecs = ['vp8', 'h264', 'vp9', 'av1'] as const;
type AllowedCodec = typeof allowedCodecs[number];

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{
    region?: string;
    hq?: string;
    codec?: string;
  }>;
}) {
  const _params = await params;
  const _searchParams = await searchParams;
  const codec =
    typeof _searchParams.codec === 'string' && allowedCodecs.includes(_searchParams.codec as AllowedCodec)
      ? _searchParams.codec as AllowedCodec
      : 'vp9';
  const hq = _searchParams.hq === 'true' ? true : false;

  return (
    <PageClientImpl
      roomId={_params.roomId}
      region={_searchParams.region}
      hq={hq}
      codec={codec}
    />
  );
}
