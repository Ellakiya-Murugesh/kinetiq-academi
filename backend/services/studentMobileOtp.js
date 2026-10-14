import { randomBytes } from 'node:crypto';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MSG91_API_BASE = 'https://control.msg91.com/api/v5/otp';

function providerError(code) {
  const error = new Error('MSG91 OTP request failed.');
  error.code = code;
  return error;
}

export function createStudentMobileOtpService({ provider, collection, getCollection, now = Date.now }) {
  const loadCollection = getCollection || (() => collection);
  if (!provider || (!getCollection && !collection)) {
    throw new Error('MSG91 provider and student mobile OTP storage are required.');
  }

  return {
    async request(user) {
      const collection = loadCollection();
      const currentTime = new Date(now());
      const previous = await collection.findOne({ _id: user.id });
      if (previous?.blockedUntil > currentTime) {
        return {
          status: 'locked',
          retryAfterSeconds: Math.max(1, Math.ceil((previous.blockedUntil - currentTime) / 1000)),
        };
      }
      const challengeId = randomBytes(32).toString('base64url');
      const phone = normalizePhone(user.phone);
      const challenge = {
        challengeId,
        phone,
        expiresAt: new Date(currentTime.getTime() + OTP_TTL_MS),
        resendUntil: new Date(currentTime.getTime() + RESEND_COOLDOWN_MS),
        attempts: 0,
        active: true,
      };

      let storedChallenge;
      try {
        storedChallenge = await collection.findOneAndUpdate(
          {
            _id: user.id,
            $or: [
              { resendUntil: { $lte: currentTime } },
              { resendUntil: { $exists: false } },
            ],
          },
          {
            $set: {
              ...challenge,
              ...(previous?.blockedUntil && previous.blockedUntil <= currentTime
                ? { failedAttempts: 0, blockedUntil: null }
                : {}),
            },
            $setOnInsert: { failedAttempts: 0 },
            $unset: { consumed: '', exhausted: '' },
          },
          { upsert: true, returnDocument: 'after', includeResultMetadata: false }
        );
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }

      if (!storedChallenge) {
        const existing = await collection.findOne({ _id: user.id });
        const retryAfterSeconds = existing?.resendUntil
          ? Math.max(1, Math.ceil((existing.resendUntil.getTime() - currentTime.getTime()) / 1000))
          : 60;
        return { status: 'cooldown', retryAfterSeconds };
      }

      try {
        await provider.sendOtp({ user, phone });
      } catch (error) {
        await collection.updateOne(
          { _id: user.id, challengeId },
          { $set: { active: false } }
        );
        return { status: 'delivery-failed', code: error?.code };
      }

      return { status: 'sent', challengeId };
    },

    async verify(user, phone, challengeId, code) {
      const collection = loadCollection();
      const normalizedPhone = normalizePhone(phone);
      const currentTime = new Date(now());
      const challenge = await collection.findOneAndUpdate(
        {
          _id: user.id,
          challengeId,
          phone: normalizedPhone,
          active: true,
          expiresAt: { $gt: currentTime },
          attempts: { $lt: MAX_ATTEMPTS },
        },
        { $inc: { attempts: 1 } },
        { returnDocument: 'after', includeResultMetadata: false }
      );
      if (!challenge) {
        const existing = await collection.findOne({ _id: user.id, challengeId });
        if (!existing || existing.phone !== normalizedPhone || !existing.active) {
          return { status: 'invalid' };
        }
        if (existing.expiresAt <= currentTime) {
          await collection.updateOne(
            { _id: user.id, challengeId, active: true },
            { $set: { active: false } }
          );
          return { status: 'expired' };
        }
        if (existing.attempts >= MAX_ATTEMPTS) return { status: 'too-many-attempts' };
        return { status: 'invalid' };
      }

      let verified;
      try {
        verified = await provider.verifyOtp({ phone: challenge.phone, code });
      } catch (error) {
        if (error?.code === 'MSG91_OTP_EXPIRED') {
          await collection.updateOne(
            { _id: user.id, challengeId, active: true },
            { $set: { active: false } }
          );
          return { status: 'expired' };
        }
        return {
          status: 'provider-failed',
          code: error?.code,
        };
      }

      if (!verified) {
        const failure = await collection.findOneAndUpdate(
          { _id: user.id, challengeId, active: true },
          { $inc: { failedAttempts: 1 } },
          { returnDocument: 'after', includeResultMetadata: false }
        );
        if (challenge.attempts >= MAX_ATTEMPTS) {
          const blockedUntil = new Date(currentTime.getTime() + OTP_TTL_MS);
          await collection.updateOne(
            { _id: user.id, challengeId, active: true, attempts: challenge.attempts },
            {
              $set: {
                active: false,
                exhausted: true,
                blockedUntil,
                expiresAt: blockedUntil,
              },
            }
          );
          return { status: 'too-many-attempts' };
        }
        if (failure?.failedAttempts >= MAX_ATTEMPTS) {
          const blockedUntil = new Date(currentTime.getTime() + OTP_TTL_MS);
          await collection.updateOne(
            { _id: user.id, challengeId, active: true },
            {
              $set: {
                active: false,
                exhausted: true,
                blockedUntil,
                expiresAt: blockedUntil,
              },
            }
          );
          return { status: 'too-many-attempts' };
        }
        return { status: 'incorrect' };
      }

      const consumed = await collection.updateOne(
        {
          _id: user.id,
          challengeId,
          active: true,
          attempts: challenge.attempts,
        },
        {
          $set: { active: false, consumed: true, failedAttempts: 0, blockedUntil: null },
        }
      );
      if (consumed.modifiedCount !== 1) return { status: 'invalid' };
      return { status: 'verified', user };
    },
  };
}

