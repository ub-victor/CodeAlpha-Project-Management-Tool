const express = require('express');
const { protect } = require('../middleware/auth');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Project = require('../models/Project');

const router = express.Router();

// Get all comments for a task
router.get('/task/:taskId', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user has access to this task's project
    const project = await Project.findById(task.project);
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const comments = await Comment.find({ task: req.params.taskId })
      .populate('author', 'username')
      .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific comment
router.get('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user has access to this comment's task project
    const task = await Task.findById(comment.task);
    const project = await Project.findById(task.project);
    
    if (!project.members.includes(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a comment
router.put('/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author of the comment
    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }
    
    comment.content = content;
    const updatedComment = await comment.save();
    
    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('author', 'username');
    
    // Get task and project for real-time update
    const task = await Task.findById(comment.task);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('comment-updated', {
      commentId: populatedComment._id,
      comment: populatedComment,
      taskId: task._id,
      projectId: task.project
    });
    
    res.json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a comment
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the author of the comment or project admin
    const task = await Task.findById(comment.task);
    const project = await Project.findById(task.project);
    
    if (!comment.author.equals(req.user._id) && 
        !project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }
    
    // Remove comment from task
    await Task.findByIdAndUpdate(comment.task, {
      $pull: { comments: comment._id }
    });
    
    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.project.toString()).emit('comment-deleted', {
      commentId: comment._id,
      taskId: task._id,
      projectId: task.project
    });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;