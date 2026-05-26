import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login as loginRequest } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

function LoginPage() {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [userNameOrEmail, setUserNameOrEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			const response = await loginRequest({ userNameOrEmail, password })
			login(response.token)
			navigate('/auctions')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<section className="app-section">
			<h1>Login</h1>
			<p>Sign in to manage auctions and bids.</p>
			<form className="form" onSubmit={handleSubmit}>
				<label className="form-field">
					<span>Username or email</span>
					<input
						type="text"
						required
						value={userNameOrEmail}
						onChange={(event) => setUserNameOrEmail(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Password</span>
					<input
						type="password"
						required
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</label>
				{error ? <p className="form-error">{error}</p> : null}
				<button className="form-button" type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Signing in...' : 'Login'}
				</button>
			</form>
		</section>
	)
}

export default LoginPage
