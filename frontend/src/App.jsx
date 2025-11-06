import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Tools from './pages/Tools';
import ResetPassword from './pages/ResetPassword';
import ComingSoon from './pages/ComingSoon';
import Pricing from './pages/Pricing';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import useDocumentTitle from './hooks/useDocumentTitle';

function App() {
  // Small component to invoke the hook within Router context
  const TitleSync = () => {
    useDocumentTitle();
    return null;
  };
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <ThemeProvider>
        <Router>
          <div className="App">
            <Navbar />
            <TitleSync />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/:toolId" element={<Tools />} />
              <Route path="/coming-soon/:toolId" element={<ComingSoon />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
          <Footer />
        </div>
        </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;