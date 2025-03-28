import { db } from './db';
import { applications } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Script to delete all applications in the database
 */
async function cleanupApplications() {
  try {
    console.log('Starting to delete applications...');
    
    // Get all existing applications
    const existingApps = await db.select().from(applications);
    console.log(`Found ${existingApps.length} applications to delete`);
    
    // Delete each application one by one
    for (const app of existingApps) {
      console.log(`Deleting application ID: ${app.id}, Name: ${app.name}`);
      
      // Delete the application
      await db.delete(applications).where(eq(applications.id, app.id));
      
      console.log(`Deleted application ID: ${app.id}`);
    }
    
    console.log('Successfully deleted all applications');
  } catch (error) {
    console.error('Error deleting applications:', error);
  }
}

// Run the cleanup function
cleanupApplications()
  .then(() => {
    console.log('Cleanup complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error);
    process.exit(1);
  });