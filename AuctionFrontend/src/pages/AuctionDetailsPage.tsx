import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
	getAuctionById,
	getBidsForAuction,
	type Auction,
	type Bid,
} from '../api/auctionApi'

function AuctionDetailsPage() {
	const { id } = useParams()
	const auctionId = Number(id)
	const [auction, setAuction] = useState<Auction | null>(null)
	const [bids, setBids] = useState<Bid[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		const loadDetails = async () => {
			if (!auctionId) {
				setError('Invalid auction id.')
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError('')
			try {
				const [auctionData, bidData] = await Promise.all([
					getAuctionById(auctionId),
					getBidsForAuction(auctionId),
				])
				setAuction(auctionData)
				setBids(bidData)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load auction.')
			} finally {
				setIsLoading(false)
			}
		}

		loadDetails()
	}, [auctionId])

	if (isLoading) {
		return (
			<section className="app-section">
				<h1>Auction details</h1>
				<p>Loading auction...</p>
			</section>
		)
	}

	if (error || !auction) {
		return (
			<section className="app-section">
				<h1>Auction details</h1>
				<p className="form-error">{error || 'Auction not found.'}</p>
			</section>
		)
	}

	const price = auction.currentPrice ?? auction.startingPrice
	const endsAt = new Date(auction.endsAt).toLocaleString()

	return (
		<section className="app-section app-section--wide">
			<h1>{auction.title}</h1>
			<p>{auction.description}</p>
			<div className="auction-detail-grid">
				<div>
					<h3>Details</h3>
					<ul className="detail-list">
						<li>Current price: {price} kr</li>
						<li>Ends: {endsAt}</li>
						<li>Status: {auction.isActive ? 'Active' : 'Inactive'}</li>
					</ul>
				</div>
				<div>
					<h3>Bid history</h3>
					{bids.length === 0 ? (
						<p>No bids yet.</p>
					) : (
						<ul className="bid-list">
							{bids.map((bid) => (
								<li key={bid.id}>
									<span>{bid.amount} kr</span>
									<span>
										{new Date(bid.createdAt).toLocaleString()}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</section>
	)
}

export default AuctionDetailsPage