export function normalizePhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

async function readMsg91Response(response) {
  let body;
  try {
    body = await response.json();
  } catch {
    throw providerError('MSG91_MALFORMED_RESPONSE');
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw providerError('MSG91_MALFORMED_RESPONSE');
  }
  if (!response.ok || body.type === 'error') {
    if (/otp\s+expired/i.test(String(body.message || ''))) {
      throw providerError('MSG91_OTP_EXPIRED');
    }
    if (/otp\s+(not\s+match|does\s+not\s+match)/i.test(String(body.message || ''))) {
      throw providerError('MSG91_OTP_INVALID');
    }
    if (
      response.status === 401 ||
      response.status === 403 ||
      String(body.code) === '201' ||
      /auth.?key|unauthori[sz]ed|forbidden/i.test(String(body.message || ''))
    ) {
      throw providerError('MSG91_AUTH_FAILED');
    }
    if (response.status === 429) throw providerError('MSG91_RATE_LIMITED');
    if (response.status >= 500) throw providerError('MSG91_UNAVAILABLE');
    throw providerError('MSG91_REJECTED');
  }
  if (body.type !== 'success') throw providerError('MSG91_MALFORMED_RESPONSE');
  return body;
}

export function createMsg91OtpProvider({
  environment = () => process.env,
  fetchImplementation = (...args) => fetch(...args),
} = {}) {
  async function configuration() {
    const { MSG91_AUTH_KEY: authKey, MSG91_TEMPLATE_ID: templateId } = environment();
    if (!authKey?.trim() || !templateId?.trim()) {
      throw providerError('MSG91_NOT_CONFIGURED');
    }
    return { authKey: authKey.trim(), templateId: templateId.trim() };
  }

  async function request(url, authKey, options) {
    let response;
    try {
      response = await fetchImplementation(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          authkey: authKey,
          ...(options.headers || {}),
        },
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw providerError('MSG91_UNAVAILABLE');
    }
    return readMsg91Response(response);
  }

  return {
    async sendOtp({ phone }) {
      const { authKey, templateId } = await configuration();
      const mobile = normalizePhone(phone);
      if (!/^\d{10}$/.test(mobile)) throw providerError('MSG91_INVALID_MOBILE');

      const url = new URL(MSG91_API_BASE);
      url.searchParams.set('template_id', templateId);
      url.searchParams.set('mobile', `91${mobile}`);
      url.searchParams.set('otp_length', '6');
      url.searchParams.set('otp_expiry', '5');
      await request(url, authKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    },

    async verifyOtp({ phone, code }) {
      const { authKey } = await configuration();
      const mobile = normalizePhone(phone);
      if (!/^\d{10}$/.test(mobile) || !/^\d{6}$/.test(code)) return false;

      const url = new URL(`${MSG91_API_BASE}/verify`);
      url.searchParams.set('otp', code);
      url.searchParams.set('mobile', `91${mobile}`);
      try {
        await request(url, authKey, { method: 'GET' });
        return true;
      } catch (error) {
        if (error?.code === 'MSG91_OTP_INVALID') return false;
        throw error;
      }
    },
  };
}
