import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Auction } from '../api/auctionApi'
import { useAuth } from '../context/AuthContext'

type AuctionCardProps = {
	auction: Auction
}

function AuctionCard({ auction }: AuctionCardProps) {
	const { userId } = useAuth()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [modalIndex, setModalIndex] = useState(0)
	const price = auction.currentPrice ?? auction.startingPrice
	const startsAt = new Date(auction.startsAt).toLocaleString()
	const endsAt = new Date(auction.endsAt).toLocaleString()
	const imageUrls = auction.imageUrls ?? []
	const primaryImage = imageUrls[0] ?? null
	const isOwnAuction = userId !== null && auction.userId === userId
	const isLeadingBidder =
		userId !== null && auction.currentHighestBidUserId !== null && auction.currentHighestBidUserId === userId

	const openModalAt = (index: number) => {
		setModalIndex(index)
		setIsModalOpen(true)
	}

	const showPreviousImage = () => {
		setModalIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)
	}

	const showNextImage = () => {
		setModalIndex((prev) => (prev + 1) % imageUrls.length)
	}

	return (
		<>
			<article className={`auction-card${isModalOpen ? ' auction-card-modal-open' : ''}`}>
				{primaryImage ? (
					<button
						type="button"
						className="auction-card-image-button"
						onClick={() => openModalAt(0)}
					>
						<img
							className="auction-card-image"
							src={primaryImage}
							alt={`${auction.title} preview`}
						/>
					</button>
				) : (
					<div className="auction-card-image-placeholder">No image</div>
				)}
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

			{isModalOpen && imageUrls.length > 0 ? (
				<div className="image-modal-overlay" onClick={() => setIsModalOpen(false)}>
					<div className="image-modal" onClick={(event) => event.stopPropagation()}>
						<button
							type="button"
							className="image-modal-close"
							onClick={() => setIsModalOpen(false)}
							aria-label="Close image modal"
						>
							x
						</button>
						{imageUrls.length > 1 ? (
							<button
								type="button"
								className="image-modal-arrow image-modal-arrow-left"
								onClick={showPreviousImage}
								aria-label="Previous image"
							>
								{'<'}
							</button>
						) : null}
						<img
							className="image-modal-content"
							src={imageUrls[modalIndex]}
							alt={`${auction.title} image ${modalIndex + 1}`}
						/>
						{imageUrls.length > 1 ? (
							<button
								type="button"
								className="image-modal-arrow image-modal-arrow-right"
								onClick={showNextImage}
								aria-label="Next image"
							>
								{'>'}
							</button>
						) : null}
						<p className="image-modal-counter">
							{modalIndex + 1} / {imageUrls.length}
						</p>
					</div>
				</div>
			) : null}
		</>
	)
}

export default AuctionCard
