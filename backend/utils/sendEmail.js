const nodemailer = require('nodemailer');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = Number(process.env.EMAIL_PORT) || 465;

    if (!user || !pass) {
      console.log('====================================================');
      console.log(`[DEV EMAIL SIMULATION]`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`TEXT / CONTENT: ${text || html}`);
      console.log('====================================================');
      return { simulated: true };
    }

    // Force IPv4 (family: 4) to prevent ENETUNREACH IPv6 routing errors on Render
    let transportConfig;

    if (host.includes('gmail') || (user && user.toLowerCase().endsWith('@gmail.com'))) {
      transportConfig = {
        service: 'gmail',
        auth: {
          user,
          pass,
        },
        family: 4, // Force IPv4 resolution
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
      };
    } else {
      transportConfig = {
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        family: 4, // Force IPv4 resolution
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000,
        tls: {
          rejectUnauthorized: false,
        },
      };
    }

    const transporter = nodemailer.createTransport(transportConfig);

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
    console.error('Error sending email:', error.message || error);
    return { error: error.message };
  }
};

module.exports = sendEmail;
