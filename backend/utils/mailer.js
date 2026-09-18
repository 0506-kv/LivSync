const nodemailer = require('nodemailer');

let transporter = null;

// Built on first use so a missing mail password breaks sending, never boot.
function getTransporter() {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    return transporter;
}

function sendOtpEmail(to, name, code, minutes) {
    return getTransporter().sendMail({
        from: `LivSync <${process.env.EMAIL_USER}>`,
        to,
        subject: `${code} is your LivSync verification code`,
        text: `Hi ${name},\n\nYour LivSync verification code is ${code}. It expires in ${minutes} minutes.\n\nIf you did not ask for this, you can ignore this email.`,
        html: `
            <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
                <h1 style="margin:0 0 16px;font-size:20px">Verify your email</h1>
                <p style="margin:0 0 20px;color:#475569">Hi ${name}, use this code to verify your LivSync account.</p>
                <p style="margin:0 0 20px;font-size:32px;font-weight:700;letter-spacing:8px">${code}</p>
                <p style="margin:0 0 20px;color:#475569">The code expires in ${minutes} minutes.</p>
                <p style="margin:0;font-size:13px;color:#94a3b8">If you did not ask for this, you can ignore this email.</p>
            </div>
        `,
    });
}

module.exports = { sendOtpEmail };
