import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAuction } from '../api/auctionApi'
import { useAuth } from '../context/AuthContext'

async function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(String(reader.result ?? ''))
		reader.onerror = () => reject(new Error('Could not read image file.'))
		reader.readAsDataURL(file)
	})
}

function CreateAuctionPage() {
	const navigate = useNavigate()
	const { token } = useAuth()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [startingPrice, setStartingPrice] = useState('')
	const [startsAt, setStartsAt] = useState('')
	const [endsAt, setEndsAt] = useState('')
	const [imageUrls, setImageUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState('')

	const handleBack = () => {
		if (window.history.length > 1) {
			navigate(-1)
			return
		}
		navigate('/my-auctions')
	}

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
					imageUrls,
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

	const handleImageFilesSelected = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const selectedFiles = Array.from(event.target.files ?? [])
		if (selectedFiles.length === 0) {
			return
		}

		try {
			const encoded = await Promise.all(
				selectedFiles
					.filter((file) => file.type.startsWith('image/'))
					.map((file) => readFileAsDataUrl(file)),
			)
			setImageUrls((prev) => [...prev, ...encoded].slice(0, 8))
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load image files.')
		} finally {
			event.target.value = ''
		}
	}

	const removeImage = (index: number) => {
		setImageUrls((prev) => prev.filter((_, i) => i !== index))
	}

	return (
		<section className="app-section">
			<div className="detail-title-row">
				<h1>Create auction</h1>
				<button
					type="button"
					className="button-link button-link-icon"
					onClick={handleBack}
					aria-label="Go back"
					title="Go back"
				>
					<span className="back-arrow" aria-hidden="true" />
				</button>
			</div>
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
					<span>Images (up to 8)</span>
					<input
						type="file"
						accept="image/*"
						multiple
						onChange={handleImageFilesSelected}
					/>
				</label>
				{imageUrls.length > 0 ? (
					<div className="image-preview-grid">
						{imageUrls.map((url, index) => (
							<div key={`${url}-${index}`} className="image-preview-item">
								<img src={url} alt={`Auction upload ${index + 1}`} />
								<button
									type="button"
									className="image-remove-button"
									onClick={() => removeImage(index)}
								>
									Remove
								</button>
							</div>
						))}
					</div>
				) : null}
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
