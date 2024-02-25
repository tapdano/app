import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

const rpName = 'TapDano';
const rpID = window.location.hostname;

export async function getRegistrationOptions() {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: '1',
    userName: 'TapDano Wallet',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'discouraged',
      authenticatorAttachment: 'cross-platform',
    },
  });
  return options;
}

export async function checkRegistrationResponse(attResp: any, expectedChallenge: string) {
  const expectedOrigin = window.location.origin;
  return await verifyRegistrationResponse({
    response: attResp,
    expectedChallenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: false
  });
}

export async function getAuthenticationOptions(id: BufferSource) {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'discouraged',
    allowCredentials: [{
      id: id,
      transports: ['nfc'],
      type: 'public-key'
    }]
  });
  return options;
}

export async function checkAuthenticationResponse(response: any, expectedChallenge: string, authenticator: any) {
  const expectedOrigin = window.location.origin;
  return await verifyAuthenticationResponse({
    response: response,
    expectedChallenge,
    expectedOrigin: expectedOrigin,
    expectedRPID: rpID,
    authenticator,
    requireUserVerification: false
  });
}
