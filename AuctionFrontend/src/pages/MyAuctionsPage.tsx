import { useEffect, useMemo, useState } from 'react'
import { getAuctions, type Auction } from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'
import { useAuth } from '../context/AuthContext'

function MyAuctionsPage() {
	const { token } = useAuth()
	const [auctions, setAuctions] = useState<Auction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const userId = useMemo(() => {
		if (!token) {
			return null
		}
		try {
			const payload = JSON.parse(atob(token.split('.')[1])) as {
				sub?: string
			}
			return payload.sub ? Number(payload.sub) : null
		} catch {
			return null
		}
	}, [token])

	useEffect(() => {
		const loadMyAuctions = async () => {
			if (!userId) {
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError('')
			try {
				const data = await getAuctions()
				setAuctions(data.filter((auction) => auction.userId === userId))
			} catch (err) {
				setError(
					err instanceof Error ? err.message : 'Failed to load auctions.',
				)
			} finally {
				setIsLoading(false)
			}
		}

		void loadMyAuctions()
	}, [userId])

	if (!userId) {
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
			<p>Your current open auctions.</p>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : auctions.length === 0 ? (
				<p>You have no open auctions yet.</p>
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
