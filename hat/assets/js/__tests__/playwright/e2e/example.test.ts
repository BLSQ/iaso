import { test, expect } from '@playwright/test';

// e2e testing needs the backend.

test('an example of e2e : create an user and login', async ({ page }) => {
  await page.goto(`/login/?next=${encodeURIComponent('/dashboard/home/')}`)
  await page.fill('input[name="username"]', process.env?.LOGIN_USERNAME ?? '')
  await page.fill('input[name="password"]', process.env?.LOGIN_PASSWORD ?? '')
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard/setupAccount');
  await expect(page).toHaveTitle(/Welcome/);

  // we fill in the form with a too simple password
  const username = `iaso${Math.random()}`
  await page.fill("input#input-text-account_name", "An account name")
  await page.fill("input#input-text-user_username", username)
  await page.fill("input#input-text-user_first_name", "Iaso first name")
  await page.fill("input#input-text-user_last_name", "Iaso last name")
  await page.fill("input#input-text-user_email", "test@test.com")

  await page.fill("input#input-text-password", "1234")

  await page.click('button[data-test="confirm-button"]');
  expect(page.getByRole('heading', {name: 'Account and profile created successfully, please logout and login again with the new profile.', level: 6})).toBeDefined()

  // we could go further on and check that if an user already exists , creating the same one would display an error on the UI
});