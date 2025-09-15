import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const { register, user, error, clearError, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Register component mounted');
    console.log('Current user:', user);
    console.log('Current error:', error);
    
    if (user) {
      console.log('User exists, navigating to home');
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    console.log('Clearing previous errors');
    clearError()
  }, [])

  useEffect(() => {
    setPasswordsMatch(formData.password === formData.confirmPassword)
  }, [formData.password, formData.confirmPassword])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log('Register form submitted:', formData);
    
    if (formData.password !== formData.confirmPassword) {
      console.log('Passwords do not match');
      return
    }
    
    await register(formData.username, formData.email, formData.password)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
            <br />
            <small>Please check your connection and try again</small>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your password"
            />
            {!passwordsMatch && formData.confirmPassword && (
              <div className="error-text">Passwords do not match</div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="auth-btn"
            disabled={!passwordsMatch || loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  )
}

export default Register