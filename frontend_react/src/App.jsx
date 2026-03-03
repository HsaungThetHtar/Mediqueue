import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Routes } from 'react-router-dom'
import { Route } from 'react-router-dom'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Booking from './pages/Booking'
import Confirmation from './pages/Confirmation'
import DoctorDashboard from './pages/DoctorDashboard'
import DoctorSignUp from './pages/DoctorSignup'
import DoctorLogin from './pages/DoctorLogin'


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/doctor/signup" element={<DoctorSignUp />} />
        <Route path="/doctor/login" element={<DoctorLogin />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/dashboard" element={<DoctorDashboard />} />
      </Routes>
    </>
  )
}

export default App
