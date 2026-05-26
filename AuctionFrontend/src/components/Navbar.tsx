import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
	const { isAuthenticated, isAdmin, logout, userName } = useAuth()
	const location = useLocation()
	const path = location.pathname
	const isCreateOrEditPath =
		path === '/auctions/create' || /^\/auctions\/\d+\/edit$/.test(path)
	const isAuctionsActive =
		path === '/auctions' ||
		(/^\/auctions\/\d+$/.test(path) && !isCreateOrEditPath)
	const isMyAuctionsActive = path === '/my-auctions' || isCreateOrEditPath

	return (
		<header className="navbar">
			<div className="navbar-inner">
				<NavLink className="navbar-brand" to="/">
					AuctionWebApp
				</NavLink>
				<nav className="navbar-links">
					<NavLink
						end
						className={`navbar-link${isAuctionsActive ? ' active' : ''}`}
						to="/auctions"
					>
						Auctions
					</NavLink>
					{isAuthenticated ? (
						<>
							<NavLink
								className={`navbar-link${isMyAuctionsActive ? ' active' : ''}`}
								to="/my-auctions"
							>
								My auctions
							</NavLink>
							<NavLink className="navbar-link" to="/profile">
								Profile
							</NavLink>
							{isAdmin ? (
								<NavLink className="navbar-link" to="/admin">
									Admin
								</NavLink>
							) : null}
							<button type="button" className="navbar-button" onClick={logout}>
								Logout
							</button>
							<span className="navbar-user">{userName ?? 'User'}</span>
						</>
					) : (
						<>
							<NavLink className="navbar-link" to="/login">
								Login
							</NavLink>
							<NavLink className="navbar-link" to="/register">
								Register
							</NavLink>
						</>
					)}
				</nav>
			</div>
		</header>
	)
}

export default Navbar
