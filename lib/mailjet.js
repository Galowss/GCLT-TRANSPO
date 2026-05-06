/**
 * Mailjet Email Service for GCLT Transport & Trucking Services
 * Uses Mailjet REST API v3.1 via the node-mailjet package.
 *
 * Environment Variables Required:
 *   MAILJET_API_KEY  – Mailjet public API key
 *   MAILJET_SECRET_KEY – Mailjet private/secret key
 */

import Mailjet from 'node-mailjet';

const SENDER_EMAIL = 'gclttruckingservices@yahoo.com';
const SENDER_NAME = 'GCLT Transport & Trucking Services';
const ADMIN_EMAIL = 'gclttruckingservices@yahoo.com';

// Lazy-init singleton so we only create a client when actually needed
let _client = null;

function getClient() {
  if (_client) return _client;
  const apiKey = process.env.MAILJET_API_KEY;
  const secretKey = process.env.MAILJET_SECRET_KEY;
  if (!apiKey || !secretKey) {
    throw new Error('MAILJET_API_KEY and MAILJET_SECRET_KEY must be set in environment variables');
  }
  _client = Mailjet.apiConnect(apiKey, secretKey);
  return _client;
}

/**
 * Send an email via Mailjet REST API v3.1
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.toName - Recipient name (optional)
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML body content
 * @returns {Promise<Object>} Mailjet response body
 */
export async function sendEmail({ to, toName = '', subject, html }) {
  const client = getClient();
  const response = await client.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: SENDER_EMAIL,
          Name: SENDER_NAME,
        },
        To: [
          {
            Email: to,
            Name: toName,
          },
        ],
        Subject: subject,
        HTMLPart: html,
      },
    ],
  });
  return response.body;
}

/**
 * Send email to GCLT admin inbox
 */
export async function sendAdminEmail({ subject, html }) {
  return sendEmail({
    to: ADMIN_EMAIL,
    toName: 'GCLT Admin',
    subject,
    html,
  });
}

export { SENDER_EMAIL, SENDER_NAME, ADMIN_EMAIL };
