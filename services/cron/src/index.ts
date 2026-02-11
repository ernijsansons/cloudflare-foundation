export interface Env {}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const cron = event.cron;
    if (cron === "0 * * * *") {
      console.log("Hourly cron:", new Date().toISOString());
    } else if (cron === "0 0 * * *") {
      console.log("Daily cron:", new Date().toISOString());
    }
  },
};
