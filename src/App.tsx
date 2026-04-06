import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <Routes>
        {/* Set SignIn as the default home page and /signin */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />
        {/* Registration page */}
        <Route path="/signup" element={<SignUp />} />
        {/* Forgot Password page */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        {/* Student Dashboard (Unified Shell) */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
