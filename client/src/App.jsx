import { Routes, Route } from 'react-router-dom';

import './App.scss';

import AuthContextProvider from './AuthContextProvider';
import { useStaticContext } from './StaticContext';
import AppRedirects from './AppRedirects';
import Header from './Header';
import Footer from './Footer';
import Home from './Home';
import Browse from './Browse';
import Login from './Login';
import Register from './Register';
import AdminRoutes from './Admin/AdminRoutes';
import InvitesRoutes from './Invites/InvitesRoutes';
import MeetingsRoutes from './Meetings/MeetingsRoutes';
import PasswordsRoutes from './Passwords/PasswordsRoutes';
import UsersRoutes from './Users/UsersRoutes';

function App() {
  const staticContext = useStaticContext();

  return (
    <AuthContextProvider>
      <Header />
      <Routes>
        <Route
          path="*"
          element={
            <AppRedirects>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/passwords/*" element={<PasswordsRoutes />} />
                <Route path="/invites/*" element={<InvitesRoutes />} />
                {staticContext?.env?.VITE_FEATURE_REGISTRATION === 'true' && <Route path="/register" element={<Register />} />}
                <Route path="/members/*" element={<UsersRoutes />} />
                <Route path="/browse" element={<Browse />}>
                  <Route path=":photoId" element={<></>} />
                  <Route path="" element={<></>} />
                </Route>
                <Route path="/meetings/*" element={<MeetingsRoutes />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
              </Routes>
            </AppRedirects>
          }
        />
      </Routes>
      <Footer />
    </AuthContextProvider>
  );
}

export default App;
