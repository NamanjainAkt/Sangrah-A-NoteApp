import { Route, Routes } from "react-router-dom"
import { Home, Archive, Important, Bin } from "./pages"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AuthLayout from "./components/AuthLayout"
import AuthInitializer from "./components/AuthInitializer"

const App = () => {
  return (
    <div className="min-h-screen dark:bg-black bg-white">
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
            <div className="min-h-screen dark:bg-black bg-white">
              <Navbar />
              <main className="flex">
                <Sidebar className="w-1/3" />
                <div className="w-2/3 min-w-[80vw] flex justify-center items-center p-8">
                  <Home />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />
        
        <Route path="/archive" element={
          <AuthLayout authentication={true}>
            <div className="min-h-screen dark:bg-black bg-white">
              <Navbar />
              <main className="flex">
                <Sidebar className="w-1/3" />
                <div className="w-2/3 min-w-[80vw] flex justify-center items-center p-8">
                  <Archive />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />
        
        <Route path="/important" element={
          <AuthLayout authentication={true}>
            <div className="min-h-screen dark:bg-black bg-white">
              <Navbar />
              <main className="flex">
                <Sidebar className="w-1/3" />
                <div className="w-2/3 min-w-[80vw] flex justify-center items-center p-8">
                  <Important />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />
        
        <Route path="/bin" element={
          <AuthLayout authentication={true}>
            <div className="min-h-screen dark:bg-black bg-white">
              <Navbar />
              <main className="flex">
                <Sidebar className="w-1/3" />
                <div className="w-2/3 min-w-[80vw] flex justify-center items-center p-8">
                  <Bin />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />
      </Routes>
    </div>
  )
}

export default App
