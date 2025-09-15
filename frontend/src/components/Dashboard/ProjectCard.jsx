import { Link } from 'react-router-dom'
import './ProjectCard.css'

const ProjectCard = ({ project }) => {
  return (
    <div className="project-card">
      <Link to={`/project/${project._id}`} className="project-link">
        <h3>{project.name}</h3>
        <p>{project.description || 'No description'}</p>
        <div className="project-meta">
          <span>Created by: {project.createdBy.username}</span>
          <span>Members: {project.members.length + 1}</span>
        </div>
      </Link>
    </div>
  )
}

export default ProjectCard