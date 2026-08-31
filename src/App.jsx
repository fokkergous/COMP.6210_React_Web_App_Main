import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import ScpDetail from './pages/ScpDetail';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  return (
    <Router>
      <Header />
      <Nav />
      <main className="site-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:id" element={<ScpDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
