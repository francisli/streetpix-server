import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import './App.scss';

import { AuthContextProvider, AuthProtectedRoute } from './AuthContext';
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
        <Switch>
          <Route exact path="/">
            <Home />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/passwords">
            <PasswordRoutes />
          </Route>
          <Route path="/invites">
            <InvitesRoutes />
          </Route>
          {process.env.REACT_APP_FEATURE_REGISTRATION === 'true' && (
            <Route path="/register">
              <Register />
            </Route>
          )}
          <Route path="/members">
            <UsersRoutes />
          </Route>
          <AuthProtectedRoute path="/meetings">
            <MeetingsRoutes />
          </AuthProtectedRoute>
          <AuthProtectedRoute isAdminRequired={true} path="/admin">
            <AdminRoutes />
          </AuthProtectedRoute>
        </Switch>
        <Footer />
      </Router>
    </AuthContextProvider>
  );
}

export default App;
