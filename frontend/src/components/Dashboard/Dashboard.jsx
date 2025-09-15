import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api' // Import the api service
import ProjectCard from './ProjectCard'
import NewProjectModal from './NewProjectModal'
import './Dashboard.css'

const Dashboard = ({ socket }) => {
  const [projects, setProjects] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (socket) {
      socket.on('project-updated', (updatedProject) => {
        setProjects(prev => prev.map(p => 
          p._id === updatedProject._id ? updatedProject : p
        ))
      })
    }

    return () => {
      if (socket) {
        socket.off('project-updated')
      }
    }
  }, [socket])

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects')
      setProjects(response.data)
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Show user-friendly error message
      alert('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleNewProject = (newProject) => {
    setProjects([...projects, newProject])
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Projects</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowModal(true)}
        >
          + New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.length > 0 ? (
          projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))
        ) : (
          <div className="empty-state">
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <NewProjectModal 
          onClose={() => setShowModal(false)}
          onProjectCreated={handleNewProject}
          socket={socket}
        />
      )}
    </div>
  )
}

export default Dashboard