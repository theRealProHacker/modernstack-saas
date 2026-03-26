import { betterAuth } from 'better-auth';
import { createAuthOptions } from '../auth';

// Static instance for CLI schema generation — no Convex ctx needed
export const auth = betterAuth(createAuthOptions());
