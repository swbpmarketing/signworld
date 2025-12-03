import { io, Socket } from 'socket.io-client';

// Get the socket URL based on environment
const getSocketUrl = () => {
  // Check if we're on localhost (development)
  const isLocalhost = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1';

  if (isLocalhost) {
    // In development, connect through the vite proxy (same origin)
    return window.location.origin;
  }
  // In production, connect directly to the backend
  return import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://sign-company.onrender.com';
};

class SocketService {
  private socket: Socket | null = null;
  private connected = false;
  private pendingRooms: string[] = [];

  connect(): Socket {
    if (this.socket) {
      // If already have a socket, just return it
      return this.socket;
    }

    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.connected = true;

      // Join any pending rooms
      this.pendingRooms.forEach(room => {
        console.log(`Joining pending room: ${room}`);
        this.socket?.emit(`join:${room}`);
      });
      this.pendingRooms = [];
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.pendingRooms = [];
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  // Join a room
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit(`join:${room}`);
      console.log(`Joined room: ${room}`);
    } else {
      // Queue the room join for when connection is established
      console.log(`Queueing room join: ${room}`);
      if (!this.pendingRooms.includes(room)) {
        this.pendingRooms.push(room);
      }
    }
  }

  // Leave a room
  leaveRoom(room: string): void {
    if (this.socket) {
      this.socket.emit(`leave:${room}`);
      console.log(`Left room: ${room}`);
    }
    // Remove from pending if it was there
    this.pendingRooms = this.pendingRooms.filter(r => r !== room);
  }

  // Subscribe to an event
  on<T>(event: string, callback: (data: T) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Unsubscribe from an event
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  // Emit an event
  emit(event: string, data?: unknown): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;
