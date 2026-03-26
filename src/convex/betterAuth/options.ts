export function createAuthOptions() {
	return {
		// move everything from your betterAuth({...}) call here
		// EXCEPT the convex() plugin
		emailAndPassword: { enabled: true }
		// ... your plugins, socialProviders, etc.
	};
}
