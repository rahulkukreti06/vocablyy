const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 3001 });

// In-memory participant counts (shared with API via global)
const participantCounts = global.participantCounts = global.participantCounts || {};

function broadcastCounts() {
  const message = JSON.stringify({ type: 'counts', rooms: participantCounts });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', ws => {
  // Send current counts on connect
  ws.send(JSON.stringify({ type: 'counts', rooms: participantCounts }));
});

// Expose a function for the API to call when counts change
if (!global.broadcastParticipantCounts) {
  global.broadcastParticipantCounts = broadcastCounts;
}

console.log('WebSocket server running on ws://localhost:3001'); 