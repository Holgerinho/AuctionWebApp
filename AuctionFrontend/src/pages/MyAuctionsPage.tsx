import { useEffect, useState } from 'react'
import { getMyAuctions, getMyBidAuctions, type Auction } from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'
import { useAuth } from '../context/AuthContext'

function MyAuctionsPage() {
	const { token } = useAuth()
	const [myAuctions, setMyAuctions] = useState<Auction[]>([])
	const [bidAuctions, setBidAuctions] = useState<Auction[]>([])
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
				const [myData, bidData] = await Promise.all([
					getMyAuctions(token),
					getMyBidAuctions(token),
				])
				setMyAuctions(myData)
				setBidAuctions(bidData)
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
			<p>Your own auctions and the auctions you have bid on.</p>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : (
				<>
					<h3>Your created auctions</h3>
					{myAuctions.length === 0 ? (
						<p>You have not created any auctions yet.</p>
					) : (
						<div className="auction-grid">
							{myAuctions.map((auction) => (
								<AuctionCard key={auction.id} auction={auction} />
							))}
						</div>
					)}

					<h3>Auctions you have bid on</h3>
					{bidAuctions.length === 0 ? (
						<p>You have not placed bids yet.</p>
					) : (
						<div className="auction-grid">
							{bidAuctions.map((auction) => (
								<AuctionCard key={auction.id} auction={auction} />
							))}
						</div>
					)}
				</>
			)}
		</section>
	)
}

export default MyAuctionsPage
