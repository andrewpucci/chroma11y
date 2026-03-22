import { test, expect, type Locator, type Page } from '@playwright/test';

import { waitForAppReady } from './test-utils';

const MOBILE_VIEWPORT = { width: 375, height: 667 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };
const CONSTRAINTS_STRESS_URL =
  '/?c=5EF784&w=0.3248594550285707&cm=1&nc=11&np=11&x1=0.051321676757362183&y1=0.004851207759473985&x2=0.42340057930761144&y2=0.34015135409351716&m=auto&ls=0&hs=10&lr=n%3A0&hr=n%3A10&ln=1%3A-0.02%2C3%3A-0.05%2C6%3A0.03%2C7%3A0.09&hn=0%3A-0.07264820944828898%2C2%3A2%2C7%3A-6%2C8%3A-8%2C9%3A-10%2C10%3A4&scn=1%3A0.015000000000000003%2C2%3A0.035%2C3%3A0.010000000000000002%2C9%3A0.034999999999999996&psn=0%3A0.0003619014865836823%2C2%3A-0.03%2C8%3A0.03%2C9%3A0.0225%2C10%3A0.0225&t=light&os=2&ct=W3siaWQiOiJjb25zdHJhaW50LTE3NzQwNzM1OTAwNDUtMSIsInR5cGUiOiJ0YXJnZXQtY29sb3IiLCJlbmFibGVkIjp0cnVlLCJ0YXJnZXRIZXgiOiIjNUVGNzg0IiwibXVzdFBhc3MiOnRydWUsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3MzY0OTA2My0yIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiMxODE4MTgiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3Mzc0ODIyNi01IiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiM1M0Q3REQiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3NDI0NzExNy0xIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiNGRUQ3MzMiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3NDI5NTc2Mi0yIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiNGRkVBN0EiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3NDUwNzIzMS0xIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiNGMTc0NTEiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3NDUzOTg1NS0xIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiNFQzk1QTkiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDA3NDgxMzc0Ny0xIiwidHlwZSI6ImNvbnRyYXN0LXJ1bGUiLCJlbmFibGVkIjp0cnVlLCJzY29wZSI6ImFsbC1wYWxldHRlcyIsInN0ZXBJbmRleCI6NywicmVmZXJlbmNlIjoibG93IiwiYWxnb3JpdGhtIjoiV0NBRyIsImxldmVsIjoid2NhZ0FBIiwiZml0VG9UaHJlc2hvbGQiOnRydWV9LHsiaWQiOiJjb25zdHJhaW50LTE3NzQwNzQ4NDk1NDQtMiIsInR5cGUiOiJjb250cmFzdC1ydWxlIiwiZW5hYmxlZCI6dHJ1ZSwic2NvcGUiOiJhbGwtcGFsZXR0ZXMiLCJzdGVwSW5kZXgiOjYsInJlZmVyZW5jZSI6ImxvdyIsImFsZ29yaXRobSI6IldDQUciLCJsZXZlbCI6IndjYWdUaHJlZVRvT25lIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDE0MTExNTQ3OS0xIiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiNFOEU4RTgiLCJtdXN0UGFzcyI6dHJ1ZSwibWV0cmljIjoib2sifSx7ImlkIjoiY29uc3RyYWludC0xNzc0MTQxMTQ4MjgzLTMiLCJ0eXBlIjoidGFyZ2V0LWNvbG9yIiwiZW5hYmxlZCI6dHJ1ZSwidGFyZ2V0SGV4IjoiI0M1QzVDNSIsIm11c3RQYXNzIjp0cnVlLCJtZXRyaWMiOiJvayJ9LHsiaWQiOiJjb25zdHJhaW50LTE3NzQxNDExNjQ5MzAtNCIsInR5cGUiOiJ0YXJnZXQtY29sb3IiLCJlbmFibGVkIjp0cnVlLCJ0YXJnZXRIZXgiOiIjOEI4QjhCIiwibXVzdFBhc3MiOnRydWUsIm1ldHJpYyI6Im9rIn0seyJpZCI6ImNvbnN0cmFpbnQtMTc3NDE0MTE4Mjk4OS01IiwidHlwZSI6InRhcmdldC1jb2xvciIsImVuYWJsZWQiOnRydWUsInRhcmdldEhleCI6IiM1RDVENUQiLCJtdXN0UGFzcyI6ZmFsc2UsIm1ldHJpYyI6Im9rIn1d&sa=eyJiYXNlQ29sb3IiOiIjNUVGNzg0Iiwid2FybXRoIjotNi45NDQ1ODgxNDM4MzUxNjYsImNocm9tYU11bHRpcGxpZXIiOjEsIngxIjowLjEwNDk5MTIzOTE2NzkxMjk4LCJ5MSI6MC4wMDMxOTgxNzIyMDc3MDgyOTE1LCJ4MiI6MC4zMjI1NDM2MDAzMjY2NDE1MywieTIiOjAuMzI2MzY2OTc3OTQyNzk1OTUsImxpZ2h0bmVzc051ZGdlcnMiOltdLCJodWVOdWRnZXJzIjpbXSwic3RlcFNhdHVyYXRpb25OdWRnZXJzIjpbXSwicGFsZXR0ZVNhdHVyYXRpb25OdWRnZXJzIjpbXX0&cs=eyJzb2x2ZWRBdCI6MTc3NDIwODU0MjcxNiwicGFzc0NvdW50Ijo3LCJ3YXJuaW5nQ291bnQiOjIsImZhaWxDb3VudCI6NCwicmVxdWlyZWRTYXRpc2ZpZWRDb3VudCI6MywicmVxdWlyZWRVbnNhdGlzZmllZENvdW50IjoxLCJhcHBsaWVkIjp0cnVlLCJjaGFuZ2VkIjp0cnVlLCJzY29yZUJlZm9yZSI6ODUuMDMzOTUxMTMzMzc5NzIsInNjb3JlQWZ0ZXIiOjM2LjI2MTQwNjUzNzA3MjQsInByb2ZpbGUiOiJkZWVwIiwic291cmNlIjoiY2xpZW50IiwiZHVyYXRpb25NcyI6MzIwNDM3LCJldmFsQ291bnQiOjE0Njk4LCJidWRnZXRIaXQiOmZhbHNlfQ';

