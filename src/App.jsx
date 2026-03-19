import { Route, Routes } from "react-router-dom"
import { Home, Archive, Important, Bin, Settings, Kanban, Goals, Badges, Timer, Calendar, Analytics } from "./pages"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AuthLayout from "./components/AuthLayout"
import AuthInitializer from "./components/AuthInitializer"
import Footer  from "./components/Footer"
import { ToastContainer } from 'react-toastify'
import { initPersistence } from './utils/persistence'
import 'react-toastify/dist/ReactToastify.css'

// Initialize persistence layer
initPersistence().catch(console.error);

const App = () => {
  return (
    <div className="min-h-screen dark:bg-[#171717] bg-white">
      <AuthInitializer />
      <Routes>
        <Route path="/login" element={
          <AuthLayout authentication={false}>
            <Login />
          </AuthLayout>
        } />
        <Route path="/signup" element={
          <AuthLayout authentication={false}>
            <Signup />
          </AuthLayout>
        } />

        <Route path="/" element={
          <AuthLayout authentication={true}>
            <div className="min-h-screen dark:bg-[#171717] bg-white">
              <Navbar />
              <main className="flex pt-16">
                <Sidebar />
                <div className="flex-1 min-w-0 p-4 max-sm:p-2 overflow-hidden">
                  <Home />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />

        {/* Create a common layout wrapper for all authenticated routes */}
        {[
          { path: "/kanban", component: <Kanban /> },
          { path: "/goals", component: <Goals /> },
          { path: "/archive", component: <Archive /> },
          { path: "/important", component: <Important /> },
          { path: "/bin", component: <Bin /> },
          { path: "/badges", component: <Badges /> },
          { path: "/settings", component: <Settings /> },
          { path: "/timer", component: <Timer /> },
          { path: "/calendar", component: <Calendar /> },
          { path: "/analytics", component: <Analytics /> }
        ].map(({ path, component }) => (
          <Route key={path} path={path} element={
            <AuthLayout authentication={true}>
              <div className="min-h-screen dark:bg-[#171717] bg-white">
                <Navbar />
                <main className="flex pt-16">
                  <Sidebar />
                  <div className="flex-1 min-w-0 p-4 max-sm:p-2 overflow-hidden">
                    {component}
                  </div>
                </main>
              </div>
            </AuthLayout>
          } />
        ))}
      </Routes>
      <Footer className="w-full h-16 bottom-0" />
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>

  )
}

export default App
