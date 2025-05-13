import { NextResponse } from 'next/server';

// Initialize participant counts
let participantCounts = global.participantCounts || {};
if (!global.participantCounts) {
  global.participantCounts = participantCounts;
}

// Function to broadcast counts to WebSocket clients (server-side)
function broadcastParticipantCounts() {
  const message = JSON.stringify({ type: 'counts', rooms: participantCounts });
  if (typeof window === 'undefined') {
    // Server-side: Send to WebSocket server
    const WebSocket = require('ws');
    const client = new WebSocket('ws://localhost:3001');
    
    client.on('open', () => {
      client.send(message);
      client.close();
    });

    client.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });

    client.on('close', () => {
      console.log('WebSocket connection closed');
    });
  }
}

export async function GET() {
  return NextResponse.json({ rooms: participantCounts });
}

export async function POST(request: Request) {
  const { roomId, action } = await request.json();
  
  if (!roomId || !action) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    // Update counts based on action
    if (action === 'join') {
      participantCounts[roomId] = (participantCounts[roomId] || 0) + 1;
    } else if (action === 'leave') {
      participantCounts[roomId] = Math.max(0, (participantCounts[roomId] || 0) - 1);
    }

    // Broadcast the update to all WebSocket clients
    broadcastParticipantCounts();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating participant count:', error);
    return NextResponse.json({ error: 'Failed to update participant count' }, { status: 500 });
  }
}