async function openMobileApp(page: Page): Promise<void> {
  await openApp(page, MOBILE_VIEWPORT);
}

async function openDesktopApp(page: Page): Promise<void> {
  await openApp(page, DESKTOP_VIEWPORT);
}

async function openApp(page: Page, viewport: { width: number; height: number }): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await waitForAppReady(page);
}

async function expectMinimumTouchTarget(locator: Locator, minimumSize: number): Promise<void> {
  const box = await locator.boundingBox();

  expect(box).toBeTruthy();
  expect(box!.width).toBeGreaterThanOrEqual(minimumSize);
  expect(box!.height).toBeGreaterThanOrEqual(minimumSize);
}

test.describe('Mobile Responsiveness', () => {
  test('stacks the sidebar above palettes and keeps controls full width on mobile', async ({
    page
  }) => {
    await openMobileApp(page);

    const layout = page.getByTestId('app-layout');
    const sidebar = page.getByTestId('app-sidebar');

    const gridTemplateColumns = await layout.evaluate(
      (el) => getComputedStyle(el).gridTemplateColumns
    );
    const layoutBox = await layout.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    const layoutPadding = await layout.evaluate((el) => {
      const style = getComputedStyle(el);
      return parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    });

    expect(gridTemplateColumns.trim().split(' ')).toHaveLength(1);
    expect(layoutBox).toBeTruthy();
    expect(sidebarBox).toBeTruthy();

    const availableWidth = layoutBox!.width - layoutPadding;
    expect(sidebarBox!.width).toBeGreaterThanOrEqual(availableWidth - 2);
    expect(sidebarBox!.width).toBeLessThanOrEqual(availableWidth + 2);
  });

  test('defaults all compact control panels to collapsed so palettes are visible sooner', async ({
    page
  }) => {
    await openMobileApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const contrastCard = page.getByTestId('contrast-controls-card');
    const outputCard = page.getByTestId('output-controls-card');
    const exportCard = page.getByTestId('export-controls-card');

    await expect(generationCard).toHaveJSProperty('open', false);
    await expect(contrastCard).toHaveJSProperty('open', false);
    await expect(outputCard).toHaveJSProperty('open', false);
    await expect(exportCard).toHaveJSProperty('open', false);

    await expect(
      page.getByTestId('neutral-palette').getByRole('heading', {
        level: 2,
        name: 'Neutral Palette',
        exact: true
      })
    ).toBeVisible();
  });

  test('keeps desktop sections always visible and non-collapsible', async ({ page }) => {
    await openDesktopApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const contrastCard = page.getByTestId('contrast-controls-card');
    const outputCard = page.getByTestId('output-controls-card');
    const exportCard = page.getByTestId('export-controls-card');

    await expect(generationCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(contrastCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(outputCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(exportCard.locator(':scope > summary.card-summary')).toHaveCount(0);
    await expect(page.locator('#baseColorHex')).toBeVisible();
  });

  test('keeps controls usable after expanding and collapsing cards on mobile', async ({ page }) => {
    await openMobileApp(page);

    const generationCard = page.getByTestId('generation-controls-card');
    const generationSummary = generationCard.locator(':scope > summary.card-summary');

    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', true);
    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', false);
    await generationSummary.click();
    await expect(generationCard).toHaveJSProperty('open', true);

    const baseColorInput = page.getByRole('textbox', { name: 'Base color hex value' });
    await expect(baseColorInput).toBeVisible();
    await baseColorInput.fill('#33aa66');
    await baseColorInput.blur();
    await expect(baseColorInput).toHaveValue('#33aa66');

    await generationSummary.focus();
    await page.keyboard.press('Enter');
    await expect(generationCard).toHaveJSProperty('open', false);
  });

  test('keeps primary mobile touch targets comfortably sized', async ({ page }) => {
    await openMobileApp(page);

    await page
      .getByTestId('generation-controls-card')
      .locator(':scope > summary.card-summary')
      .click();
    await page.getByTestId('generation-advanced-group').locator('summary').click();
    await page.getByTestId('export-controls-card').locator(':scope > summary.card-summary').click();

    await expectMinimumTouchTarget(page.locator('input[type="color"]'), 24);
    await expectMinimumTouchTarget(
      page.getByRole('button', { name: 'Export JSON design tokens' }),
      24
    );
    await expectMinimumTouchTarget(page.locator('.color-swatch').first(), 44);

    const sliderTargets = page.locator('.bezier-editor [role="slider"]');
    await expect(sliderTargets).toHaveCount(2);

    for (let index = 0; index < (await sliderTargets.count()); index += 1) {
      await expectMinimumTouchTarget(sliderTargets.nth(index), 24);
    }
  });

  test('wraps the neutral swatch grid on mobile', async ({ page }) => {
    await openMobileApp(page);

    const swatches = page.getByTestId('neutral-palette').locator('.neutral-grid').first();
    const flexWrap = await swatches.evaluate((el) => getComputedStyle(el).flexWrap);

    expect(flexWrap).toBe('wrap');
  });

  test('shows a health-aware constraints summary and keeps the dense list single-column on mobile', async ({
    page
  }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto(CONSTRAINTS_STRESS_URL);
    await waitForAppReady(page);

    const constraintsCard = page.getByTestId('constraints-controls-card');
    const constraintsSummary = constraintsCard.locator(':scope > summary.card-summary');

    await expect(constraintsCard).toHaveJSProperty('open', false);
    await expect(constraintsSummary).toContainText('4 fail');
    await expect(constraintsSummary).toContainText('2 warning');
    await expect(constraintsSummary).toContainText('1 required unsatisfied');
    await expect(page.locator('.constraint-editor')).toHaveCount(0);

    await constraintsSummary.click();
    const firstRowToggle = page.locator('.constraint-row button[aria-controls]').first();
    await expect(firstRowToggle).toBeVisible();
    await firstRowToggle.click();
    await expect(firstRowToggle).toHaveAttribute('aria-expanded', 'true');
    const expandedEditor = page.locator('.constraint-editor').first();
    const editorGrid = expandedEditor.locator('.editor-grid').first();

    await expect(expandedEditor).toBeVisible();
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(375);
    await expect
      .poll(async () =>
        editorGrid.evaluate(
          (el) => getComputedStyle(el).gridTemplateColumns.trim().split(/\s+/).length
        )
      )
      .toBe(1);
  });
});
