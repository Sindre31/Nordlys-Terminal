import { test, expect, type Page } from '@playwright/test';

// Every primary tab, by its nav label.
const TABS = [
  'Markets',
  'Watchlist',
  'News',
  'Reports',
  'Alerts',
  'AI Portfolio',
  'Risk',
  'Currency',
  'Attribution',
  'Insider',
  'Backtest',
];

// Asserts the visible page is in a sane state: the error boundary hasn't tripped, and no
// fabricated-looking "NaN"/"undefined" leaked into the rendered text. With no /api backend under
// preview, missing data must render as "—" or a loading/awaiting message — never as NaN.
async function assertHealthyScreen(page: Page, where: string) {
  await expect(page.getByText('Something went wrong'), `error boundary tripped on ${where}`).toHaveCount(0);
  const body = (await page.locator('body').innerText()).replace(/ /g, ' ');
  expect(body, `"NaN" rendered on ${where}`).not.toMatch(/\bNaN\b/);
  expect(body, `"undefined" rendered on ${where}`).not.toMatch(/\bundefined\b/);
  expect(body, `"[object Object]" rendered on ${where}`).not.toContain('[object Object]');
}

test.describe('Nordlys Terminal smoke', () => {
  test('boots without crashing and shows the shell', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('NORDLYS', { exact: true })).toBeVisible();
    await assertHealthyScreen(page, 'initial load');
  });

  test('every tab renders cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('NORDLYS', { exact: true })).toBeVisible();
    for (const label of TABS) {
      await page.getByRole('button', { name: label, exact: true }).first().click();
      // Give the tab a beat to mount and any client fetch to settle into its empty/loading state.
      await page.waitForTimeout(250);
      await assertHealthyScreen(page, `${label} tab`);
    }
  });

  test('the data-status indicator is present in the header', async ({ page }) => {
    await page.goto('/');
    // With no backend the pipeline is "connecting" then "offline" — either way one of the known
    // status labels must render, proving the honesty badge is wired.
    await expect(
      page.getByText(/LIVE DATA|DATA DELAYED|DATA OFFLINE|CONNECTING…/),
    ).toBeVisible();
  });

  test('a watchlist row is keyboard-operable (Enter opens the detail)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Watchlist', exact: true }).first().click();
    await page.evaluate(() => localStorage.setItem('nordlys_watchlist', JSON.stringify(['EQNR'])));
    await page.reload();
    await page.getByRole('button', { name: 'Watchlist', exact: true }).first().click();
    // The row exposes itself as an actionable target (aria-label) and is focusable; Enter must
    // open the same detail dialog a mouse click would, proving keyboard parity.
    const row = page.getByRole('row', { name: 'Open EQNR details' });
    await expect(row).toBeVisible();
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await assertHealthyScreen(page, 'keyboard-opened stock detail');
  });

  test('opening a stock detail panel does not crash', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Watchlist', exact: true }).first().click();
    // Seed one symbol so the watchlist has a clickable row, then reload to render it.
    await page.evaluate(() => localStorage.setItem('nordlys_watchlist', JSON.stringify(['EQNR'])));
    await page.reload();
    await page.getByRole('button', { name: 'Watchlist', exact: true }).first().click();
    const row = page.getByText('EQNR', { exact: true }).first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      await page.waitForTimeout(250);
      await assertHealthyScreen(page, 'stock detail panel');
    }
  });
});
