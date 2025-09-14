const express = require('express');
const { auth } = require('./auth');
const Project = require('../models/Project.model');
const User = require('../models/User.model');

const router = express.Router();

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [
        { createdBy: req.user.id },
        { members: req.user.id }
      ]
    }).populate('createdBy', 'username email avatar')
      .populate('members', 'username email avatar');
    
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, members } = req.body;
    
    const project = new Project({
      title,
      description,
      createdBy: req.user.id,
      members: members || [],
      columns: [
        { title: 'To Do', tasks: [] },
        { title: 'In Progress', tasks: [] },
        { title: 'Done', tasks: [] }
      ]
    });
    
    await project.save();
    
    // Populate the created project with user data
    await project.populate('createdBy', 'username email avatar');
    await project.populate('members', 'username email avatar');
    
    // Notify members via WebSocket if implemented
    if (req.io && members.length > 0) {
      members.forEach(memberId => {
        req.io.to(memberId).emit('project-invitation', {
          message: `You've been added to project: ${title}`,
          projectId: project._id
        });
      });
    }
    
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'username email avatar')
      .populate('members', 'username email avatar');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user has access to this project
    if (!project.members.some(member => member._id.toString() === req.user.id) && 
        project.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the creator
    if (project.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can update the project' });
    }
    
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('createdBy', 'username email avatar')
     .populate('members', 'username email avatar');
    
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member to project
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if user is the creator or a member
    if (project.createdBy.toString() !== req.user.id && 
        !project.members.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find user by email
    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    if (project.members.includes(userToAdd._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    project.members.push(userToAdd._id);
    await project.save();
    
    // Populate the updated project
    await project.populate('members', 'username email avatar');
    
    // Notify the added user via WebSocket
    if (req.io) {
      req.io.to(userToAdd._id.toString()).emit('project-invitation', {
        message: `You've been added to project: ${project.title}`,
        projectId: project._id
      });
    }
    
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;