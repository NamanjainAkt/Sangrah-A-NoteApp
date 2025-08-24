import React from 'react'

function Logo({ width = '100px' }) {
  return (
    <div style={{ width }} className="text-center">
      <h1 className="text-4xl font-bold dark:text-black text-white sangrah">Sangrah</h1>
    </div>
  )
}

export default Logo