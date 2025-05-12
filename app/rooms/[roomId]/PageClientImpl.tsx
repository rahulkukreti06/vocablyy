export default function PageClientImpl(props: {
  roomId: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setIsJoining(true);
    // Check room capacity before joining
    const savedRooms = localStorage.getItem('vocablyRooms');
    if (savedRooms) {
      const rooms = JSON.parse(savedRooms);
      // Lookup by id
      const room = rooms.find((r: any) => r.id === props.roomId);
      if (room && room.participants >= room.maxParticipants) {
        alert('This room is full. Please try another room or create a new one.');
        window.location.href = '/';
        return;
      }
    }
    // ... existing code ...
  }, [props.roomId, props.region]);
} 