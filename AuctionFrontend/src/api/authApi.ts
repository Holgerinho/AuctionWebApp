const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string
if (!API_BASE_URL) {
	throw new Error('VITE_API_BASE_URL is not configured.')
}

type RegisterRequest = {
	userName: string
	email: string
	password: string
}

type LoginRequest = {
	userNameOrEmail: string
	password: string
}

type AuthResponse = {
	token: string
}

type ChangePasswordRequest = {
	currentPassword: string
	newPassword: string
}


async function request<TResponse>(
	path: string,
	options: RequestInit,
): Promise<TResponse> {
	const response = await fetch(`${API_BASE_URL}${path}`, options)

	if (!response.ok) {
		const text = await response.text()
		const message = text || 'Request failed.'
		throw new Error(message)
	}

	return response.json() as Promise<TResponse>
}

async function register(payload: RegisterRequest): Promise<AuthResponse> {
	return request<AuthResponse>('/api/auth/register', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})
}

async function login(payload: LoginRequest): Promise<AuthResponse> {
	return request<AuthResponse>('/api/auth/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})
}

async function changePassword(
	payload: ChangePasswordRequest,
	token: string,
): Promise<void> {
	await request<void>('/api/auth/change-password', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(payload),
	})
}

export type { ChangePasswordRequest, LoginRequest, RegisterRequest }
export { changePassword, login, register }
