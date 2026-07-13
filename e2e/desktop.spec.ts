import { expect, test } from '@playwright/test'
import { captureBrowserErrors, expectNoAccessibilityViolations } from './support'

test('completes the zero-token desktop workflow', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page)
  await page.goto('/')

  await expect(page).toHaveTitle('Issue Atlas · GitHub dependency explorer')
  await expect(
    page.getByRole('heading', { name: 'Run strict quality gates in GitHub Actions' }),
  ).toBeVisible()

  const issueList = page.getByRole('list', { name: 'Filtered issues' })
  const search = page.getByRole('textbox', { name: 'Search issues' })
  await search.fill('schema-validated')
  await expect(issueList.getByRole('button')).toHaveCount(1)

  const graphqlIssue = issueList.getByRole('button', {
    name: /Implement schema-validated GitHub GraphQL requests/,
  })
  await graphqlIssue.focus()
  await page.keyboard.press('Enter')
  await expect(
    page.getByRole('heading', { name: 'Implement schema-validated GitHub GraphQL requests' }),
  ).toBeVisible()

  await search.fill('')
  await page.getByLabel('State').selectOption('open')
  await page.getByLabel('Readiness').selectOption('ready')
  await expect(issueList.getByRole('button')).toHaveCount(1)
  await expect(
    issueList.getByRole('button', { name: /Run strict quality gates in GitHub Actions/ }),
  ).toBeVisible()

  const horizontal = page.getByRole('button', { name: 'Use left-to-right layout' })
  const vertical = page.getByRole('button', { name: 'Use top-to-bottom layout' })
  await expect(horizontal).toHaveAttribute('aria-pressed', 'true')
  await vertical.click()
  await expect(vertical).toHaveAttribute('aria-pressed', 'true')
  await expect(horizontal).toHaveAttribute('aria-pressed', 'false')

  const theme = page.getByRole('button', { name: 'Use dark mode' })
  await theme.click()
  await expect(page.getByRole('button', { name: 'Use light mode' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'dark')

  const jsonDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  await expect((await jsonDownload).suggestedFilename()).toBe(
    'github-issue-dag-viewer-issue-dependencies.json',
  )

  const pngDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download graph as PNG' }).click()
  await expect((await pngDownload).suggestedFilename()).toBe('issue-dependency-graph.png')

  const openRepository = page.getByRole('button', { name: 'Open repository' })
  await openRepository.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Open an issue dependency graph' })
  await expect(dialog).toBeVisible()
  const token = dialog.getByLabel('Read-only GitHub token')
  await token.fill('temporary-test-token')
  await dialog.getByRole('button', { name: 'Explore demo' }).click()
  await expect(dialog).toBeHidden()
  await openRepository.click()
  await expect(token).toHaveValue('')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await expectNoAccessibilityViolations(page)
  expect(browserErrors).toEqual([])
})
