import { db } from './db';
import { users } from '@shared/schema';
import { hash } from 'bcrypt';

export async function initializeDatabase() {
  console.log('Initializing database with default data...');
  
  // Check if we already have any users
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    console.log('No users found, creating default admin user...');
    
    // Create hashed password for default admin
    const hashedPassword = await hash('admin123', 10);
    
    // Insert default admin user
    await db.insert(users).values({
      username: "admin",
      password: hashedPassword,
      role: "admin",
      email: "admin@example.com",
      name: "Administrator"
    });
    
    console.log('Default admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
  } else {
    console.log(`Found ${existingUsers.length} existing users, skipping initialization`);
  }
}

// This function will be called from index.ts