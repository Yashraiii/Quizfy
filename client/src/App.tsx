
import './App.css'
import { Login } from './pages/login'
import { Signup } from './pages/signup'
import { DashBoard } from './pages/dashboard'
import { Createquiz} from './pages/createquiz'
import { PlayerPage } from './pages/playerpage'
import { LandingPage } from './pages/landing'

import { BrowserRouter, Routes,Route} from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { HostPage } from './pages/hostpage'
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem("token");
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

function App() {
  

  return (
    <div>
      <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage />} />
        <Route path = '/login' element ={<Login/>}></Route>
        <Route path='/signup' element = {<Signup/>}></Route>
        <Route path='/dashboard' element={<DashBoard/>}></Route>
        <Route path="/quiz/create" element={<ProtectedRoute><Createquiz /></ProtectedRoute>} />
        <Route path='/host/:roomCode' element={<ProtectedRoute><HostPage/></ProtectedRoute>}></Route>
        <Route path='/play/:roomCode' element={<PlayerPage />} />
        <Route path="/quiz/edit/:id" element={<ProtectedRoute><Createquiz /></ProtectedRoute>} />
      </Routes>
      </BrowserRouter>

    </div>
  )

}

export default App
