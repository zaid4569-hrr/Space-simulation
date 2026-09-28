import { expect, test } from '@playwright/test'

const demoSequence = [
  'Mission select',
  'Mars briefing',
  'Build spacecraft',
  'Add instruments',
  'Show trade-offs',
  'Launch',
  'Crisis event',
  'Decision',
  'Mission result',
  'What-if comparison',
  'NASA data',
]

test('Judge Demo follows the full script and repeats the same event across five runs', async ({ page }) => {
  await page.route('https://images-api.nasa.gov/**', (route) => route.abort())
  const events: string[] = []

  for (let run = 0; run < 5; run += 1) {
    await page.goto('/')
    await page.getByRole('button', { name: /Judge Demo/ }).click()

    for (const [index, step] of demoSequence.entries()) {
      await expect(page.locator('.demo-guide h2')).toHaveText(step)
      if (index === 6) events.push(await page.locator('.event-console h2').innerText())
      if (index === 9) await expect(page.getByRole('heading', { name: /What if we swapped/ })).toBeVisible()
      if (index < demoSequence.length - 1) await page.getByRole('button', { name: 'Next step' }).click()
    }
    await page.getByRole('button', { name: 'Exit demo' }).click()
  }

  expect(events).toEqual(Array(5).fill('REGIONAL DUST FRONT'))
})

test('offline production reload keeps briefing, NASA sample, and the playable mission loop available', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Start a mission' })).toBeVisible()

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Start a mission' })).toBeVisible()
  await expect(page.getByText('OFFLINE / FALLBACK MODE')).toBeVisible()
  await page.getByRole('button', { name: 'Start a mission' }).click()
  await expect(page.getByRole('heading', { name: /Mars, in context/ })).toBeVisible()
  await expect(page.locator('.status-pill')).toHaveText(/OFFLINE SAMPLE/)
  await expect(page.getByRole('img', { name: /Mars Rover Studies Soil on Mars/ })).toBeVisible()

  await page.getByRole('button', { name: 'Begin mission design' }).click()
  await page.getByRole('button', { name: /Deployable solar array/ }).click()
  await page.getByRole('button', { name: /High-gain antenna/ }).click()
  await page.getByRole('button', { name: /Context camera/ }).click()
  await page.getByRole('button', { name: /Mineral spectrometer/ }).click()
  await page.getByRole('button', { name: /Launch mission/ }).click()
  await page.getByRole('button', { name: /Open operations window/ }).click()
  await page.getByRole('button', { name: /Keep science priority/ }).click()
  await expect(page.getByText('89', { exact: true })).toBeVisible()
  await context.setOffline(false)
})