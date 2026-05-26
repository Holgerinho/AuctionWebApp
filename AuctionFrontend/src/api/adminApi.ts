const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
if (!API_BASE_URL) {
	throw new Error('VITE_API_BASE_URL is not configured.')
}

type AdminUser = {
	id: number
	userName: string
	email: string
	role: string
	isActive: boolean
	createdAt: string
}

type AdminAuction = {
	id: number
	title: string
	description: string
	startingPrice: number
	currentPrice: number | null
	endsAt: string
	isActive: boolean
	userId: number
}

async function request(path: string, token: string, options: RequestInit = {}) {
	const response = await fetch(`${API_BASE_URL}${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...(options.headers ?? {}),
		},
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(text || 'Admin request failed.')
	}

	if (response.status === 204) {
		return null
	}

	return response.json()
}

async function getAdminUsers(token: string): Promise<AdminUser[]> {
	const data = await request('/api/admin/users', token)
	return data as AdminUser[]
}

async function deactivateUser(id: number, token: string): Promise<void> {
	await request(`/api/admin/users/${id}/deactivate`, token, { method: 'PUT' })
}

async function getAdminAuctions(token: string): Promise<AdminAuction[]> {
	const data = await request('/api/admin/auctions', token)
	return data as AdminAuction[]
}

async function deactivateAuction(id: number, token: string): Promise<void> {
	await request(`/api/admin/auctions/${id}/deactivate`, token, { method: 'PUT' })
}

export type { AdminAuction, AdminUser }
export { deactivateAuction, deactivateUser, getAdminAuctions, getAdminUsers }
