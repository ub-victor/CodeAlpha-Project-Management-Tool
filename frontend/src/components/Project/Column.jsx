import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import TaskCard from './TaskCard'
import './Column.css'

const Column = ({ column, onTaskClick, projectId, socket, onTaskUpdate }) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    setLoading(true)
    try {
      const token = user.token
      const response = await axios.post('http://localhost:5000/api/tasks', {
        title: newTaskTitle,
        projectId: projectId,
        status: column.name
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      setNewTaskTitle('')
      setShowAddForm(false)
      onTaskUpdate(response.data)
      
      // Emit real-time update
      if (socket) {
        socket.emit('task-created', {
          taskId: response.data._id,
          projectId: projectId
        })
      }
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="column">
      <div className="column-header">
        <h3>{column.name}</h3>
        <span className="task-count">{column.tasks.length}</span>
      </div>
      
      <div className="tasks-list">
        {column.tasks.map(task => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={() => onTaskClick(task)}
            onUpdate={onTaskUpdate}
            socket={socket}
            projectId={projectId}
          />
        ))}
      </div>
      
      {showAddForm ? (
        <form onSubmit={handleAddTask} className="add-task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            autoFocus
          />
          <div className="form-actions">
            <button type="submit" disabled={loading || !newTaskTitle.trim()}>
              {loading ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="add-task-btn"
          onClick={() => setShowAddForm(true)}
        >
          + Add Task
        </button>
      )}
    </div>
  )
}

export default Column