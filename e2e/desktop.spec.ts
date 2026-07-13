import { expect, test } from '@playwright/test'
import { captureBrowserErrors, expectNoAccessibilityViolations } from './support'

test('completes the zero-token desktop workflow', async ({ page }) => {
  const browserErrors = captureBrowserErrors(page)
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')

  await expect(page).toHaveTitle('Issue Atlas · GitHub dependency explorer')
  await expect(page.locator('html')).toHaveAttribute('data-color-mode', 'auto')
  const graphRenderMarker = 'stable-cytoscape-canvas'
  const graphCanvas = page.locator('.graph-canvas canvas').first()
  await expect(graphCanvas).toBeAttached()
  const pngButton = page.getByRole('button', { name: 'Download graph as PNG' })
  await expect(pngButton).toHaveAttribute('aria-disabled', 'true')
  await pngButton.hover()
  await expect(
    page.locator('[data-component="Tooltip"]').filter({
      hasText: 'PNG is limited to 6,000 pixels per dimension. Download SVG for the complete graph.',
    }),
  ).toBeVisible()
  await page.mouse.move(0, 0)
  await expect(page.locator('.graph-local-warning')).toHaveCount(0)
  const svgDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download graph as SVG' }).click()
  await expect((await svgDownload).suggestedFilename()).toBe('issue-dependency-graph.svg')
  await graphCanvas.evaluate(
    (canvas, marker) => canvas.setAttribute('data-render-marker', marker),
    graphRenderMarker,
  )
  const systemLightBackground = await page.evaluate(
    () => getComputedStyle(document.body).backgroundColor,
  )
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect
    .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor))
    .not.toBe(systemLightBackground)
  await expect(page.locator(`[data-render-marker="${graphRenderMarker}"]`)).toHaveCount(1)
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.getByRole('link', { name: 'ccheney', exact: true })).toHaveAttribute(
    'href',
    'https://github.com/ccheney',
  )
  await expect(
    page.getByRole('link', { name: 'github-issue-dag-viewer', exact: true }),
  ).toHaveAttribute('href', 'https://github.com/ccheney/github-issue-dag-viewer')
  const finalIssue = page.getByRole('button', {
    name: /Add the MIT license and concise project README/,
  })
  await finalIssue.click()
  await expect(
    page.getByRole('heading', { name: 'Add the MIT license and concise project README' }),
  ).toBeVisible()
  const task = page.getByRole('checkbox', { name: 'Completed task' }).first()
  await expect(task).toHaveCSS('appearance', 'none')
  await expect(task.locator('xpath=..')).toHaveCSS('list-style-type', 'none')

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
  await search.fill('is:issue state:closed')
  await expect(issueList.getByRole('button')).toHaveCount(39)
  await expect(
    issueList.getByRole('button', {
      name: /Add the MIT license and concise project README/,
    }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Labels', exact: true }).click()
  const labelSearch = page.getByRole('textbox', { name: 'Filter labels' })
  await labelSearch.fill('docs')
  const docsLabel = page.getByRole('menuitemcheckbox', { name: 'area:docs' })
  await expect(docsLabel).toBeVisible()
  await docsLabel.click()
  await expect(search).toHaveValue('is:issue state:closed label:"area:docs"')
  await expect(issueList.getByRole('button')).toHaveCount(2)
  await page.keyboard.press('Escape')

  const horizontal = page.getByRole('button', { name: 'Use left-to-right layout' })
  const vertical = page.getByRole('button', { name: 'Use top-to-bottom layout' })
  await expect(horizontal).toHaveAttribute('aria-pressed', 'true')
  await vertical.click()
  await expect(vertical).toHaveAttribute('aria-pressed', 'true')
  await expect(horizontal).toHaveAttribute('aria-pressed', 'false')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(issueList.getByRole('button')).toHaveCount(2)
  await expect(page.locator(`[data-render-marker="${graphRenderMarker}"]`)).toHaveCount(1)
  await page.emulateMedia({ colorScheme: 'light' })

  const jsonDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export' }).click()
  await expect((await jsonDownload).suggestedFilename()).toBe(
    'github-issue-dag-viewer-issue-dependencies.json',
  )

  const pngDownload = page.waitForEvent('download')
  await expect(pngButton).toHaveAttribute('aria-disabled', 'false')
  await pngButton.click()
  await expect((await pngDownload).suggestedFilename()).toBe('issue-dependency-graph.png')

  const openRepository = page.getByRole('button', { name: 'Open repository' })
  await openRepository.focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Open an issue dependency graph' })
  await expect(dialog).toBeVisible()
  const tokenTemplate = dialog.getByRole('link', {
    name: 'Create a fine-grained read-only token',
  })
  await expect(tokenTemplate).toHaveAttribute(
    'href',
    'https://github.com/settings/personal-access-tokens/new?name=Issue%20Atlas&description=Read%20issue%20dependency%20graphs&expires_in=30&issues=read',
  )
  await expect(tokenTemplate).toHaveAttribute('target', '_blank')
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
