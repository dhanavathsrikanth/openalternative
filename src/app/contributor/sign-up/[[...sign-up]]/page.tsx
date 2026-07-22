'use client'

import { SignUp } from '@clerk/nextjs'

export default function ContributorSignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Become a Contributor</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter your email to receive a magic link. No password needed.
        </p>
        <SignUp
          routing="path"
          path="/contributor/sign-up"
          signInUrl="/contributor/sign-in"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none border',
            },
          }}
        />
      </div>
    </main>
  )
}
