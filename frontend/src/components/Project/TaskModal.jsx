import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import './TaskModal.css'

const TaskModal = ({ task, onClose, onUpdate, socket, projectId }) => {
  const [currentTask, setCurrentTask] = useState(task)
  const [commentText, setCommentText] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setCurrentTask(task)
  }, [task])

  useEffect(() => {
    if (socket && task) {
      // Listen for task updates
      socket.on('task-updated', (data) => {
        if (data.taskId === task._id) {
          fetchTask()
        }
      })
      
      // Listen for new comments
      socket.on('comment-added', (data) => {
        if (data.taskId === task._id) {
          fetchTask()
        }
      })
    }
    
    return () => {
      if (socket) {
        socket.off('task-updated')
        socket.off('comment-added')
      }
    }
  }, [socket, task])

  const fetchTask = async () => {
    try {
      const token = user.token
      const response = await axios.get(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setCurrentTask(response.data)
    } catch (error) {
      console.error('Error fetching task:', error)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      const token = user.token
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${task._id}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      setCurrentTask(response.data)
      onUpdate(response.data)
      
      // Emit real-time update
      if (socket) {
        socket.emit('task-updated', {
          taskId: task._id,
          projectId: projectId
        })
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    
    try {
      const token = user.token
      const response = await axios.post(
        `http://localhost:5000/api/tasks/${task._id}/comments`,
        { content: commentText },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      setCommentText('')
      setCurrentTask(response.data)
      
      // Emit real-time update
      if (socket) {
        socket.emit('comment-added', {
          taskId: task._id,
          projectId: projectId,
          comment: response.data.comments[response.data.comments.length - 1]
        })
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const handleAssignToMe = async () => {
    try {
      const token = user.token
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${task._id}/assign`,
        { userId: user._id },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      
      setCurrentTask(response.data)
      onUpdate(response.data)
      
      // Emit real-time update
      if (socket) {
        socket.emit('task-updated', {
          taskId: task._id,
          projectId: projectId
        })
      }
    } catch (error) {
      console.error('Error assigning task:', error)
    }
  }

  if (!currentTask) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-modal" onClick={e => e.stopPropagation()}>
        <div className="task-modal-header">
          <h2>{currentTask.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="task-modal-body">
          <div className="task-details">
            <div className="detail-group">
              <label>Description</label>
              <p>{currentTask.description || 'No description provided'}</p>
            </div>
            
            <div className="detail-group">
              <label>Status</label>
              <select 
                value={currentTask.status} 
                onChange={(e) => handleStatusChange(e.target.value)}
                className="status-select"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>
            
            <div className="detail-group">
              <label>Assigned To</label>
              <div className="assigned-users">
                {currentTask.assignedTo && currentTask.assignedTo.length > 0 ? (
                  currentTask.assignedTo.map(user => (
                    <span key={user._id} className="user-badge">
                      {user.username}
                    </span>
                  ))
                ) : (
                  <span>Unassigned</span>
                )}
              </div>
              <button 
                className="btn-secondary"
                onClick={handleAssignToMe}
              >
                Assign to Me
              </button>
            </div>
            
            {currentTask.dueDate && (
              <div className="detail-group">
                <label>Due Date</label>
                <p>{new Date(currentTask.dueDate).toLocaleDateString()}</p>
              </div>
            )}
            
            <div className="detail-group">
              <label>Priority</label>
              <span className={`priority-badge ${currentTask.priority.toLowerCase()}`}>
                {currentTask.priority}
              </span>
            </div>
          </div>
          
          <div className="task-comments">
            <h3>Comments</h3>
            <div className="comments-list">
              {currentTask.comments && currentTask.comments.length > 0 ? (
                currentTask.comments.map(comment => (
                  <div key={comment._id} className="comment">
                    <div className="comment-header">
                      <strong>{comment.author.username}</strong>
                      <span>{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                ))
              ) : (
                <p>No comments yet</p>
              )}
            </div>
            
            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows="3"
              />
              <button type="submit" disabled={!commentText.trim()}>
                Add Comment
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskModal