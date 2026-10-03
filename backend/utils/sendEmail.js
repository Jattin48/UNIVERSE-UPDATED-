const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email credentials exist in environment variables
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = process.env.EMAIL_PORT || 587;

    if (!user || !pass) {
      console.log('====================================================');
      console.log(`[DEV EMAIL SIMULATION]`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`TEXT / CONTENT: ${text || html}`);
      console.log('====================================================');
      return { simulated: true };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from: `"UNIVERSE College Discovery" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[EMAIL SENT] MessageId: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    // Don't crash the server if SMTP fails, return error
    return { error: error.message };
  }
};

module.exports = sendEmail;
