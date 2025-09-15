import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { io } from 'socket.io-client'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import ProjectBoard from './components/Project/ProjectBoard'
import Navbar from './components/Layout/Navbar'
import Footer from './components/Layout/Footer'
import { AuthProvider } from './context/AuthContext'
import './App.css'

function App() {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io('http://localhost:5000')
    setSocket(newSocket)

    return () => newSocket.close()
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Dashboard socket={socket} />} />
              <Route path="/project/:id" element={<ProjectBoard socket={socket} />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App