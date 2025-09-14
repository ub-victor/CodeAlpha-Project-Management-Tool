const express = require('express');
const { protect } = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

const router = express.Router();

// Get all projects for user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user._id },
        { members: req.user._id }
      ]
    }).populate('createdBy', 'username').populate('members', 'username');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new project
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, members } = req.body;
    
    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: members || [],
      columns: [
        { name: 'To Do', tasks: [] },
        { name: 'In Progress', tasks: [] },
        { name: 'Done', tasks: [] }
      ]
    });
    
    const populatedProject = await Project.findById(project._id)
      .populate('createdBy', 'username')
      .populate('members', 'username');
    
    res.status(201).json(populatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('members', 'username')
      .populate({
        path: 'columns.tasks',
        populate: [
          { path: 'assignedTo', select: 'username' },
          { path: 'comments', populate: { path: 'author', select: 'username' } }
        ]
      });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (!project.members.some(member => member._id.equals(req.user._id)) && 
        !project.createdBy._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a project
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the creator
    if (!project.createdBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Only the creator can update the project' });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'username').populate('members', 'username');
    
    // Emit real-time update
    const io = req.app.get('io');
    io.to(req.params.id).emit('project-updated', updatedProject);
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;