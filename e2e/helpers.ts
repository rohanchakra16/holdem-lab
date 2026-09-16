import { Page, expect } from '@playwright/test';

export async function skipOnboarding(page: Page) {
  await page.goto('/');
  const skip = page.getByText('Skip — let me explore everything');
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  }
}

export async function startSession(page: Page, opts: { numPlayers?: string; mode?: 'Guided' | 'Free'; coaching?: string } = {}) {
  await page.goto('/play');
  if (opts.numPlayers) {
    await page.locator('select').nth(1).selectOption(opts.numPlayers);
  }
  if (opts.mode === 'Free') {
    await page.locator('select').first().selectOption('free');
  }
  if (opts.coaching) {
    await page.getByLabel('Coaching level').selectOption(opts.coaching).catch(() => {});
  }
  await page.getByRole('button', { name: 'Start Session' }).click();
  await expect(page.getByText(/Hand #1/)).toBeVisible({ timeout: 10000 });
}

/**
 * Drives the human seat with a simple policy until `stopWhen` returns true or
 * maxSteps is exhausted. Prefers check/call to keep hands alive toward
 * showdown; pass policy 'fold' to fold at the first opportunity instead.
 */
export async function driveHuman(page: Page, stopWhen: () => Promise<boolean>, policy: 'call' | 'fold' | 'allin' = 'call', maxSteps = 40) {
  for (let i = 0; i < maxSteps; i++) {
    if (await stopWhen()) return true;
    const foldBtn = page.getByRole('button', { name: 'Fold' });
    const checkBtn = page.getByRole('button', { name: 'Check' });
    const callBtn = page.getByRole('button', { name: /^Call \d+$/ });
    const allInBtn = page.getByRole('button', { name: /All-in \d+/ }).first();
    const dealNextBtn = page.getByRole('button', { name: 'Deal Next Hand' });
    const confirmBtn = page.getByRole('button', { name: 'Confirm & see feedback' });

    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    } else if (await dealNextBtn.isVisible().catch(() => false)) {
      await dealNextBtn.click();
    } else if (policy === 'fold' && (await foldBtn.isVisible().catch(() => false))) {
      await foldBtn.click();
    } else if (policy === 'allin' && (await allInBtn.isVisible().catch(() => false))) {
      await allInBtn.click();
    } else if (await checkBtn.isVisible().catch(() => false)) {
      await checkBtn.click();
    } else if (await callBtn.isVisible().catch(() => false)) {
      await callBtn.click();
    } else if (await foldBtn.isVisible().catch(() => false)) {
      // No check/call available (e.g. facing an all-in with no calling stack) — fold as a safe default.
      await foldBtn.click();
    }
    await page.waitForTimeout(350);
  }
  return stopWhen();
}
