import { NextResponse } from "next/server"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    const sql = getDb()

    // Create tables one by one
    await sql`
      CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          company VARCHAR(255),
          plan VARCHAR(50) DEFAULT 'monthly',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS device_codes (
          id SERIAL PRIMARY KEY,
          code VARCHAR(6) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS devices (
          id SERIAL PRIMARY KEY,
          device_id VARCHAR(255) UNIQUE NOT NULL,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          screen_name VARCHAR(255) NOT NULL,
          device_type VARCHAR(50) NOT NULL,
          platform VARCHAR(50) NOT NULL,
          api_key VARCHAR(255) UNIQUE NOT NULL,
          status VARCHAR(20) DEFAULT 'offline',
          location VARCHAR(255),
          resolution VARCHAR(20) DEFAULT '1920x1080',
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Insert demo user
    await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, company, plan) 
      VALUES (
          'demo@signagecloud.com', 
          '$2b$10$rQZ9QmZ9QmZ9QmZ9QmZ9Qu',
          'Demo', 
          'User', 
          'SignageCloud Demo', 
          'monthly'
      ) ON CONFLICT (email) DO NOTHING
    `

    // Get demo user ID
    const userResult = await sql`SELECT id FROM users WHERE email = 'demo@signagecloud.com'`
    const userId = userResult[0]?.id

    if (userId) {
      // Insert demo devices
      await sql`
        INSERT INTO devices (device_id, user_id, screen_name, device_type, platform, api_key, status, location, last_seen)
        VALUES 
            ('device_demo1', ${userId}, 'Lobby Display', 'firestick', 'android-tv', 'api_demo_key_1', 'online', 'Main Lobby', CURRENT_TIMESTAMP),
            ('device_demo2', ${userId}, 'Reception Desk', 'android-tv', 'android-tv', 'api_demo_key_2', 'online', 'Reception Area', CURRENT_TIMESTAMP - INTERVAL '2 minutes'),
            ('device_demo3', ${userId}, 'Cafeteria TV', 'web-browser', 'web', 'api_demo_key_3', 'offline', 'Employee Cafeteria', CURRENT_TIMESTAMP - INTERVAL '10 minutes')
        ON CONFLICT (device_id) DO NOTHING
      `
    }

    return NextResponse.json({
      success: true,
      message: "Database setup completed successfully",
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Database setup failed",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
