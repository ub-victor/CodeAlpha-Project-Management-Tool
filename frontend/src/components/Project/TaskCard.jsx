import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import './TaskCard.css'

const TaskCard = ({ task, onClick, onUpdate, socket, projectId }) => {
  const [isDragging, setIsDragging] = useState(false)
  const { user } = useAuth()

  const handleDragStart = (e) => {
    e.dataTransfer.setData('taskId', task._id)
    e.dataTransfer.setData('fromStatus', task.status)
    setIsDragging(true)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this task?')) return
    
    try {
      const token = user.token
      await axios.delete(`http://localhost:5000/api/tasks/${task._id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      onUpdate(task)
      
      // Emit real-time update
      if (socket) {
        socket.emit('task-deleted', {
          taskId: task._id,
          projectId: projectId
        })
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  return (
    <div
      className={`task-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      <div className="task-content">
        <h4>{task.title}</h4>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        
        <div className="task-meta">
          {task.assignedTo && task.assignedTo.length > 0 && (
            <div className="assigned-users">
              {task.assignedTo.map(user => (
                <span key={user._id} className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          )}
          
          {task.dueDate && (
            <span className="due-date">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="task-actions">
        <button className="delete-btn" onClick={handleDelete}>
          ×
        </button>
      </div>
    </div>
  )
}

export default TaskCard