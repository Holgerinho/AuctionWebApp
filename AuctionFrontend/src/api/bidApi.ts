const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
if (!API_BASE_URL) {
	throw new Error('VITE_API_BASE_URL is not configured.')
}

type CreateBidRequest = {
	amount: number
}

type BidResponse = {
	id: number
	amount: number
	createdAt: string
	userId: number
	auctionId: number
}

async function createBid(
	auctionId: number,
	payload: CreateBidRequest,
	token: string,
): Promise<BidResponse> {
	const response = await fetch(`${API_BASE_URL}/api/auctions/${auctionId}/bids`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		const text = await response.text()
		const message = text || 'Failed to submit bid.'
		throw new Error(message)
	}

	return response.json() as Promise<BidResponse>
}

export type { BidResponse, CreateBidRequest }
export { createBid }
