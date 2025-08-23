import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import authService from '../appwrite/auth'
import { login } from '../store/authSlice'

const AuthInitializer = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const initAuth = async () => {
      try {
        const userData = await authService.getCurrentUser()
        if (userData) {
          dispatch(login({ userData }))
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    }

    initAuth()
  }, [dispatch])

  return null
}

export default AuthInitializer