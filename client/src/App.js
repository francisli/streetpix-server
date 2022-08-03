import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.scss';

import { AuthContextProvider, AuthProtected } from './AuthContext';
import Footer from './Footer';
import Header from './Header';
import Home from './Home';
import Login from './Login';
import PasswordRoutes from './Passwords/PasswordRoutes';
import Register from './Register';
import AdminRoutes from './Admin/AdminRoutes';
import InvitesRoutes from './Invites/InvitesRoutes';
import MeetingsRoutes from './Meetings/MeetingsRoutes';
import UsersRoutes from './Users/UsersRoutes';

function App() {
  return (
    <AuthContextProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/passwords/*" element={<PasswordRoutes />} />
          <Route path="/invites/*" element={<InvitesRoutes />} />
          {process.env.REACT_APP_FEATURE_REGISTRATION === 'true' && <Route path="/register" element={<Register />} />}
          <Route path="/members/*" element={<UsersRoutes />} />
          <Route
            path="/meetings/*"
            element={
              <AuthProtected>
                <MeetingsRoutes />
              </AuthProtected>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AuthProtected isAdminRequired={true}>
                <AdminRoutes />
              </AuthProtected>
            }
          />
        </Routes>
        <Footer />
      </Router>
    </AuthContextProvider>
  );
}

export default App;
