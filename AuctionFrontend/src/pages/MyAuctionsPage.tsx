import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyAuctions, getMyBidAuctions, type Auction } from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'
import { useAuth } from '../context/AuthContext'

function MyAuctionsPage() {
	type AuctionSort = 'endsAtDesc' | 'endsAtAsc' | 'priceDesc' | 'priceAsc' | 'titleAsc'

	const { token } = useAuth()
	const [myAuctions, setMyAuctions] = useState<Auction[]>([])
	const [bidAuctions, setBidAuctions] = useState<Auction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [sortBy, setSortBy] = useState<AuctionSort>('endsAtDesc')

	const sortAuctions = useCallback((items: Auction[]) => {
		const copy = [...items]
		switch (sortBy) {
			case 'endsAtAsc':
				return copy.sort(
					(a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
				)
			case 'priceDesc':
				return copy.sort(
					(a, b) =>
						(b.currentPrice ?? b.startingPrice) - (a.currentPrice ?? a.startingPrice),
				)
			case 'priceAsc':
				return copy.sort(
					(a, b) =>
						(a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice),
				)
			case 'titleAsc':
				return copy.sort((a, b) => a.title.localeCompare(b.title))
			case 'endsAtDesc':
			default:
				return copy.sort(
					(a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
				)
		}
	}, [sortBy])

	const sortedMyAuctions = useMemo(
		() => sortAuctions(myAuctions),
		[myAuctions, sortAuctions],
	)
	const sortedBidAuctions = useMemo(
		() => sortAuctions(bidAuctions),
		[bidAuctions, sortAuctions],
	)

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
			<div className="section-header">
				<div>
					<h1>My auctions</h1>
					<p>Your own auctions and the auctions you have bid on.</p>
				</div>
				<Link to="/auctions/create" className="button-link">
					Create auction
				</Link>
			</div>
			<div className="sort-row">
				<label className="search-toggle" htmlFor="my-auctions-sort">
					Sort
				</label>
				<select
					id="my-auctions-sort"
					className="sort-select"
					value={sortBy}
					onChange={(event) => setSortBy(event.target.value as AuctionSort)}
				>
					<option value="endsAtDesc">Ending latest</option>
					<option value="endsAtAsc">Ending soon</option>
					<option value="priceDesc">Price high-low</option>
					<option value="priceAsc">Price low-high</option>
					<option value="titleAsc">Title A-Z</option>
				</select>
			</div>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : (
				<>
					<h3>Your created auctions</h3>
					{sortedMyAuctions.length === 0 ? (
						<p>You have not created any auctions yet.</p>
					) : (
						<div className="auction-grid">
							{sortedMyAuctions.map((auction) => (
								<AuctionCard key={auction.id} auction={auction} />
							))}
						</div>
					)}

					<h3>Auctions you have bid on</h3>
					{sortedBidAuctions.length === 0 ? (
						<p>You have not placed bids yet.</p>
					) : (
						<div className="auction-grid">
							{sortedBidAuctions.map((auction) => (
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
