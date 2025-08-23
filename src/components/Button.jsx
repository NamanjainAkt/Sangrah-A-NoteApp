import React from 'react'

function Button({
  children,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`px-4 py-2 rounded-lg font-medium text-white bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors duration-200 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button