import nodemailer from 'nodemailer';
import {
	SMTP_HOST,
	SMTP_PORT,
	SMTP_USER,
	SMTP_PASSWORD,
	SMTP_FROM
} from '$env/static/private';

const transporter = nodemailer.createTransport({
	host: SMTP_HOST,
	port: parseInt(SMTP_PORT),
	secure: parseInt(SMTP_PORT) === 465,
	auth: {
		user: SMTP_USER,
		pass: SMTP_PASSWORD
	}
});

export async function sendVerificationEmail(email: string, code: string) {
	await transporter.sendMail({
		from: SMTP_FROM,
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
