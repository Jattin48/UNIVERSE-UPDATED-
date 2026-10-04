const nodemailer = require('nodemailer');
const dns = require('dns');

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const customIpv4Lookup = (hostname, options, callback) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...options, family: 4 }, callback);
};

const sendEmail = async ({ to, subject, html, text }) => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT) || 465;

  // Extract 6-digit OTP from html/text if present for fallback logging
  const otpMatch = (html || text || '').match(/\b\d{6}\b/);
  const extractedOtp = otpMatch ? otpMatch[0] : null;

  console.log(`[EMAIL DISPATCH] To: ${to} | OTP Code: ${extractedOtp || 'N/A'} | Subject: ${subject}`);

  // 1. Dev simulation if no credentials set
  if (!user || !pass) {
    console.log('====================================================');
    console.log(`[DEV EMAIL SIMULATION (NO NODEMAILER CREDS)]`);
    console.log(`TO: ${to}`);
    console.log(`OTP CODE FOR VERIFICATION: ${extractedOtp || 'N/A'}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('====================================================');
    return { simulated: true, otp: extractedOtp };
  }

  // 2. Nodemailer SMTP Transport
  try {
    const transporter = nodemailer.createTransport({
      host: host.includes('gmail') ? 'smtp.gmail.com' : host,
      port: port === 587 ? 587 : 465,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      lookup: customIpv4Lookup,
      connectionTimeout: 3000,
      greetingTimeout: 3000,
      socketTimeout: 5000,
      tls: {
        rejectUnauthorized: false,
        servername: 'smtp.gmail.com',
      },
    });

    const info = await transporter.sendMail({
      from: `"UNIVERSE College Discovery" <${user}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[NODEMAILER EMAIL SENT SUCCESS] MessageId: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.log('\n====================================================');
    console.log(`[NODEMAILER SMTP ERROR / RENDER FIREWALL BLOCK]: ${error.message}`);
    console.log(`[OTP CODE FOR VERIFICATION (${to})]: ${extractedOtp || 'Check User record'}`);
    console.log('====================================================\n');
    return { error: error.message, simulated: true, otp: extractedOtp };
  }
};

module.exports = sendEmail;
