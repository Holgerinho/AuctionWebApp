import { useState } from 'react'
import { changePassword } from '../api/authApi'
import { useAuth } from '../context/AuthContext'

function ProfilePage() {
	const { token } = useAuth()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')
		setSuccess('')

		if (!token) {
			setError('You must be logged in to change your password.')
			return
		}

		if (newPassword !== confirmPassword) {
			setError('New password and confirmation do not match.')
			return
		}

		setIsSubmitting(true)
		try {
			await changePassword(
				{ currentPassword, newPassword },
				token,
			)
			setSuccess('Password updated successfully.')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to update password.',
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<section className="app-section">
			<h1>Profile</h1>
			<p>Update your account password.</p>
			<form className="form" onSubmit={handleSubmit}>
				<label className="form-field">
					<span>Current password</span>
					<input
						type="password"
						required
						value={currentPassword}
						onChange={(event) => setCurrentPassword(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>New password</span>
					<input
						type="password"
						required
						value={newPassword}
						onChange={(event) => setNewPassword(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Confirm new password</span>
					<input
						type="password"
						required
						value={confirmPassword}
						onChange={(event) => setConfirmPassword(event.target.value)}
					/>
				</label>
				{error ? <p className="form-error">{error}</p> : null}
				{success ? <p className="form-success">{success}</p> : null}
				<button className="form-button" type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Updating...' : 'Update password'}
				</button>
			</form>
		</section>
	)
}

export default ProfilePage
