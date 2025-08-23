import React from 'react'

function Logo({ width = '100px' }) {
  return (
    <div style={{ width }} className="text-center">
      <h1 className="text-3xl font-bold dark:text-white text-black sangrah">Sangrah</h1>
    </div>
  )
}

export default Logo