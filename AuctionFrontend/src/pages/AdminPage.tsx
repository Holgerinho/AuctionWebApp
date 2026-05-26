import { useCallback, useEffect, useState } from 'react'
import {
	deactivateAuction,
	deactivateUser,
	getAdminAuctions,
	getAdminUsers,
	type AdminAuction,
	type AdminUser,
} from '../api/adminApi'
import { useAuth } from '../context/AuthContext'

function AdminPage() {
	const { token, isAdmin } = useAuth()
	const [users, setUsers] = useState<AdminUser[]>([])
	const [auctions, setAuctions] = useState<AdminAuction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const loadAdminData = useCallback(async () => {
		if (!token) {
			setIsLoading(false)
			setError('You must be logged in.')
			return
		}

		setIsLoading(true)
		setError('')
		try {
			const [usersData, auctionsData] = await Promise.all([
				getAdminUsers(token),
				getAdminAuctions(token),
			])
			setUsers(usersData)
			setAuctions(auctionsData)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load admin data.')
		} finally {
			setIsLoading(false)
		}
	}, [token])

	useEffect(() => {
		void loadAdminData()
	}, [loadAdminData])

	const handleDeactivateUser = async (userId: number) => {
		if (!token) {
			return
		}
		try {
			await deactivateUser(userId, token)
			await loadAdminData()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to deactivate user.')
		}
	}

	const handleDeactivateAuction = async (auctionId: number) => {
		if (!token) {
			return
		}
		try {
			await deactivateAuction(auctionId, token)
			await loadAdminData()
		} catch (err) {
			setError(
				err instanceof Error ? err.message : 'Failed to deactivate auction.',
			)
		}
	}

	if (!isAdmin) {
		return (
			<section className="app-section">
				<h1>Admin</h1>
				<p>Admin access is required.</p>
			</section>
		)
	}

	return (
		<section className="app-section app-section--wide">
			<h1>Admin</h1>
			<p>Manage users and auctions.</p>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? <p>Loading admin data...</p> : null}

			<div className="admin-grid">
				<div className="admin-panel">
					<h3>Users</h3>
					<ul className="admin-list">
						{users.map((user) => (
							<li key={user.id}>
								<div>
									<strong>{user.userName}</strong>
									<p>
										{user.email} | {user.role} |{' '}
										{user.isActive ? 'Active' : 'Inactive'}
									</p>
								</div>
								{user.isActive && user.role !== 'Admin' ? (
									<button
										type="button"
										className="form-button form-button-danger"
										onClick={() => handleDeactivateUser(user.id)}
									>
										Deactivate
									</button>
								) : null}
							</li>
						))}
					</ul>
				</div>

				<div className="admin-panel">
					<h3>Auctions</h3>
					<ul className="admin-list">
						{auctions.map((auction) => (
							<li key={auction.id}>
								<div>
									<strong>{auction.title}</strong>
									<p>
										Owner #{auction.userId} |{' '}
										{auction.isActive ? 'Active' : 'Inactive'}
									</p>
								</div>
								{auction.isActive ? (
									<button
										type="button"
										className="form-button form-button-danger"
										onClick={() => handleDeactivateAuction(auction.id)}
									>
										Deactivate
									</button>
								) : null}
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	)
}

export default AdminPage
