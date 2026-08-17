import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import http from "http";

let io;

export const initSocket = (server) => {
  const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub; // The JWT payload uses 'sub'
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    if (userId) {
      socket.join(userId);
      console.log(`[socket] User connected: ${userId} (socket: ${socket.id})`);
    }

    socket.on("typing", ({ recipientId }) => {
      if (recipientId) {
        io.to(recipientId).emit("typing", { senderId: userId });
      }
    });

    socket.on("stopTyping", ({ recipientId }) => {
      if (recipientId) {
        io.to(recipientId).emit("stopTyping", { senderId: userId });
      }
    });

    socket.on("disconnect", () => {
      console.log(`[socket] User disconnected: ${userId}`);
      // No need to manually leave rooms or clean up map; socket.io handles room leave on disconnect.
    });
  });

  return io;
};

export const getReceiverSocketId = (userId) => {
  return userId?.toString();
};

export const getIo = () => {
  if (!io) {
    throw new Error("Socket.io is not initialized!");
  }
  return io;
};
