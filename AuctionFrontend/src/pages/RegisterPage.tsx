import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register as registerRequest } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

function RegisterPage() {
	const navigate = useNavigate()
	const { login } = useAuth()
	const [userName, setUserName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			const response = await registerRequest({ userName, email, password })
			login(response.token)
			navigate('/auctions')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Registration failed.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<section className="app-section">
			<h1>Register</h1>
			<p>Create a new account to start bidding.</p>
			<form className="form" onSubmit={handleSubmit}>
				<label className="form-field">
					<span>Username</span>
					<input
						type="text"
						required
						value={userName}
						onChange={(event) => setUserName(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Email</span>
					<input
						type="email"
						required
						value={email}
						onChange={(event) => setEmail(event.target.value)}
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
					{isSubmitting ? 'Creating account...' : 'Register'}
				</button>
			</form>
		</section>
	)
}

export default RegisterPage
