const express = require('express');
const { protect } = require('../middleware/auth');
const Task = require('../models/Task');
const Project = require('../models/Project');
const Comment = require('../models/Comment');

const router = express.Router();

// Get all tasks for a project
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, dueDate, priority, status } = req.body;
    
    // Check if user has access to this project
    const project = await Project.findById(projectId);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || [],
      dueDate,
      priority,
      status
    });
    
    // Add task to the appropriate column in the project
    const columnIndex = project.columns.findIndex(col => col.name === status);
    if (columnIndex !== -1) {
      project.columns[columnIndex].tasks.push(task._id);
      await project.save();
    }
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(projectId).emit('task-created', populatedTask);
    
    res.status(201).json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // If status changed, update project columns
    if (req.body.status && req.body.status !== task.status) {
      // Remove from old column
      const oldColumnIndex = project.columns.findIndex(col => col.name === task.status);
      if (oldColumnIndex !== -1) {
        project.columns[oldColumnIndex].tasks = project.columns[oldColumnIndex].tasks.filter(
          taskId => taskId.toString() !== task._id.toString()
        );
      }
      
      // Add to new column
      const newColumnIndex = project.columns.findIndex(col => col.name === req.body.status);
      if (newColumnIndex !== -1) {
        project.columns[newColumnIndex].tasks.push(task._id);
      }
      
      await project.save();
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    .populate('assignedTo', 'username')
    .populate({
      path: 'comments',
      populate: { path: 'author', select: 'username' }
    });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-updated', {
      taskId: updatedTask._id,
      task: updatedTask,
      projectId: task.project
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign a user to a task
router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { userId } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Check if user is already assigned
    if (task.assignedTo.includes(userId)) {
      return res.status(400).json({ message: 'User already assigned to this task' });
    }
    
    task.assignedTo.push(userId);
    const updatedTask = await task.save();
    
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-updated', {
      taskId: populatedTask._id,
      task: populatedTask,
      projectId: task.project
    });
    
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a comment to a task
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const comment = await Comment.create({
      content,
      author: req.user._id,
      task: task._id
    });
    
    task.comments.push(comment._id);
    await task.save();
    
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      });
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('comment-added', {
      taskId: task._id,
      comment: comment,
      projectId: task.project
    });
    
    res.json(populatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Remove task from project column
    const columnIndex = project.columns.findIndex(col => col.tasks.includes(task._id));
    if (columnIndex !== -1) {
      project.columns[columnIndex].tasks = project.columns[columnIndex].tasks.filter(
        taskId => taskId.toString() !== task._id.toString()
      );
      await project.save();
    }
    
    // Delete all comments associated with the task
    await Comment.deleteMany({ task: task._id });
    
    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('task-deleted', {
      taskId: task._id,
      projectId: task.project
    });
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;