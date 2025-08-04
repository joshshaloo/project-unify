export default function VerifyRequest() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold">Check your email</h1>
        <p className="text-gray-600">
          A sign in link has been sent to your email address.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          If you don't see the email, check your spam folder.
        </p>
      </div>
    </div>
  )
}