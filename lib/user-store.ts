// In-memory user storage
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  company?: string
  password: string // In production, this would be hashed
  plan: string
  createdAt: Date
  isActive: boolean
}

interface Session {
  token: string
  userId: string
  expiresAt: Date
}

// In-memory stores
const users: Map<string, User> = new Map()
const sessions: Map<string, Session> = new Map()

// Demo user for testing
users.set("demo@signagecloud.com", {
  id: "demo-user-1",
  email: "demo@signagecloud.com",
  firstName: "Demo",
  lastName: "User",
  company: "SignageCloud Demo",
  password: "password123",
  plan: "monthly",
  createdAt: new Date(),
  isActive: true,
})

export class UserStore {
  static createUser(userData: {
    firstName: string
    lastName: string
    email: string
    company?: string
    password: string
    plan: string
  }): { success: boolean; message: string; user?: Omit<User, "password"> } {
    const { firstName, lastName, email, company, password, plan } = userData

    // Validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
      return { success: false, message: "All required fields must be filled" }
    }

    if (!email.includes("@") || !email.includes(".")) {
      return { success: false, message: "Please enter a valid email address" }
    }

    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long" }
    }

    // Check if user already exists
    if (users.has(email.toLowerCase())) {
      return { success: false, message: "An account with this email already exists" }
    }

    // Create new user
    const user: User = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company?.trim() || undefined,
      password, // In production, hash this
      plan,
      createdAt: new Date(),
      isActive: true,
    }

    users.set(user.email, user)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return {
      success: true,
      message: "Account created successfully",
      user: userWithoutPassword,
    }
  }

  static authenticateUser(
    email: string,
    password: string,
  ): {
    success: boolean
    message: string
    user?: Omit<User, "password">
    token?: string
  } {
    const user = users.get(email.toLowerCase())

    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    if (user.password !== password) {
      return { success: false, message: "Invalid email or password" }
    }

    if (!user.isActive) {
      return { success: false, message: "Account is deactivated" }
    }

    // Create session token
    const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 16)}`
    const session: Session = {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    }

    sessions.set(token, session)

    // Return user without password
    const { password: _, ...userWithoutPassword } = user
    return {
      success: true,
      message: "Login successful",
      user: userWithoutPassword,
      token,
    }
  }

  static validateToken(token: string): {
    valid: boolean
    user?: Omit<User, "password">
  } {
    const session = sessions.get(token)

    if (!session || session.expiresAt < new Date()) {
      if (session) sessions.delete(token) // Clean up expired session
      return { valid: false }
    }

    const user = Array.from(users.values()).find((u) => u.id === session.userId)
    if (!user || !user.isActive) {
      return { valid: false }
    }

    const { password: _, ...userWithoutPassword } = user
    return { valid: true, user: userWithoutPassword }
  }

  static getAllUsers(): Omit<User, "password">[] {
    return Array.from(users.values()).map(({ password, ...user }) => user)
  }

  static getUserCount(): number {
    return users.size
  }
}
