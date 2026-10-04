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
  const resendApiKey = process.env.RESEND_API_KEY;

  // Extract 6-digit OTP from html/text if present for fallback logging
  const otpMatch = (html || text || '').match(/\b\d{6}\b/);
  const extractedOtp = otpMatch ? otpMatch[0] : null;

  // 1. Resend.com HTTPS API (Port 443 - Never blocked on Render)
  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'UNIVERSE <onboarding@resend.dev>',
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[RESEND HTTPS EMAIL SENT] ID: ${data.id} to ${to}`);
        return data;
      } else {
        console.error('[RESEND API ERROR]:', data);
      }
    } catch (err) {
      console.error('[RESEND FETCH ERROR]:', err.message);
    }
  }

  // 2. If no credentials provided, log simulated OTP
  if (!user || !pass) {
    console.log('====================================================');
    console.log(`[DEV EMAIL SIMULATION]`);
    console.log(`TO: ${to}`);
    console.log(`OTP CODE: ${extractedOtp || 'N/A'}`);
    console.log(`SUBJECT: ${subject}`);
    console.log('====================================================');
    return { simulated: true, otp: extractedOtp };
  }

  // 3. SMTP Transport with fast 5s connection timeout & fallback logging
  try {
    const transporter = nodemailer.createTransport({
      host: host.includes('gmail') ? 'smtp.gmail.com' : host,
      port: 465,
      secure: true,
      auth: {
        user,
        pass,
      },
      lookup: customIpv4Lookup,
      connectionTimeout: 5000, // 5 seconds fast timeout for cloud firewalls
      greetingTimeout: 5000,
      socketTimeout: 8000,
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

    console.log(`[EMAIL SENT VIA SMTP] MessageId: ${info.messageId} to ${to}`);
    return info;
  } catch (error) {
    console.error('====================================================');
    console.error(`[RENDER SMTP FIREWALL BLOCK DETECTED]: ${error.message}`);
    console.error(`[OTP LOG FOR ${to}]: ${extractedOtp || 'Check User record'}`);
    console.error('====================================================');
    return { error: error.message, simulated: true, otp: extractedOtp };
  }
};

module.exports = sendEmail;
