import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import SubjectsProvider from './context/SubjectsProvider';
import Header from './components/Header';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import ScpDetail from './pages/ScpDetail';
import NotFound from './pages/NotFound';
import './App.css';

// App shell: routing, shared layout, and two providers that make shared
// data available to every page and component:
//   AuthProvider      the logged-in user           -> useAuth()
//   SubjectsProvider  the catalogue list (Supabase) -> useSubjects()
function App() {
  return (
    <Router>
      <AuthProvider>
        <SubjectsProvider>
          <Header />
          <Nav />
          <main className="site-main">
            <Routes>
              <Route path="/" element={<Home />} />
              {/* React Router ranks fixed paths above parameters, so /login
                  is matched here rather than as an SCP id by /:id. */}
              <Route path="/login" element={<Login />} />
              <Route path="/:id" element={<ScpDetail />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </SubjectsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
