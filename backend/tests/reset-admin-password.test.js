import assert from 'node:assert/strict';
import test from 'node:test';
import { getResetInput, validateResetTarget } from '../scripts/reset-admin-password.js';

const validEnvironment = {
  MONGODB_DB_NAME: 'kinetiqacademy_test',
  MONGODB_URI: 'mongodb+srv://test-user:test-password@test-cluster.example.mongodb.net/?retryWrites=true',
  ADMIN_RESET_CONFIRM_DATABASE: 'kinetiqacademy_test',
  ADMIN_RESET_CONFIRM_CLUSTER_HOST: 'test-cluster.example.mongodb.net',
  ADMIN_RESET_EMAIL: 'admin@gateprep.com',
  ADMIN_RESET_CONFIRM: 'admin@gateprep.com',
  ADMIN_RESET_PASSWORD: 'A-Unique-Test-Password-43',
};

test('manual password reset requires the exact test database and confirmed MongoDB host', () => {
  assert.doesNotThrow(() => validateResetTarget(validEnvironment));

  for (const environment of [
    { ...validEnvironment, MONGODB_DB_NAME: 'kinetiqacademy' },
    { ...validEnvironment, ADMIN_RESET_CONFIRM_DATABASE: 'kinetiqacademy' },
    { ...validEnvironment, ADMIN_RESET_CONFIRM_CLUSTER_HOST: 'another-cluster.example.mongodb.net' },
    { ...validEnvironment, MONGODB_URI: 'https://test-cluster.example.mongodb.net' },
    { ...validEnvironment, ADMIN_RESET_CONFIRM_CLUSTER_HOST: '' },
  ]) {
    assert.throws(() => validateResetTarget(environment), /Refusing password reset/);
  }
});

test('manual password reset validates account confirmation and password length', () => {
  assert.deepEqual(getResetInput(validEnvironment), {
    email: 'admin@gateprep.com',
    password: 'A-Unique-Test-Password-43',
  });
  assert.throws(
    () => getResetInput({ ...validEnvironment, ADMIN_RESET_CONFIRM: 'someone-else@example.com' }),
    /must match/
  );
  assert.throws(
    () => getResetInput({ ...validEnvironment, ADMIN_RESET_PASSWORD: 'Admin@12345' }),
    /between 12 and 72 bytes/
  );
});
