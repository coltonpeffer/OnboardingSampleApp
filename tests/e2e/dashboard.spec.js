// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Onboarding Dashboard', () => {
  test('should display the dashboard heading', async ({ page }) => {
    await page.goto('/');

    // Verify the main heading is visible
    await expect(page.locator('h1')).toContainText('Onboarding Dashboard');
  });

  test('should show navigation tabs', async ({ page }) => {
    await page.goto('/');

    // Verify all navigation tabs are present
    await expect(page.locator('.tab')).toHaveCount(5);
    await expect(page.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Customer Info' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Data Mapping' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tenant Setup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
  });

  test('should display example customer in onboarding queue', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load and verify example customer is shown
    await expect(page.locator('.customer-card')).toBeVisible();
    await expect(page.locator('.customer-card h3')).toContainText('Acme Corporation');
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');

    // Click on Customer Info tab
    await page.getByRole('button', { name: 'Customer Info' }).click();
    
    // Verify placeholder content is shown
    await expect(page.locator('.placeholder h2')).toContainText('Customer Info');
  });

  test('should map customer client data to the platform schema', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Data Mapping' }).click();

    // Customer A: 10 clients mapped, MM/DD/YYYY normalised to ISO
    await expect(page.getByTestId('mapping-summary')).toContainText('0 with issues');
    await expect(page.getByTestId('mapping-preview')).toContainText('2023-01-15');

    // Customer B uses different columns and picklist codes
    await page.locator('select').selectOption({ label: 'XYZ Financial Services' });
    await expect(page.getByTestId('column-mapping')).toContainText('clientCode');
    await expect(page.getByTestId('mapping-summary')).toContainText('0 with issues');
  });
});
