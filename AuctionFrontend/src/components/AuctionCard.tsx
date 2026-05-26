import { Link } from 'react-router-dom'
import type { Auction } from '../api/auctionApi'

type AuctionCardProps = {
	auction: Auction
}

function AuctionCard({ auction }: AuctionCardProps) {
	const price = auction.currentPrice ?? auction.startingPrice
	const endsAt = new Date(auction.endsAt).toLocaleString()

	return (
		<article className="auction-card">
			<div>
				<h3>{auction.title}</h3>
				<p className="auction-card-description">{auction.description}</p>
			</div>
			<div className="auction-card-meta">
				<span>Current price: {price} kr</span>
				<span>Ends: {endsAt}</span>
			</div>
			<Link className="auction-card-link" to={`/auctions/${auction.id}`}>
				View details
			</Link>
		</article>
	)
}

export default AuctionCard
