import { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { decryptAndGetLocal } from "../helper";

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL;

const useSocket = () => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // this ensures that socket always gets the latest token everytime
  const getToken = useCallback(() => {
    const data = decryptAndGetLocal("token");
    return data?.token || null;
  }, []);

  const connectSocket = useCallback(() => {
    const token = getToken();

    if (!token) return;
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
      auth: {
        token: token,
      },
    });

    newSocket.on("connect", () => {
      console.log("🟢 Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  }, [getToken]);

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const reconnect = () => {
    connectSocket();
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return { socket, reconnect, disconnect };
};

export default useSocket;
