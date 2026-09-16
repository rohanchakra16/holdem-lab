import { test, expect } from '@playwright/test';
import { skipOnboarding, startSession, driveHuman } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test('completes a normal hand from preflop through to resolution', async ({ page }) => {
  await skipOnboarding(page);
  await startSession(page, { numPlayers: '2', mode: 'Free', coaching: 'No coaching until hand ends' });

  const reachedHand2 = await driveHuman(page, async () => (await page.getByText('Hand #2').count()) > 0, 'call', 60);
  expect(reachedHand2).toBe(true);
});

test('wins the pot uncontested when the human folds and everyone else has folded', async ({ page }) => {
  await skipOnboarding(page);
  await startSession(page, { numPlayers: '2', mode: 'Guided' });

  // In heads-up, folding once immediately ends the hand (only one other player).
  const foldBtn = page.getByRole('button', { name: 'Fold' });
  await expect(foldBtn).toBeVisible({ timeout: 10000 });
  await foldBtn.click();

  await expect(page.getByText('Hand complete.').or(page.getByRole('button', { name: 'Deal Next Hand' }))).toBeVisible({ timeout: 10000 });
});

test('reaches a showdown when both players check/call to the river', async ({ page }) => {
  await skipOnboarding(page);
  await startSession(page, { numPlayers: '2', mode: 'Free', coaching: 'No coaching until hand ends' });

  let sawShowdown = false;
  for (let hand = 0; hand < 6 && !sawShowdown; hand++) {
    await driveHuman(
      page,
      async () => {
        if (await page.getByText(/Showdown/).count()) {
          sawShowdown = true;
          return true;
        }
        return (await page.getByText(`Hand #${hand + 2}`).count()) > 0;
      },
      'call',
      30
    );
  }
  expect(sawShowdown).toBe(true);
});

test('a hand involving an all-in resolves without error', async ({ page }) => {
  await skipOnboarding(page);
  await startSession(page, { numPlayers: '3', mode: 'Free', coaching: 'No coaching until hand ends' });

  const reachedHand2 = await driveHuman(page, async () => (await page.getByText('Hand #2').count()) > 0, 'allin', 60);
  expect(reachedHand2).toBe(true);
  // No development-error banner and app is still responsive.
  await expect(page.getByText('Development')).toHaveCount(0);
});

test('a guided decision produces coach feedback grounded in real numbers', async ({ page }) => {
  await skipOnboarding(page);
  await startSession(page, { numPlayers: '2', mode: 'Guided' });

  const callBtn = page.getByRole('button', { name: /^Call \d+$/ });
  const checkBtn = page.getByRole('button', { name: 'Check' });
  if (await callBtn.isVisible().catch(() => false)) await callBtn.click();
  else await checkBtn.click();

  await expect(page.getByText('Coach feedback')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Position:/)).toBeVisible();
});

test('progress (completed lessons) persists after a reload', async ({ page }) => {
  await skipOnboarding(page);
  await page.goto('/learn/level-1/hand-rankings');
  await page.getByRole('button', { name: 'A flush (5 same-suit cards)' }).click();
  await page.getByRole('button', { name: 'Submit answer' }).click();
  await expect(page.getByText('Completed')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Completed')).toBeVisible();
});
