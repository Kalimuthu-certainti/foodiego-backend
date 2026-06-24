const { getClient } = require('../../../config/twilio');
const FROM = process.env.TWILIO_PHONE_NUMBER;

async function sendSms(phone, message) {
  const to = `+91${phone}`;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const client = getClient();
  console.log(`[SMS] Sending to ${to} from ${from}`);
  try {
    const result = await client.messages.create({ body: message, from, to });
    console.log(`[SMS] Sent OK — SID: ${result.sid}`);
    return result.sid;
  } catch (e) {
    console.error(`[SMS] Twilio error ${e.code}: ${e.message}`);
    const err = new Error('SMS could not be sent. Please check your number and try again.');
    err.status = 500;
    err.code = 'SMS_FAILED';
    throw err;
  }
}

module.exports = { sendSms };
