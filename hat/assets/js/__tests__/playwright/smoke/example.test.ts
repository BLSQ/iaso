import { test, expect } from '@playwright/test';

test('login page appears', async ({ page }) => {
  await page.goto('');

  await expect(page).toHaveURL(`/login/?next=${encodeURIComponent('/dashboard/home/')}`)
  await expect(page).toHaveTitle("IASO")
});

test('login works', async({page}) => {
  await page.goto(`/login/?next=${encodeURIComponent('/dashboard/home/')}`)
  await page.fill('input[name="username"]', process.env?.LOGIN_USERNAME ?? '')
  await page.fill('input[name="password"]', process.env?.LOGIN_PASSWORD ?? '')
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard/setupAccount');
  await expect(page).toHaveTitle(/Welcome/);
})
