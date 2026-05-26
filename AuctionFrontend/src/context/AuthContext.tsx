import { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type AuthContextValue = {
	token: string | null
	isAuthenticated: boolean
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
			login,
			logout,
		}),
		[token],
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
