import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import Dashboard from './pages/Dashboard';
import HazardEvents from './pages/HazardEvents';
import HazardZones from './pages/HazardZones';
import Infrastructure from './pages/Infrastructure';
import AnalyzePage from './pages/AnalyzePage';
import Navigation from './components/Navigation';

function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <main className="container-fluid mt-4">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/analyze" element={<AnalyzePage />} />
            <Route path="/hazard-events" element={<HazardEvents />} />
            <Route path="/hazard-zones" element={<HazardZones />} />
            <Route path="/infrastructure" element={<Infrastructure />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;