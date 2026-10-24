import cron from 'node-cron';
import { checkAllActiveStudentsForMonthlyCompletion } from '../services/notificationService.js';
import { getCurrentMonthAndYear } from '../utils/dateUtils.js';

/**
 * Initializes the background cron job to check active students' monthly class completion
 * and issue notifications.
 */
export function initMonthlyNotificationJob() {
  console.log('Initializing monthly notification background cron job...');

  // Run every hour at minute 0: '0 * * * *'
  const task = cron.schedule('0 * * * *', async () => {
    try {
      const { month, year } = getCurrentMonthAndYear();
      console.log(`[Cron Job] Checking monthly completion for ${month}/${year}...`);
      const generated = await checkAllActiveStudentsForMonthlyCompletion(month, year);
      if (generated.length > 0) {
        console.log(`[Cron Job] Generated ${generated.length} monthly completion notification(s).`);
      }
    } catch (err) {
      console.error('[Cron Job] Error in monthly notification job:', err.message);
    }
  });

  // Run once shortly after startup (after 5 seconds) to ensure any pending completions are detected
  setTimeout(async () => {
    try {
      const { month, year } = getCurrentMonthAndYear();
      const generated = await checkAllActiveStudentsForMonthlyCompletion(month, year);
      if (generated.length > 0) {
        console.log(`[Startup Check] Generated ${generated.length} completion notification(s).`);
      }
    } catch (err) {
      console.warn('[Startup Check] Could not run initial completion check:', err.message);
    }
  }, 5000);

  return task;
}
