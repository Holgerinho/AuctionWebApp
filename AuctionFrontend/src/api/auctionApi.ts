const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
if (!API_BASE_URL) {
	throw new Error('VITE_API_BASE_URL is not configured.')
}

type Auction = {
	id: number
	title: string
	description: string
	startingPrice: number
	currentPrice: number | null
	currentHighestBidUserId: number | null
	startsAt: string
	endsAt: string
	isActive: boolean
	userId: number
}

type Bid = {
	id: number
	amount: number
	createdAt: string
	userId: number
	auctionId: number
}

type CreateAuctionRequest = {
	title: string
	description: string
	startingPrice: number
	startsAt: string
	endsAt: string
}

type UpdateAuctionRequest = {
	title: string
	description: string
	startingPrice: number
	startsAt: string
	endsAt: string
	isActive: boolean
}

async function request<TResponse>(
	path: string,
	options: RequestInit = {},
): Promise<TResponse> {
	const response = await fetch(`${API_BASE_URL}${path}`, options)

	if (!response.ok) {
		const text = await response.text()
		const message = text || 'Request failed.'
		throw new Error(message)
	}

	return response.json() as Promise<TResponse>
}

async function getAuctions(): Promise<Auction[]> {
	return request<Auction[]>('/api/auctions')
}

async function searchAuctions(title: string): Promise<Auction[]> {
	const query = new URLSearchParams({ title }).toString()
	return request<Auction[]>(`/api/auctions/search?${query}`)
}

async function searchClosedAuctions(title: string): Promise<Auction[]> {
	const query = title ? new URLSearchParams({ title }).toString() : ''
	const path = query ? `/api/auctions/closed?${query}` : '/api/auctions/closed'
	return request<Auction[]>(path)
}

async function getAuctionById(id: number): Promise<Auction> {
	return request<Auction>(`/api/auctions/${id}`)
}

async function getBidsForAuction(auctionId: number): Promise<Bid[]> {
	return request<Bid[]>(`/api/auctions/${auctionId}/bids`)
}

async function getMyAuctions(token: string): Promise<Auction[]> {
	return request<Auction[]>('/api/auctions/mine', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

async function getMyBidAuctions(token: string): Promise<Auction[]> {
	return request<Auction[]>('/api/auctions/mine/bids', {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})
}

async function createAuction(
	payload: CreateAuctionRequest,
	token: string,
): Promise<Auction> {
	return request<Auction>('/api/auctions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	})
}

async function updateAuction(
	id: number,
	payload: UpdateAuctionRequest,
	token: string,
): Promise<Auction> {
	return request<Auction>(`/api/auctions/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	})
}

export type { Auction, Bid, CreateAuctionRequest, UpdateAuctionRequest }
export {
	createAuction,
	getAuctionById,
	getAuctions,
	getBidsForAuction,
	getMyBidAuctions,
	getMyAuctions,
	searchAuctions,
	searchClosedAuctions,
	updateAuction,
}
