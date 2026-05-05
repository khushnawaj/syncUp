import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(process.env.NEXT_PUBLIC_WS_URL, {
      auth: { token },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (s.connected) return;

  // Crucial: Update the token from localStorage before connecting
  // This handles the case where the socket was initialized before the user logged in.
  const token = localStorage.getItem('token');
  if (token) {
    s.auth.token = token;
    s.connect();
  }
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};
