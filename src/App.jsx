import { Route, Routes } from "react-router-dom"
import { Home, Archive, Important, Bin } from "./pages"
import Sidebar from "./components/Sidebar"
import Navbar from "./components/Navbar"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import AuthLayout from "./components/AuthLayout"
import AuthInitializer from "./components/AuthInitializer"
import Footer  from "./components/Footer"

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
              <main className="flex max-sm:relative max-sm:flex-none justify-end">
                <Sidebar className="w-1/3 max-sm:bottom-0" />
                <div className="w-2/3 min-w-[70vw] min-h-[90vh] flex justify-end items-center p-4 mt-14 max-sm:mx-auto right-0 mx-4 md:mx-auto max-sm:mt-4 max-sm:w-full">
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
                <div className="w-2/3 min-w-[80vw] min-h-[90vh] flex justify-center items-center p-4 mt-4 mx-auto max-sm:w-full">
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
                <div className="w-2/3 min-w-[80vw] min-h-[90vh] flex justify-center items-center p-4 mt-4 mx-auto max-sm:w-full">
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
                <div className="w-2/3 min-w-[80vw] min-h-[90vh] flex justify-center items-center p-4 mt-4 mx-auto max-sm:w-full">
                  <Bin />
                </div>
              </main>
            </div>
          </AuthLayout>
        } />
      </Routes>
      <Footer className="w-full h-16 bottom-0" />
    </div>

  )
}

export default App
