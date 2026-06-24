require('dotenv').config();
const twilio = require('twilio');

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

console.log('Account SID:', TWILIO_ACCOUNT_SID);
console.log('From number:', TWILIO_PHONE_NUMBER);
console.log('Sending to: +919787202300');

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

client.messages.create({
  body: 'FoodieGo test OTP: 123456',
  from: TWILIO_PHONE_NUMBER,
  to: '+919787202300',
})
.then(msg => console.log('SUCCESS — SID:', msg.sid))
.catch(err => console.error('FAILED —', err.code, err.message));
