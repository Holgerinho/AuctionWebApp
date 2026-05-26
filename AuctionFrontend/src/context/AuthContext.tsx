import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type AuthContextValue = {
	token: string | null
	isAuthenticated: boolean
	userId: number | null
	userName: string | null
	email: string | null
	role: string | null
	isAdmin: boolean
	login: (token: string) => void
	logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const storageKey = 'auctionwebapp_token'

type AuthProviderProps = {
	children: ReactNode
}

function AuthProvider({ children }: AuthProviderProps) {
	const [token, setToken] = useState<string | null>(() => {
		return localStorage.getItem(storageKey)
	})

	const tokenPayload = useMemo(() => {
		if (!token) {
			return null
		}
		try {
			return JSON.parse(atob(token.split('.')[1])) as {
				sub?: string
				email?: string
				role?: string
				'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
				'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string
				unique_name?: string
			}
		} catch {
			return null
		}
	}, [token])

	const userId = useMemo(() => {
		if (!tokenPayload?.sub) {
			return null
		}
		const value = Number(tokenPayload.sub)
		return Number.isFinite(value) ? value : null
	}, [tokenPayload])

	const userName = useMemo(() => {
		if (!tokenPayload) {
			return null
		}
		return (
			tokenPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
			tokenPayload.unique_name ??
			null
		)
	}, [tokenPayload])

	const email = useMemo(() => {
		if (!tokenPayload) {
			return null
		}
		return tokenPayload.email ?? null
	}, [tokenPayload])

	const role = useMemo(() => {
		if (!tokenPayload) {
			return null
		}
		return (
			tokenPayload.role ??
			tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
			null
		)
	}, [tokenPayload])

	const login = (newToken: string) => {
		localStorage.setItem(storageKey, newToken)
		setToken(newToken)
	}

	const logout = () => {
		localStorage.removeItem(storageKey)
		setToken(null)
	}

	const value = useMemo<AuthContextValue>(
		() => ({
			token,
			isAuthenticated: Boolean(token),
			userId,
			userName,
			email,
			role,
			isAdmin: role === 'Admin',
			login,
			logout,
		}),
		[token, userId, userName, email, role],
	)

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { AuthProvider, useAuth }
