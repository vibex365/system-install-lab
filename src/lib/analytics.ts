// Analytics placeholder — wire to PostHog / GA later
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    console.log(`[analytics] ${event}`, properties ?? {});
  }
}
