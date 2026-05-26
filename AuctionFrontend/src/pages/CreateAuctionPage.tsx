import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAuction } from '../api/auctionApi'
import { useAuth } from '../context/AuthContext'

function CreateAuctionPage() {
	const navigate = useNavigate()
	const { token } = useAuth()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [startingPrice, setStartingPrice] = useState('')
	const [startsAt, setStartsAt] = useState('')
	const [endsAt, setEndsAt] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setError('')

		if (!token) {
			setError('You must be logged in to create an auction.')
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
			const auction = await createAuction(
				{
					title,
					description,
					startingPrice: priceValue,
					startsAt: startsAtIso,
					endsAt: endsAtIso,
				},
				token,
			)
			navigate(`/auctions/${auction.id}`)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create auction.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<section className="app-section">
			<h1>Create auction</h1>
			<p>Post a new auction listing.</p>
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
						required
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
				{error ? <p className="form-error">{error}</p> : null}
				<button className="form-button" type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Creating...' : 'Create auction'}
				</button>
			</form>
		</section>
	)
}

export default CreateAuctionPage
