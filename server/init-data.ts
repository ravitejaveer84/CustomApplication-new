import { db } from './db';
import { applications } from '@shared/schema';

export async function initializeDatabase() {
  console.log('Initializing database with default data...');
  
  // Check if we already have applications
  const existingApps = await db.select().from(applications);
  
  if (existingApps.length === 0) {
    console.log('No applications found, creating default applications...');
    
    // Insert default applications
    await db.insert(applications).values([
      {
        name: "Reports",
        description: "Reporting application with various forms",
        icon: "bar-chart"
      },
      {
        name: "EDM",
        description: "Electronic Document Management",
        icon: "file-text"
      },
      {
        name: "US Custom",
        description: "US Customs application forms",
        icon: "clipboard-check"
      }
    ]);
    
    console.log('Default applications created successfully');
  } else {
    console.log(`Found ${existingApps.length} existing applications, skipping initialization`);
  }
}

// This function will be called from index.ts