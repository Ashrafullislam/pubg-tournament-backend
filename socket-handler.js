const WEB_SOCKET_EVENT_NAME = "$$_WEBSOCKET_EVENT_7263_$$";

/**
 * 
 * @param {import('socket.io').Server} socketConnection 
 */
export const handleSocketConnection = socketConnection => {
  socketConnection.on(WEB_SOCKET_EVENT_NAME, payload => {
    socketConnection.emit(WEB_SOCKET_EVENT_NAME, payload);
  });
};
