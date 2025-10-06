const express = require('express');
const { RtcRole, RtcTokenBuilder } = require('agora-access-token');

const router = express.Router();

// POST /api/token
// body: { channel: string, uid?: string|number, role?: 'publisher'|'subscriber', expireSeconds?: number }
// Build a token using provided parameters. If individual privilege expirations are provided,
// we currently use the maximum of them as the overall privilege expiration because the
// npm builder exposes a single expireTs for RTC tokens.
router.post('/', (req, res) => {
  try {
    const {
      channel,
      uid,
      role = 'publisher',
      expireSeconds = 3600,
      joinChannelPrivilegeExpireInSeconds,
      pubAudioPrivilegeExpireInSeconds,
      pubVideoPrivilegeExpireInSeconds,
      pubDataStreamPrivilegeExpireInSeconds,
    } = req.body || {};
    if (!channel) {
      return res.status(400).json({ error: 'Missing channel' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) {
      return res.status(500).json({ error: 'Server missing AGORA_APP_ID/AGORA_APP_CERTIFICATE' });
    }

    const currentTs = Math.floor(Date.now() / 1000);
    const detailedExpirations = [
      joinChannelPrivilegeExpireInSeconds,
      pubAudioPrivilegeExpireInSeconds,
      pubVideoPrivilegeExpireInSeconds,
      pubDataStreamPrivilegeExpireInSeconds,
    ]
      .map((v) => (v === undefined || v === null ? undefined : Number(v)))
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));

    const chosenExpireSeconds = detailedExpirations.length > 0
      ? Math.max(...detailedExpirations)
      : Number(expireSeconds || 3600);

    const expireTs = currentTs + chosenExpireSeconds;
    const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

    const assignedUid = uid === undefined || uid === null || uid === '' ? 0 : uid;
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, assignedUid, rtcRole, expireTs);

    return res.json({ token, uid: assignedUid });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Token generation failed:', e);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

// Convenience GET for quick testing: /api/token?channel=xxx&uid=0
router.get('/', (req, res) => {
  try {
    const { channel, uid, role = 'publisher', expireSeconds = 3600 } = req.query || {};
    if (!channel) return res.status(400).json({ error: 'Missing channel' });

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    if (!appId || !appCertificate) return res.status(500).json({ error: 'Server missing AGORA_APP_ID/AGORA_APP_CERTIFICATE' });

    const currentTs = Math.floor(Date.now() / 1000);
    const expireTs = currentTs + Number(expireSeconds || 3600);
    const rtcRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
    const assignedUid = uid === undefined || uid === null || uid === '' ? 0 : uid;
    const token = RtcTokenBuilder.buildTokenWithUid(appId, appCertificate, channel, assignedUid, rtcRole, expireTs);
    return res.json({ token, uid: assignedUid });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Token generation failed (GET):', e);
    return res.status(500).json({ error: 'Token generation failed' });
  }
});

module.exports = router;


