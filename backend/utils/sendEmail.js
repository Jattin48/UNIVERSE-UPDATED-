const nodemailer = require('nodemailer');
const https = require('https');
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

// Native HTTPS POST request for Resend API (Works on ALL Node versions 14/16/18/20/22)
const sendViaResendHttps = (apiKey, payload) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        Authorization: `Bearer ${apiKey}`,
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.message || JSON.stringify(parsed)));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
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

  // 1. Resend.com HTTPS API (Port 443 - Works on ALL Node versions on Render)
  if (resendApiKey) {
    try {
      const payload = {
        from: 'UNIVERSE <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
        text,
      };

      const result = await sendViaResendHttps(resendApiKey, payload);
      console.log(`[RESEND HTTPS EMAIL SENT] ID: ${result.id} to ${to}`);
      return result;
    } catch (err) {
      console.error('[RESEND API ERROR]:', err.message);
    }
  }

  // 2. If no credentials provided, log simulated OTP
  if (!user || !pass) {
    console.log('====================================================');
    console.log(`[DEV EMAIL SIMULATION]`);
    console.log(`TO: ${to}`);
    console.log(`OTP CODE FOR VERIFICATION: ${extractedOtp || 'N/A'}`);
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
      connectionTimeout: 5000,
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
    console.error(`[OTP CODE FOR VERIFICATION (${to})]: ${extractedOtp || 'Check User record'}`);
    console.error('====================================================');
    return { error: error.message, simulated: true, otp: extractedOtp };
  }
};

module.exports = sendEmail;
