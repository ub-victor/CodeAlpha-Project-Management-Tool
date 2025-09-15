const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const commentRoutes = require('./routes/comments');

const app = express();
const server = http.createServer(app);

app.use(cors(
  {
    origin: ["https://project-managemet-tool-f.vercel.app", "http://localhost:5173", "http://localhost:5000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
));

// Updated CORS configuration
const io = socketIo(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all localhost ports and common development origins
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      
      // For production, you would check against a whitelist
      callback(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Updated CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports and common development origins
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // For production, you would check against a whitelist
    callback(null, true);
  },
  credentials: true
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/projectmanagement')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });
  
  socket.on('task-updated', (data) => {
    socket.to(data.projectId).emit('task-updated', data);
  });
  
  socket.on('comment-added', (data) => {
    socket.to(data.projectId).emit('comment-added', data);
  });
  
  // NEW EVENT HANDLERS ADDED HERE
  socket.on('task-created', (data) => {
    socket.to(data.projectId).emit('task-created', data);
  });

  socket.on('task-deleted', (data) => {
    socket.to(data.projectId).emit('task-deleted', data);
  });

  socket.on('comment-updated', (data) => {
    socket.to(data.projectId).emit('comment-updated', data);
  });

  socket.on('comment-deleted', (data) => {
    socket.to(data.projectId).emit('comment-deleted', data);
  });
  // END OF NEW EVENT HANDLERS
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our router
app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});