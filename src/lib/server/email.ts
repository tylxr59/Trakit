import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: parseInt(env.SMTP_PORT || '587'),
	secure: parseInt(env.SMTP_PORT || '587') === 465,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASSWORD
	}
});

export async function sendVerificationEmail(email: string, code: string) {
	await transporter.sendMail({
		from: env.SMTP_FROM,
		to: email,
		subject: 'Verify your email - Trakit',
		text: `Your verification code is: ${code}\n\nThis code will expire in 15 minutes.`,
		html: `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h1 style="color: #6750a4;">Verify your email</h1>
				<p>Your verification code is:</p>
				<div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
					${code}
				</div>
				<p style="color: #666;">This code will expire in 15 minutes.</p>
			</div>
		`
	});
}
