import { NavLink } from 'react-router-dom'

function Navbar() {
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
					<NavLink className="navbar-link" to="/auctions/create">
						Create
					</NavLink>
					<NavLink className="navbar-link" to="/my-auctions">
						My auctions
					</NavLink>
					<NavLink className="navbar-link" to="/profile">
						Profile
					</NavLink>
					<NavLink className="navbar-link" to="/admin">
						Admin
					</NavLink>
					<NavLink className="navbar-link" to="/login">
						Login
					</NavLink>
					<NavLink className="navbar-link" to="/register">
						Register
					</NavLink>
				</nav>
			</div>
		</header>
	)
}

export default Navbar
