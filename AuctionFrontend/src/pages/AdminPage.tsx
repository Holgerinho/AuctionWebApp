import { useCallback, useEffect, useMemo, useState } from 'react'
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
	type UserSort = 'nameAsc' | 'nameDesc' | 'createdDesc' | 'activeFirst'
	type AuctionSort = 'endsAtDesc' | 'endsAtAsc' | 'activeFirst' | 'titleAsc'

	const { token, isAdmin } = useAuth()
	const [users, setUsers] = useState<AdminUser[]>([])
	const [auctions, setAuctions] = useState<AdminAuction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [userSortBy, setUserSortBy] = useState<UserSort>('nameAsc')
	const [auctionSortBy, setAuctionSortBy] = useState<AuctionSort>('endsAtDesc')

	const sortedUsers = useMemo(() => {
		const copy = [...users]
		switch (userSortBy) {
			case 'nameDesc':
				return copy.sort((a, b) => b.userName.localeCompare(a.userName))
			case 'createdDesc':
				return copy.sort(
					(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
				)
			case 'activeFirst':
				return copy.sort((a, b) => Number(b.isActive) - Number(a.isActive))
			case 'nameAsc':
			default:
				return copy.sort((a, b) => a.userName.localeCompare(b.userName))
		}
	}, [users, userSortBy])

	const sortedAuctions = useMemo(() => {
		const copy = [...auctions]
		switch (auctionSortBy) {
			case 'endsAtAsc':
				return copy.sort(
					(a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
				)
			case 'activeFirst':
				return copy.sort((a, b) => Number(b.isActive) - Number(a.isActive))
			case 'titleAsc':
				return copy.sort((a, b) => a.title.localeCompare(b.title))
			case 'endsAtDesc':
			default:
				return copy.sort(
					(a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
				)
		}
	}, [auctions, auctionSortBy])

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
					<div className="admin-panel-header">
						<h3>Users</h3>
						<select
							className="sort-select"
							value={userSortBy}
							onChange={(event) => setUserSortBy(event.target.value as UserSort)}
						>
							<option value="nameAsc">Name A-Z</option>
							<option value="nameDesc">Name Z-A</option>
							<option value="createdDesc">Newest users</option>
							<option value="activeFirst">Active first</option>
						</select>
					</div>
					<ul className="admin-list">
						{sortedUsers.map((user) => (
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
					<div className="admin-panel-header">
						<h3>Auctions</h3>
						<select
							className="sort-select"
							value={auctionSortBy}
							onChange={(event) =>
								setAuctionSortBy(event.target.value as AuctionSort)
							}
						>
							<option value="endsAtDesc">Ending latest</option>
							<option value="endsAtAsc">Ending soon</option>
							<option value="activeFirst">Active first</option>
							<option value="titleAsc">Title A-Z</option>
						</select>
					</div>
					<ul className="admin-list">
						{sortedAuctions.map((auction) => (
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
