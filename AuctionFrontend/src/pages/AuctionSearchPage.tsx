import { useCallback, useEffect, useState } from 'react'
import {
	getAuctions,
	searchAuctions,
	type Auction,
} from '../api/auctionApi'
import AuctionCard from '../components/AuctionCard'

function AuctionSearchPage() {
	const [query, setQuery] = useState('')
	const [auctions, setAuctions] = useState<Auction[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState('')

	const loadAuctions = useCallback(async () => {
		setIsLoading(true)
		setError('')
		try {
			const data = query.trim()
				? await searchAuctions(query.trim())
				: await getAuctions()
			setAuctions(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load auctions.')
		} finally {
			setIsLoading(false)
		}
	}, [query])

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
						placeholder="Search by title"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
					/>
					<button className="form-button" type="submit" disabled={isLoading}>
						Search
					</button>
				</form>
			</div>
			{error ? <p className="form-error">{error}</p> : null}
			{isLoading ? (
				<p>Loading auctions...</p>
			) : auctions.length === 0 ? (
				<p>No auctions found.</p>
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

export default AuctionSearchPage
