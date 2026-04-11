import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import StaffDashboard from './pages/StaffDashboard';
import InternalSignIn from './pages/InternalSignIn';
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
        {/* Staff Portal */}
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/internal/login" element={<InternalSignIn />} />

        {/* Guest Application Routes */}
        <Route path="/forms/hardship" element={
          <StandaloneFormWrapper>
            {(props) => <HardshipBursary {...props} />}
          </StandaloneFormWrapper>
        } />
        <Route path="/forms/practicum" element={
          <StandaloneFormWrapper>
            {(props) => <FormF {...props} />}
          </StandaloneFormWrapper>
        } />
        <Route path="/forms/graduation" element={
          <StandaloneFormWrapper>
            {(props) => <FormG {...props} />}
          </StandaloneFormWrapper>
        } />
      </Routes>
    </Router>
  );
}

export default App;
