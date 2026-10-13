import { useState } from 'react'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import Services from './pages/Services.jsx'
import AuthPage from './pages/AuthPage.jsx'
import TrackComplaint from './pages/TrackComplaint.jsx'
import './index.css'

const views = ['home','about','services','login','register','track']
export default function App() {
  const [view,setView] = useState(() => location.hash.slice(1) || 'home')
  window.onhashchange = () => setView(views.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home')
  const page = {home:<Home/>,about:<About/>,services:<Services/>,track:<TrackComplaint/>,login:<AuthPage mode="login"/>,register:<AuthPage mode="register"/>}
  return <div className="app-shell"><Header active={view}/><main>{page[view] || page.home}</main><Footer/></div>
}