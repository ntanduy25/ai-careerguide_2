import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User, UserRole } from "../types/user"
import { readStorage, writeStorage } from "../services/storage"

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (role?: UserRole, customUser?: User, authToken?: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() =>
    readStorage("career-guide:user", null),
  )
  const [token, setToken] = useState<string | null>(() =>
    readStorage("career-guide:token", null),
  )

  const login = (role: UserRole = "student", customUser?: User, authToken?: string) => {
    let next: User
    if (customUser) {
      next = customUser
    } else {
      next =
        role === "admin"
          ? {
              id: "admin-1",
              name: "Quản trị viên Kiểm duyệt (Admin)",
              email: "admin@aicareerguide.edu.vn",
              role,
            }
          : {
              id: "student-1",
              name: "Học sinh Trải nghiệm (Grade 12)",
              email: "student@aicareerguide.edu.vn",
              role,
              grade: 12,
            }
    }
    setUser(next)
    writeStorage("career-guide:user", next)
    if (authToken) {
      setToken(authToken)
      writeStorage("career-guide:token", authToken)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("career-guide:user")
    localStorage.removeItem("career-guide:token")
  }

  const value = useMemo(() => ({ user, token, login, logout }), [user, token])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
