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

  test('should list every customer in the onboarding queue', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load and verify all customers are shown
    await expect(page.locator('.customer-card')).toHaveCount(4);
    await expect(page.locator('.customer-card h3').first()).toContainText('Acme Corporation');
  });

  test('should show one customer at a time', async ({ page }) => {
    await page.goto('/');

    // First customer is selected by default
    await expect(page.getByTestId('customer-detail')).toContainText('Acme Corporation');

    await page.locator('.customer-card', { hasText: 'XYZ Financial Services' }).click();
    await expect(page.getByTestId('customer-detail')).toContainText('XYZ Financial Services');
    await expect(page.getByTestId('customer-detail')).not.toContainText('Acme Corporation');
    await expect(page.getByTestId('customer-detail')).toContainText('not created');
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/');

    // Click on Customer Info tab
    await page.getByRole('button', { name: 'Customer Info' }).click();
    
    // Verify the Customer Info tab content is shown
    await expect(page.locator('h2')).toContainText('Customer Info');
  });

  test('should configure and provision the customer tenant', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Tenant Setup' }).click();
    await expect(page.getByTestId('tenant-status')).toContainText('pending');

    await page.getByRole('button', { name: 'Provision tenant' }).click();
    await expect(page.getByTestId('tenant-status')).toContainText('active');
    await expect(page.getByText('Tenant provisioned')).toBeVisible();
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

  test('should import a customer\'s mapped clients', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Import' }).click();
    await page.getByRole('button', { name: 'Import clients' }).click();

    await expect(page.getByTestId('import-summary')).toContainText('0 skipped');
    await expect(page.getByTestId('imported-clients')).toContainText('Riverside Manufacturing LLC');
  });

  test('should validate customer data and flag the XYZ unquoted-comma rows', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Customer Info' }).click();
    await expect(page.getByTestId('validation-summary')).toContainText('0 with errors');

    await page.locator('select').selectOption({ label: 'XYZ Financial Services' });
    await expect(page.getByTestId('validation-summary')).toContainText('12 with warnings');
    await expect(page.getByTestId('validation-rows')).toContainText('unquoted comma');
  });

  test('should clear warnings and complete the Customer Info step', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Customer Info' }).click();
    await page.locator('select').selectOption({ label: 'XYZ Financial Services' });

    // Warnings block completion until acknowledged
    const complete = page.getByRole('button', { name: 'Clear warnings & complete step' });
    await expect(complete).toBeDisabled();
    await page.getByLabel(/reviewed the 12 row/).check();
    await complete.click();
    await expect(page.getByTestId('step-status')).toContainText('completed');

    // Dashboard reflects the completed step
    await page.getByRole('button', { name: 'Dashboard' }).click();
    await page.locator('.customer-card', { hasText: 'XYZ Financial Services' }).click();
    await expect(page.getByTestId('customer-detail')).toContainText('25%');
  });

  test('should complete Data Mapping only after Customer Info', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Data Mapping' }).click();
    await page.locator('select').selectOption({ label: 'ABC Accounting' });
    await page.getByRole('button', { name: 'Mark step complete' }).click();
    await expect(page.getByRole('alert')).toContainText('"Customer Info" step first');

    await page.getByRole('button', { name: 'Customer Info' }).click();
    await page.locator('select').selectOption({ label: 'ABC Accounting' });
    await page.getByRole('button', { name: 'Mark step complete' }).click();
    await expect(page.getByTestId('step-status')).toContainText('completed');

    await page.getByRole('button', { name: 'Data Mapping' }).click();
    await page.locator('select').selectOption({ label: 'ABC Accounting' });
    await page.getByRole('button', { name: 'Mark step complete' }).click();
    await expect(page.getByTestId('step-status')).toContainText('completed');
  });
});
