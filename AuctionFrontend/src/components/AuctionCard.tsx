import { Link } from 'react-router-dom'
import type { Auction } from '../api/auctionApi'
import { useAuth } from '../context/AuthContext'

type AuctionCardProps = {
	auction: Auction
}

function AuctionCard({ auction }: AuctionCardProps) {
	const { userId } = useAuth()
	const price = auction.currentPrice ?? auction.startingPrice
	const startsAt = new Date(auction.startsAt).toLocaleString()
	const endsAt = new Date(auction.endsAt).toLocaleString()
	const isOwnAuction = userId !== null && auction.userId === userId
	const isLeadingBidder =
		userId !== null && auction.currentHighestBidUserId !== null && auction.currentHighestBidUserId === userId

	return (
		<article className="auction-card">
			<div>
				{isOwnAuction || isLeadingBidder ? (
					<div className="auction-card-badges">
						{isOwnAuction ? (
							<span className="auction-badge auction-badge-own">Your auction</span>
						) : null}
						{isLeadingBidder ? (
							<span className="auction-badge auction-badge-leading">Your bid is leading</span>
						) : null}
					</div>
				) : null}
				<h3>{auction.title}</h3>
				<p className="auction-card-description">{auction.description}</p>
			</div>
			<div className="auction-card-meta">
				<span>Current price: {price} kr</span>
				<span>Starts: {startsAt}</span>
				<span>Ends: {endsAt}</span>
			</div>
			<Link className="auction-card-link" to={`/auctions/${auction.id}`}>
				View details
			</Link>
		</article>
	)
}

export default AuctionCard
