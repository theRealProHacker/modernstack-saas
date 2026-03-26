import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import { type DataModel } from './_generated/dataModel';
import { query } from './_generated/server';
import { betterAuth } from 'better-auth';
import { admin } from 'better-auth/plugins';
import authSchema from './betterAuth/schema';
import authConfig from './auth.config';

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel, typeof authSchema>(components.betterAuth, {
	local: { schema: authSchema }
});

export function createAuthOptions() {
	return {
		baseURL: siteUrl,
		user: {
			changeEmail: {
				enabled: true,
				sendChangeEmailVerification: async (
					{
						user,
						newEmail,
						url
					}: { user: { name?: string; email: string }; newEmail: string; url: string },
					_request: Request
				) => {
					const resendApiKey = process.env.RESEND_API_KEY;
					const from = process.env.RESET_EMAIL_FROM || 'ModernStack SaaS <no-reply@yourdomain.com>';
					if (!resendApiKey) {
						console.error('RESEND_API_KEY not set.');
						return;
					}
					await fetch('https://api.resend.com/emails', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${resendApiKey}`
						},
						body: JSON.stringify({
							from,
							to: user.email,
							subject: 'Approve email change',
							...(process.env.RESET_EMAIL_REPLY_TO
								? { reply_to: process.env.RESET_EMAIL_REPLY_TO }
								: {}),
							html: `<p>Hello ${user.name ?? 'there'},</p><p>Click to approve changing your email to <strong>${newEmail}</strong>:</p><p><a href="${url}">Approve Email Change</a></p>`
						})
					});
				}
			}
		},
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			sendResetPassword: async (
				{ user, url }: { user: { name?: string; email: string }; url: string },
				_request?: Request
			) => {
				const resendApiKey = process.env.RESEND_API_KEY;
				const from = process.env.RESET_EMAIL_FROM || 'ModernStack SaaS <no-reply@yourdomain.com>';
				if (!resendApiKey) {
					console.error('RESEND_API_KEY not set.');
					return;
				}
				await fetch('https://api.resend.com/emails', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendApiKey}` },
					body: JSON.stringify({
						from,
						to: user.email,
						subject: 'Reset your password',
						...(process.env.RESET_EMAIL_REPLY_TO
							? { reply_to: process.env.RESET_EMAIL_REPLY_TO }
							: {}),
						html: `<p>Hello ${user.name ?? 'there'},</p><p><a href="${url}">Reset Password</a></p>`
					})
				});
			}
		},
		socialProviders: {
			...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
				? {
						google: {
							clientId: process.env.GOOGLE_CLIENT_ID,
							clientSecret: process.env.GOOGLE_CLIENT_SECRET
						}
					}
				: {})
		},
		plugins: [admin()]
	};
}

export function createAuth(ctx: GenericCtx<DataModel>) {
	const options = createAuthOptions();
	return betterAuth({
		...options,
		database: authComponent.adapter(ctx),
		plugins: [...options.plugins, convex({ authConfig })]
	});
}

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		try {
			return await authComponent.getAuthUser(ctx);
		} catch {
			return null;
		}
	}
});
