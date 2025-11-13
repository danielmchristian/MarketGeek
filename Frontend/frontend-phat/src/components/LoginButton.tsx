import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { AuthComponent } from './AuthComponent'

export default function LoginButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Button onClick={() => setOpen(true)}>Login</Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-full max-w-md p-4">
            <div className="flex justify-end mb-2">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </div>
            <AuthComponent />
          </div>
        </div>
      )}
    </>
  )
}
