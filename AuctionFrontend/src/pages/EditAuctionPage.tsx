import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getAuctionById, getBidsForAuction, updateAuction } from '../api/auctionApi'
import { useAuth } from '../context/AuthContext'

function toDateTimeLocal(dateString: string): string {
	const date = new Date(dateString)
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
	return localDate.toISOString().slice(0, 16)
}

function EditAuctionPage() {
	const { id } = useParams()
	const auctionId = Number(id)
	const navigate = useNavigate()
	const { token } = useAuth()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [startingPrice, setStartingPrice] = useState('')
	const [startsAt, setStartsAt] = useState('')
	const [endsAt, setEndsAt] = useState('')
	const [isActive, setIsActive] = useState(true)
	const [isLoading, setIsLoading] = useState(true)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [hasBids, setHasBids] = useState(false)
	const [error, setError] = useState('')

	const currentUserId = useMemo(() => {
		if (!token) {
			return null
		}
		try {
			const payload = JSON.parse(atob(token.split('.')[1])) as { sub?: string }
			return payload.sub ? Number(payload.sub) : null
		} catch {
			return null
		}
	}, [token])

	useEffect(() => {
		const loadAuction = async () => {
			if (!auctionId || !token) {
				setError('You must be logged in to edit an auction.')
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError('')
			try {
				const [auction, bids] = await Promise.all([
					getAuctionById(auctionId),
					getBidsForAuction(auctionId),
				])
				if (!currentUserId || auction.userId !== currentUserId) {
					setError('You can only edit your own auctions.')
					return
				}
				setHasBids(bids.length > 0)
				setTitle(auction.title)
				setDescription(auction.description)
				setStartingPrice(String(auction.startingPrice))
				setStartsAt(toDateTimeLocal(auction.startsAt))
				setEndsAt(toDateTimeLocal(auction.endsAt))
				setIsActive(auction.isActive)
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load auction.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadAuction()
	}, [auctionId, currentUserId, token])

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')

		if (!token) {
			setError('You must be logged in to edit an auction.')
			return
		}

		const priceValue = Number(startingPrice)
		if (!Number.isFinite(priceValue) || priceValue <= 0) {
			setError('Starting price must be greater than zero.')
			return
		}

		const startsAtIso = new Date(startsAt).toISOString()
		const endsAtIso = new Date(endsAt).toISOString()

		if (new Date(startsAtIso) >= new Date(endsAtIso)) {
			setError('Start date must be before end date.')
			return
		}

		setIsSubmitting(true)
		try {
			const updated = await updateAuction(
				auctionId,
				{
					title,
					description,
					startingPrice: priceValue,
					startsAt: startsAtIso,
					endsAt: endsAtIso,
					isActive,
				},
				token,
			)
			navigate(`/auctions/${updated.id}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to update auction.')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (isLoading) {
		return (
			<section className="app-section">
				<h1>Edit auction</h1>
				<p>Loading auction...</p>
			</section>
		)
	}

	return (
		<section className="app-section">
			<h1>Edit auction</h1>
			<p>
				Update your auction listing. {hasBids
					? 'Starting price is locked because bids exist.'
					: 'Starting price can be changed until the first bid.'}
			</p>
			<form className="form" onSubmit={handleSubmit}>
				<label className="form-field">
					<span>Title</span>
					<input
						type="text"
						required
						value={title}
						onChange={(event) => setTitle(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Description</span>
					<input
						type="text"
						required
						value={description}
						onChange={(event) => setDescription(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Starting price (SEK)</span>
					<input
						type="number"
						min="1"
						step="1"
						disabled={hasBids}
						value={startingPrice}
						onChange={(event) => setStartingPrice(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Starts at</span>
					<input
						type="datetime-local"
						required
						value={startsAt}
						onChange={(event) => setStartsAt(event.target.value)}
					/>
				</label>
				<label className="form-field">
					<span>Ends at</span>
					<input
						type="datetime-local"
						required
						value={endsAt}
						onChange={(event) => setEndsAt(event.target.value)}
					/>
				</label>
				<label className="form-checkbox">
					<input
						type="checkbox"
						checked={isActive}
						onChange={(event) => setIsActive(event.target.checked)}
					/>
					<span>Listing is active</span>
				</label>
				{error ? <p className="form-error">{error}</p> : null}
				<button className="form-button" type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save changes'}
				</button>
			</form>
		</section>
	)
}

export default EditAuctionPage
