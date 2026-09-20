import bcrypt from 'bcryptjs';
import { authorizeBasicHeader, credentialsConfigured } from './basic-auth';

describe('authorizeBasicHeader', () => {
  const passwordHash = bcrypt.hashSync('secret', 4);
  const header = `Basic ${Buffer.from('panel:secret').toString('base64')}`;

  it('accepts the configured user and password', async () => {
    await expect(
      authorizeBasicHeader(header, 'panel', passwordHash),
    ).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    await expect(
      authorizeBasicHeader(header, 'panel', bcrypt.hashSync('other', 4)),
    ).resolves.toBe(false);
  });

  it('rejects a missing or malformed header', async () => {
    await expect(
      authorizeBasicHeader(undefined, 'panel', passwordHash),
    ).resolves.toBe(false);
    await expect(
      authorizeBasicHeader('Bearer abc', 'panel', passwordHash),
    ).resolves.toBe(false);
    await expect(
      authorizeBasicHeader('Basic $$$', 'panel', passwordHash),
    ).resolves.toBe(false);
  });
});

describe('credentialsConfigured', () => {
  it('is true only when both values are present', () => {
    expect(credentialsConfigured('panel', '$2a$10$hash')).toBe(true);
    expect(
      credentialsConfigured(
        'panel',
        Buffer.from('$2b$10$hash').toString('base64'),
      ),
    ).toBe(true);
    expect(credentialsConfigured('', '$2a$10$hash')).toBe(false);
    expect(credentialsConfigured('panel', '')).toBe(false);
  });
});
