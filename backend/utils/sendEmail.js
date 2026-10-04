const nodemailer = require('nodemailer');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

// Custom DNS lookup that strictly forces IPv4 resolution on cloud environments like Render
const customIpv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

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

    // Configure transport explicitly with custom IPv4 lookup to prevent ENETUNREACH IPv6 errors
    const transporter = nodemailer.createTransport({
      host: host.includes('gmail') ? 'smtp.gmail.com' : host,
      port: 465,
      secure: true, // SSL
      auth: {
        user,
        pass,
      },
      lookup: customIpv4Lookup, // Strictly force IPv4 IP address resolution
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false,
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
    console.error('Error sending email:', error.message || error);
    return { error: error.message };
  }
};

module.exports = sendEmail;
