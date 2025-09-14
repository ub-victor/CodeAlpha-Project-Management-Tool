import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import Column from './Column'
import TaskModal from './TaskModal'
import './ProjectBoard.css'

const ProjectBoard = ({ socket }) => {
  const [project, setProject] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { id } = useParams()
  const { user } = useAuth()

  useEffect(() => {
    fetchProject()
    
    if (socket) {
      socket.emit('join-project', id)
      
      socket.on('task-updated', (data) => {
        if (data.projectId === id) {
          fetchProject() // Refresh project data
        }
      })
      
      socket.on('comment-added', (data) => {
        if (data.projectId === id) {
          fetchProject() // Refresh project data
        }
      })
    }

    return () => {
      if (socket) {
        socket.off('task-updated')
        socket.off('comment-added')
      }
    }
  }, [id, socket])

  const fetchProject = async () => {
    try {
      const token = user.token
      const response = await axios.get(`http://localhost:5000/api/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setProject(response.data)
    } catch (error) {
      console.error('Error fetching project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = (task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleTaskUpdate = (updatedTask) => {
    // Emit socket event for real-time update
    if (socket) {
      socket.emit('task-updated', {
        taskId: updatedTask._id,
        projectId: id
      })
    }
    fetchProject() // Refresh data
  }

  if (loading) {
    return <div className="loading">Loading project...</div>
  }

  if (!project) {
    return <div className="error">Project not found</div>
  }

  return (
    <div className="project-board">
      <div className="project-header">
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </div>

      <div className="board-columns">
        {project.columns.map((column, index) => (
          <Column
            key={index}
            column={column}
            onTaskClick={handleTaskClick}
            projectId={id}
            socket={socket}
            onTaskUpdate={handleTaskUpdate}
          />
        ))}
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
          onUpdate={handleTaskUpdate}
          socket={socket}
          projectId={id}
        />
      )}
    </div>
  )
}

export default ProjectBoard