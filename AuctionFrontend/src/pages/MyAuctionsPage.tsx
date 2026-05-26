import { useEffect, useState } from 'react'
import { getMyAuctions, type Auction } from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'
import { useAuth } from '../context/AuthContext'

function MyAuctionsPage() {
	const { token } = useAuth()
	const [auctions, setAuctions] = useState<Auction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const loadMyAuctions = async () => {
			if (!token) {
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError('')
			try {
				const data = await getMyAuctions(token)
				setAuctions(data)
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to load auctions.',
				)
			} finally {
				setIsLoading(false)
			}
		}

		void loadMyAuctions()
	}, [token])

	if (!token) {
		return (
			<section className="app-section">
				<h1>My auctions</h1>
				<p>Log in to see your auctions.</p>
			</section>
		)
	}

	return (
		<section className="app-section app-section--wide">
			<h1>My auctions</h1>
			<p>Your auctions.</p>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : auctions.length === 0 ? (
				<p>You have no auctions yet.</p>
			) : (
				<div className="auction-grid">
					{auctions.map((auction) => (
						<AuctionCard key={auction.id} auction={auction} />
					))}
				</div>
			)}
		</section>
	)
}

export default MyAuctionsPage
