import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
	getAuctionById,
	getBidsForAuction,
	type Auction,
	type Bid,
} from '../api/auctionApi'
import { createBid } from '../api/bidApi'
import { useAuth } from '../context/AuthContext'

function AuctionDetailsPage() {
	const { id } = useParams()
	const auctionId = Number(id)
	const { isAuthenticated, token } = useAuth()
	const [auction, setAuction] = useState<Auction | null>(null)
	const [bids, setBids] = useState<Bid[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [bidAmount, setBidAmount] = useState('')
	const [bidError, setBidError] = useState('')
	const [isSubmittingBid, setIsSubmittingBid] = useState(false)

	const loadDetails = useCallback(async () => {
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
	}, [auctionId])

	const isOwner = useMemo(() => {
		if (!token || !auction) {
			return false
		}
		try {
			const payload = JSON.parse(atob(token.split('.')[1])) as {
				sub?: string
			}
			return Number(payload.sub) === auction.userId
		} catch {
			return false
		}
	}, [token, auction])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadDetails()
	}, [loadDetails])

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
	const endsAtDate = new Date(auction.endsAt)
	const endsAt = endsAtDate.toLocaleString()
	const isClosed = !auction.isActive || endsAtDate <= new Date()

	const canBid = isAuthenticated && !isOwner && !isClosed
	const highestBid = bids.length > 0 ? bids[0] : null

	const handleBidSubmit = async (
		event: React.FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault()
		setBidError('')

		if (!token) {
			setBidError('You must be logged in to place a bid.')
			return
		}

		const amount = Number(bidAmount)
		if (!Number.isFinite(amount) || amount <= price) {
			setBidError('Bid must be higher than the current price.')
			return
		}

		setIsSubmittingBid(true)
		try {
			await createBid(auctionId, { amount }, token)
			setBidAmount('')
			await loadDetails()
		} catch (err) {
			setBidError(
				err instanceof Error ? err.message : 'Failed to submit bid.',
			)
		} finally {
			setIsSubmittingBid(false)
		}
	}

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
						<li>Status: {isClosed ? 'Closed' : 'Open'}</li>
					</ul>
					{canBid ? (
						<form className="form" onSubmit={handleBidSubmit}>
							<label className="form-field">
								<span>Your bid (SEK)</span>
								<input
									type="number"
									min={Math.ceil(price + 1)}
									step="1"
									required
									value={bidAmount}
									onChange={(event) => setBidAmount(event.target.value)}
								/>
							</label>
							{bidError ? <p className="form-error">{bidError}</p> : null}
							<button
								className="form-button"
								type="submit"
								disabled={isSubmittingBid}
							>
								{isSubmittingBid ? 'Submitting...' : 'Place bid'}
							</button>
						</form>
					) : !isAuthenticated ? (
						<p>Log in to place a bid.</p>
					) : isOwner ? (
						<p>You cannot bid on your own auction.</p>
					) : (
						<p>Bidding is closed for this auction.</p>
					)}
				</div>
				<div>
					<h3>{isClosed ? 'Winning bid' : 'Bid history'}</h3>
					{isClosed ? (
						highestBid ? (
							<ul className="bid-list">
								<li>
									<span>{highestBid.amount} kr</span>
									<span>
										{new Date(highestBid.createdAt).toLocaleString()}
									</span>
								</li>
							</ul>
						) : (
							<p>No bids were placed.</p>
						)
					) : bids.length === 0 ? (
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
