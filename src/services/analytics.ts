import PostHog from 'posthog-react-native';

let client: PostHog | null = null;

export function initAnalytics() {
  const key = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  if (!key || key === 'your_posthog_key_here') return;
  client = new PostHog(key, { host: 'https://us.i.posthog.com' });
}

export function capture(event: string, properties?: Record<string, any>) {
  client?.capture(event, properties);
}
