'use client'

import { SignIn } from '@clerk/nextjs'

export default function ContributorSignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Sign in as a Contributor</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter your email to receive a magic link. No password needed.
        </p>
        <SignIn
          routing="path"
          path="/contributor/sign-in"
          signUpUrl="/contributor/sign-up"
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
