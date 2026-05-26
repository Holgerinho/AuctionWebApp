import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
	const { isAuthenticated, isAdmin, logout } = useAuth()

	return (
		<header className="navbar">
			<div className="navbar-inner">
				<NavLink className="navbar-brand" to="/">
					AuctionWebApp
				</NavLink>
				<nav className="navbar-links">
					<NavLink className="navbar-link" to="/auctions">
						Auctions
					</NavLink>
					{isAuthenticated ? (
						<>
							<NavLink className="navbar-link" to="/auctions/create">
								Create
							</NavLink>
							<NavLink className="navbar-link" to="/my-auctions">
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
