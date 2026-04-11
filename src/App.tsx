import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import HardshipBursary from './pages/Forms/HardshipBursary';
import FormF from './pages/Forms/FormF';
import FormG from './pages/Forms/FormG';
import StandaloneFormWrapper from './components/Forms/StandaloneFormWrapper';

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

        {/* Guest Application Routes */}
        <Route path="/forms/hardship" element={
          <StandaloneFormWrapper title="Hardship Award">
            {(props) => <HardshipBursary {...props} />}
          </StandaloneFormWrapper>
        } />
        <Route path="/forms/practicum" element={
          <StandaloneFormWrapper title="Practicum Award">
            {(props) => <FormF {...props} />}
          </StandaloneFormWrapper>
        } />
        <Route path="/forms/graduation" element={
          <StandaloneFormWrapper title="Graduation Award">
            {(props) => <FormG {...props} />}
          </StandaloneFormWrapper>
        } />
      </Routes>
    </Router>
  );
}

export default App;
