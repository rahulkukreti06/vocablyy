import { NextResponse } from 'next/server';

// In-memory report tracking (global for dev/demo)
const roomReports = global.roomReports = global.roomReports || {};

export async function POST(req) {
  try {
    const { roomId, reporterId, ownerId } = await req.json();
    if (!roomId || !reporterId || !ownerId) {
      return NextResponse.json({ error: 'Missing roomId, reporterId, or ownerId' }, { status: 400 });
    }
    if (!roomReports[roomId]) {
      roomReports[roomId] = { count: 0, reporters: new Set() };
    }
    // Prevent duplicate reports from the same user
    if (roomReports[roomId].reporters.has(reporterId)) {
      return NextResponse.json({ error: 'Already reported by this user', count: roomReports[roomId].count }, { status: 400 });
    }
    roomReports[roomId].count += 1;
    roomReports[roomId].reporters.add(reporterId);
    const shouldDelete = roomReports[roomId].count >= 5;
    return NextResponse.json({ count: roomReports[roomId].count, shouldDelete });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : error }, { status: 500 });
  }
} 