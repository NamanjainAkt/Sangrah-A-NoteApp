import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice'
import { clearNotes } from '../store/notesSlice' // Import clearNotes
import authService from '../appwrite/auth'

const Navbar = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.auth)

  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logout())
      dispatch(clearNotes()) // Dispatch clearNotes after logout
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className='flex items-center p-4 dark:bg-black dark:text-white bg-white text-black justify-between fixed w-full max-sm:p-2'>




      <div><h1 
      className='text-5xl tracking-wide font-bold sangrah mx-4'
      >Sangrah
      </h1></div>
      <div>
        <button
        className='px-4 py-2 mx-4 rounded-lg font-medium text-white bg-black dark:bg-white dark:text-black hover:shadow-lg hover:shadow-black/50 dark:hover:shadow-white/50 transition-all duration-300'

        onClick={handleLogout}>Logout</button>
      </div>
    </header>
  )
}

export default Navbar