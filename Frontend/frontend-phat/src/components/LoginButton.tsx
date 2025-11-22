import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { AuthComponent } from './AuthComponent'
import { firebaseAuth } from '../utils/firebase/auth'
import { User, onAuthStateChanged } from 'firebase/auth'
import { auth } from '../utils/firebase/config'

export default function LoginButton() {
  const [open, setOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Monitor Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔘 LoginButton auth state:', user?.email || 'null')
      setCurrentUser(user)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = async () => {
    try {
      await firebaseAuth.signOut()
      setOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleButtonClick = () => {
    if (currentUser) {
      handleLogout()
    } else {
      setOpen(true)
    }
  }

  return (
    <>
      <Button onClick={handleButtonClick}>
        {currentUser ? 'Log out' : 'Login'}
      </Button>

      {open && !currentUser && (
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
            <AuthComponent onSuccess={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
