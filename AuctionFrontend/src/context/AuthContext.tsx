import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type AuthContextValue = {
	token: string | null
	isAuthenticated: boolean
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

	const role = useMemo(() => {
		if (!token) {
			return null
		}
		try {
			const payload = JSON.parse(atob(token.split('.')[1])) as {
				role?: string
				'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string
			}
			return (
				payload.role ??
				payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
				null
			)
		} catch {
			return null
		}
	}, [token])

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
			role,
			isAdmin: role === 'Admin',
			login,
			logout,
		}),
		[token, role],
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

export { AuthProvider, useAuth }
