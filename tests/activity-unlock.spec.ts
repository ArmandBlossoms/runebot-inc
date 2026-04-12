import { test, expect, Page } from '@playwright/test';

const DEFAULT_SKILLS = {
  attack: 1, strength: 1, defence: 1, hitpoints: 10, prayer: 1,
  ranged: 1, magic: 1, woodcutting: 1, fishing: 1, mining: 1,
  thieving: 1, runecrafting: 1, agility: 1, smithing: 1, slayer: 1,
};

function makeInitialSave(overrides: Record<string, unknown> = {}) {
  const now = Date.now();
  return {
    version: 1,
    gp: 0,
    prestigePoints: 0,
    totalEarned: 0,
    prestige: 0,
    bots: [{
      id: 'bot_test_1',
      name: 'TestBot123',
      tier: 'f2p',
      status: 'idle',
      skills: { ...DEFAULT_SKILLS },
      suspicion: 0,
      activity: null,
      heldGp: 0,
      bannedUntil: null,
      totalXp: 0,
      detectionCount: 0,
      breakUntil: null,
      createdAt: now,
    }],
    maxBotSlots: 1,
    unlockedActivities: ['wc_oaks', 'fish_lobsters', 'mine_iron', 'combat_cows'],
    purchasedUpgrades: [],
    purchasedPrestigeUpgrades: [],
    eventLog: [{ id: 'intro', timestamp: now, botId: null, botName: null,
      type: 'system', message: 'Welcome to RuneBot Inc.' }],
    lastSaveTime: now,
    lastTickTime: now,
    tutorialStep: 0,
    membersMonthlyBilling: now + 600000,
    ...overrides,
  };
}

// Inject a save into localStorage before page scripts execute
async function loadGameWithState(page: Page, saveData: Record<string, unknown>) {
  await page.addInitScript((data) => {
    localStorage.setItem('runebot_save_v1', JSON.stringify(data));
  }, saveData);
  await page.goto('/');
  await page.waitForSelector('.bot-card', { timeout: 8000 });
}

async function freshGame(page: Page) {
  await loadGameWithState(page, makeInitialSave());
}

async function freshGameWithGp(page: Page, gp: number, botOverrides: Record<string, unknown> = {}) {
  const save = makeInitialSave({ gp });
  if (Object.keys(botOverrides).length > 0) {
    (save.bots[0] as Record<string, unknown>) = { ...save.bots[0] as object, ...botOverrides };
  }
  await loadGameWithState(page, save);
}

async function goToUpgradesActivitiesTab(page: Page) {
  await page.locator('.nav-btn', { hasText: 'UPGRADES' }).click();
  await page.locator('.tab', { hasText: 'ACTIVITIES' }).click();
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Tier 2+ unlock UX — BotCard picker', () => {

  test('locked section appears in activity picker', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();
    await expect(page.locator('.locked-section-header')).toBeVisible();
  });

  test('multiple locked activities are listed', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();

    const cards = page.locator('.locked-activity');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(3);
  });

  test('locked activities show Members badge', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();

    const badge = page.locator('.locked-activity .req-badge.members').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('[Members]');
  });

  test('locked activities show Premium badge', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();

    const badge = page.locator('.locked-activity .req-badge.premium').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('[Premium]');
  });

  test('locked activities show skill requirements', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();

    const req = page.locator('.locked-activity .req-skills').first();
    await expect(req).toBeVisible();
    const text = await req.textContent();
    expect(text).toMatch(/\w+\s+\d+/);
  });

  test('UNLOCK buttons show cost and disabled text when broke', async ({ page }) => {
    await freshGame(page);
    await page.locator('.btn-assign').first().click();

    const disabled = page.locator('.btn-unlock[disabled]');
    await expect(disabled.first()).toBeVisible();
    const text = await disabled.first().textContent();
    expect(text).toBe('NEED MORE GP');
  });

  test('UNLOCK button enabled and works when player has GP', async ({ page }) => {
    await freshGameWithGp(page, 100000);
    await page.locator('.btn-assign').first().click();

    // NMZ costs 8k, green dragons 15k — both affordable at 100k
    const enabledBtn = page.locator('.btn-unlock:not([disabled])').first();
    await expect(enabledBtn).toBeVisible();
    await expect(enabledBtn).toHaveText('UNLOCK');

    const beforeCount = await page.locator('.locked-activity').count();
    await enabledBtn.click();
    const afterCount = await page.locator('.locked-activity').count();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('unlocked activity appears in available list when bot qualifies', async ({ page }) => {
    // Skills: 75 combat, members tier — qualifies for NMZ (requires attack/str/def 75, members)
    const save = makeInitialSave({ gp: 500000 });
    (save.bots[0] as Record<string, unknown>).skills = {
      ...DEFAULT_SKILLS, attack: 75, strength: 75, defence: 75, hitpoints: 75,
    };
    (save.bots[0] as Record<string, unknown>).tier = 'members';
    await loadGameWithState(page, save);

    await page.locator('.btn-assign').first().click();

    // Find NMZ in locked list
    const nmzCard = page.locator('.locked-activity', { hasText: 'Nightmare Zone' });
    await expect(nmzCard).toBeVisible();
    await nmzCard.locator('.btn-unlock').click();

    // NMZ should now appear in the available activities list
    const availableOpts = page.locator('.activity-opt .act-name');
    const names = await availableOpts.allTextContents();
    expect(names.some(n => n.includes('Nightmare Zone'))).toBe(true);
  });

});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('Tier 2+ unlock UX — UpgradeTree Activities tab', () => {

  test('Activities tab shows Members badge', async ({ page }) => {
    await freshGame(page);
    await goToUpgradesActivitiesTab(page);

    const badge = page.locator('.acct-badge.members').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('[Members]');
  });

  test('Activities tab shows Premium badge', async ({ page }) => {
    await freshGame(page);
    await goToUpgradesActivitiesTab(page);

    const badge = page.locator('.acct-badge.premium').first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('[Premium]');
  });

  test('Activities tab shows skill requirements', async ({ page }) => {
    await freshGame(page);
    await goToUpgradesActivitiesTab(page);

    const req = page.locator('.skill-req').first();
    await expect(req).toBeVisible();
    const text = await req.textContent();
    expect(text).toMatch(/\w+\s+\d+/);
  });

  test('Activities tab shows team badge for raid activities', async ({ page }) => {
    await freshGame(page);
    await goToUpgradesActivitiesTab(page);

    const badge = page.locator('.team-badge').first();
    await expect(badge).toBeVisible();
    const text = await badge.textContent();
    expect(text).toMatch(/\d+-bot team/);
  });

  test('UNLOCK button enabled and works on Activities tab', async ({ page }) => {
    await freshGameWithGp(page, 50000);
    await goToUpgradesActivitiesTab(page);

    // NMZ costs 8000 GP — should be affordable at 50k
    const nmzCard = page.locator('.upgrade-card', { hasText: 'Nightmare Zone' });
    await expect(nmzCard).toBeVisible();

    const btn = nmzCard.locator('.btn-buy');
    await expect(btn).toBeEnabled();
    await expect(btn).toHaveText('UNLOCK');

    await btn.click();
    await expect(nmzCard.locator('.upg-badge.owned')).toHaveText('UNLOCKED');
  });

});
