import React, {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import { login as authLogin } from '../store/authSlice'
import { fetchNotes } from '../store/notesSlice'; // Import fetchNotes
import {Button, Input, Logo} from "../components"
import {useDispatch} from "react-redux"
import authService from "../appwrite/auth"
import {useForm} from "react-hook-form"

function Login() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const {register, handleSubmit} = useForm()
    const [error, setError] = useState("")

    const login = async(data) => {
        setError("")
        try {
            const session = await authService.login(data)
            if (session) {
                const userData = await authService.getCurrentUser()
                if(userData) {
                    dispatch(authLogin(userData));
                    dispatch(fetchNotes(userData.$id)); // Fetch notes on login
                }
                navigate("/")
            }
        } catch (error) {
            setError(error.message)
        }
    }

  return (
    <div className='flex items-center justify-center w-full min-h-screen dark:bg-black bg-white'>
        <div className={`mx-auto w-full max-w-lg dark:bg-gray-800 bg-gray-100 rounded-xl p-10 border dark:border-gray-700 border-black/10 shadow-lg`}>
            <div className="mb-6 flex justify-center">
                <Logo width="150px" />
            </div>
            <h2 className="text-center text-2xl font-bold leading-tight dark:text-white text-black mb-4">Sign in to your account</h2>
            <p className="mt-2 text-center text-base dark:text-gray-300 text-black/60">
                Don&apos;t have any account?&nbsp;
                <Link
                    to="/signup"
                    className="font-medium text-blue-600 dark:text-blue-400 transition-all duration-200 hover:underline"
                >
                    Sign Up
                </Link>
            </p>
            {error && <p className="text-red-600 mt-8 text-center">{error}</p>}
            <form onSubmit={handleSubmit(login)} className='mt-8'>
                <div className='space-y-5'>
                    <Input
                    label="Email: "
                    placeholder="Enter your email"
                    type="email"
                    {...register("email", {
                        required: true,
                        validate: {
                            matchPatern: (value) => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                            "Email address must be a valid address",
                        }
                    })}
                    />
                    <Input
                    label="Password: "
                    type="password"
                    placeholder="Enter your password"
                    {...register("password", {
                        required: true,
                    })}
                    />
                    <Button
                    type="submit"
                    className="w-full"
                    >Sign in</Button>
                </div>
            </form>
        </div>
    </div>
  )
}

export default Login