import React, { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, type = 'text', className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="inline-block mb-1 pl-1 dark:text-black text-white">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`px-3 py-2 rounded-lg bg-white dark:bg-black text-black dark:text-white outline-none focus:ring-2 focus:ring-blue-500 duration-200 border border-gray-200 dark:border-gray-700 w-full ${className}`}
        ref={ref}
        {...props}
      />
    </div>
  )
})

export default Input