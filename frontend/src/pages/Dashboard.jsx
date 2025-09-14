import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProjectCard from '../components/ProjectCard';
import NewProjectModal from '../components/NewProjectModal';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewProject = (newProject) => {
    setProjects([...projects, newProject]);
  };

  if (loading) {
    return <div className="loading">Loading your projects...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>My Projects</h1>
        <button 
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          <i className="fas fa-plus"></i> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-folder-open"></i>
          <h2>No projects yet</h2>
          <p>Create your first project to get started</p>
          <button 
            className="btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {isModalOpen && (
        <NewProjectModal 
          onClose={() => setIsModalOpen(false)}
          onProjectCreated={handleNewProject}
        />
      )}
    </div>
  );
};

export default Dashboard;