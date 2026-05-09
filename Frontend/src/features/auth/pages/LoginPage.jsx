import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { useLoginMutation } from '../hooks/useAuthMutations'
import { ROUTES } from '@/constants/routes'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) })

  const { mutate: login, isPending } = useLoginMutation()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="card w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-0.5 mb-2">
            <span className="text-ebay-blue font-bold text-4xl">e</span>
            <span className="text-ebay-red font-bold text-4xl">B</span>
            <span className="text-ebay-yellow font-bold text-4xl">a</span>
            <span className="text-ebay-green font-bold text-4xl">y</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Sign in to your account</h1>
        </div>

        <form onSubmit={handleSubmit(login)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label">Password <span className="text-red-500">*</span></label>
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>
          <Button type="submit" loading={isPending} className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:text-primary-700">
            Register now
          </Link>
        </p>
      </div>
    </div>
  )
}