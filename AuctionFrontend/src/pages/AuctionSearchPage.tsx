import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	getAuctions,
	searchAuctions,
	searchClosedAuctions,
	type Auction,
} from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'

function AuctionSearchPage() {
	type AuctionSort =
		| 'endsAtAsc'
		| 'endsAtDesc'
		| 'priceAsc'
		| 'priceDesc'
		| 'titleAsc'

	const [query, setQuery] = useState('')
	const [auctions, setAuctions] = useState<Auction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')
	const [showClosed, setShowClosed] = useState(false)
	const [sortBy, setSortBy] = useState<AuctionSort>('endsAtAsc')

	const sortedAuctions = useMemo(() => {
		const copy = [...auctions]
		switch (sortBy) {
			case 'endsAtDesc':
				return copy.sort(
					(a, b) => new Date(b.endsAt).getTime() - new Date(a.endsAt).getTime(),
				)
			case 'priceAsc':
				return copy.sort(
					(a, b) =>
						(a.currentPrice ?? a.startingPrice) - (b.currentPrice ?? b.startingPrice),
				)
			case 'priceDesc':
				return copy.sort(
					(a, b) =>
						(b.currentPrice ?? b.startingPrice) - (a.currentPrice ?? a.startingPrice),
				)
			case 'titleAsc':
				return copy.sort((a, b) => a.title.localeCompare(b.title))
			case 'endsAtAsc':
			default:
				return copy.sort(
					(a, b) => new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
				)
		}
	}, [auctions, sortBy])

	const loadAuctions = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const trimmedQuery = query.trim()
			const data = showClosed
				? await searchClosedAuctions(trimmedQuery)
				: trimmedQuery
					? await searchAuctions(trimmedQuery)
					: await getAuctions()
			setAuctions(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load auctions.')
		} finally {
			setIsLoading(false)
		}
	}, [query, showClosed])

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void loadAuctions()
	}, [loadAuctions])

	const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		await loadAuctions()
	}

	return (
		<section className="app-section app-section--wide">
			<div className="section-header">
				<div>
					<h1>Auctions</h1>
					<p>Search and browse open auctions.</p>
				</div>
				<form className="search" onSubmit={handleSearch}>
					<input
						className="search-input"
						placeholder="Search by title or description"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<label className="search-toggle">
						<input
							type="checkbox"
							checked={showClosed}
							onChange={(event) => setShowClosed(event.target.checked)}
						/>
						<span>Show closed</span>
					</label>
					<select
						className="sort-select"
						value={sortBy}
						onChange={(event) => setSortBy(event.target.value as AuctionSort)}
					>
						<option value="endsAtAsc">Ending soon</option>
						<option value="endsAtDesc">Ending latest</option>
						<option value="priceAsc">Price low-high</option>
						<option value="priceDesc">Price high-low</option>
						<option value="titleAsc">Title A-Z</option>
					</select>
					<button className="form-button" type="submit" disabled={isLoading}>
						Search
					</button>
				</form>
			</div>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : sortedAuctions.length === 0 ? (
				<p>No auctions found.</p>
			) : (
				<div className="auction-grid">
					{sortedAuctions.map((auction) => (
						<AuctionCard key={auction.id} auction={auction} />
					))}
				</div>
			)}
		</section>
	)
}

export default AuctionSearchPage
