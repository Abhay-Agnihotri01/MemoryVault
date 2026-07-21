export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Prevent multiple cron instances in development mode due to hot reloading
    if ((global as any).cronInitialized) {
      return;
    }
    (global as any).cronInitialized = true;
    
    console.log('[Cron] Initializing AI Tagging Background Worker...');
    
    const cron = await import('node-cron');
    const { processAiTaggingBatch } = await import('./lib/worker');

    // Run every 10 minutes
    cron.default.schedule('*/10 * * * *', async () => {
      console.log('[Cron] Waking up to process AI tags...');
      await processAiTaggingBatch();
    });
  }
}
