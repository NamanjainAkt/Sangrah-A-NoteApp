import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { checkAuth } from '../store/authSlice'
import { loadSettingsFromStorage } from '../store/settingsSlice'

const AuthInitializer = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    const initAuth = async () => {
      try {
        dispatch(checkAuth())
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    }

    const initSettings = () => {
      try {
        const storedSettings = localStorage.getItem('appSettings')
        if (storedSettings) {
          dispatch(loadSettingsFromStorage(JSON.parse(storedSettings)))
        }
      } catch (error) {
        console.error('Error loading settings from localStorage:', error)
      }
    }

    initAuth()
    initSettings()
  }, [dispatch])

  return null
}

export default AuthInitializer
