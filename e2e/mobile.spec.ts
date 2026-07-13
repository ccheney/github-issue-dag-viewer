import { expect, test } from '@playwright/test'
import { captureBrowserErrors, expectNoAccessibilityViolations } from './support'

test('keeps issue and detail panels operable on a phone', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page)
  await page.goto('/')

  const issuesButton = page.getByRole('button', { name: 'Issues' })
  const detailsButton = page.getByRole('button', { name: 'Details' })
  await expect(issuesButton).toBeVisible()
  await expect(detailsButton).toBeVisible()

  const issuesPanel = page.getByRole('region', { name: 'Issues' })
  await issuesButton.click()
  await expect(issuesPanel).toBeVisible()
  await issuesPanel.getByRole('button', { name: 'Close issue list' }).click()
  await expect(issuesPanel).toBeHidden()

  await detailsButton.click()
  const inspector = page.getByRole('complementary', { name: 'Issue #35 details' })
  await expect(inspector).toBeVisible()
  await inspector.getByRole('button', { name: 'Close issue details' }).click()
  await expect(inspector).toBeHidden()

  await expectNoAccessibilityViolations(page)
  expect(browserErrors).toEqual([])
})
