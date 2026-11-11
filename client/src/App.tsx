
import { SmoothScroll } from './components/smoothScroll'
import { GridBackground } from './components/ui/grid-background'
import { Login } from './pages/login'
import { Signup } from './pages/signup'
import { DashBoard } from './pages/dashboard'
import { Createquiz } from './pages/createquiz'
import { PlayerPage } from './pages/playerpage'
import { LandingPage } from './pages/landing'
import { HostPage } from './pages/hostpage'

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
  return (
    <SmoothScroll>
      <BrowserRouter>
        <Routes>
          {/* Pages WITHOUT Grid Background */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Pages WITH Grid Background */}
          <Route
            path="/dashboard"
            element={
              <GridBackground>
                <DashBoard />
              </GridBackground>
            }
          />
          <Route
            path="/quiz/create"
            element={
              <ProtectedRoute>
                <GridBackground>
                  <Createquiz />
                </GridBackground>
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/edit/:id"
            element={
              <ProtectedRoute>
                <GridBackground>
                  <Createquiz />
                </GridBackground>
              </ProtectedRoute>
            }
          />
          <Route
            path="/host/:roomCode"
            element={
              <ProtectedRoute>
                <GridBackground>
                  <HostPage />
                </GridBackground>
              </ProtectedRoute>
            }
          />
          <Route
            path="/play/:roomCode"
            element={
              <GridBackground>
                <PlayerPage />
              </GridBackground>
            }
          />
        </Routes>
      </BrowserRouter>
    </SmoothScroll>
  );
}

export default App
