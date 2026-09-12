# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05_line_balance_and_combobox.spec.ts >> Suite 5: Line Balancing & Enterprise Operator Combobox >> 5.2 Should test the new OperatorCombobox: Search, Filter Tabs, and Operator Assignment
- Location: e2e\05_line_balance_and_combobox.spec.ts:28:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('tbody tr').first().locator('td.bg-blue-50\\/20 .relative.flex-1 > div').first()
Expected pattern: /Assign .* Operator/i
Received string:  "Assign Operator (47 avail)"
Timeout: 15000ms

Call log:
  - Expect "toHaveText" locator('tbody tr').first().locator('td.bg-blue-50\\/20 .relative.flex-1 > div').first() with timeout 15000ms
  - waiting for locator('tbody tr').first().locator('td.bg-blue-50\\/20 .relative.flex-1 > div').first()
    33 × locator resolved to <div class="relative w-full ">…</div>
       - unexpected value "Assign Operator (47 avail)"

```

```yaml
- text: Assign Operator (47 avail)
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Suite 5: Line Balancing & Enterprise Operator Combobox', () => {
  4   |   test('5.1 Should load Line Balancing page and display Takt time, stations, and Yamazumi chart', async ({ page }) => {
  5   |     await page.goto('/line-balance');
  6   |     await page.waitForLoadState('networkidle');
  7   | 
  8   |     // If order selector is present, ensure an order is selected
  9   |     const orderSelect = page.locator('select').first();
  10  |     if (await orderSelect.isVisible()) {
  11  |       const value = await orderSelect.inputValue();
  12  |       if (!value) {
  13  |         // Select the first valid order option
  14  |         await orderSelect.selectOption({ index: 1 });
  15  |         await page.waitForTimeout(600);
  16  |       }
  17  |     }
  18  | 
  19  |     const bodyText = await page.textContent('body');
  20  |     expect(bodyText).toMatch(/Line Balance|Takt Time|Efficiency|Workstation|Allocated Operators/i);
  21  | 
  22  |     // Verify Station table is rendered
  23  |     const stationRows = page.locator('tbody tr');
  24  |     const rowCount = await stationRows.count();
  25  |     expect(rowCount).toBeGreaterThanOrEqual(1);
  26  |   });
  27  | 
  28  |   test('5.2 Should test the new OperatorCombobox: Search, Filter Tabs, and Operator Assignment', async ({ page }) => {
  29  |     await page.goto('/line-balance');
  30  |     await page.waitForLoadState('networkidle');
  31  | 
  32  |     // Ensure an order is selected
  33  |     const orderSelect = page.locator('select').first();
  34  |     if (await orderSelect.isVisible()) {
  35  |       const val = await orderSelect.inputValue();
  36  |       if (!val) {
  37  |         await orderSelect.selectOption({ index: 1 });
  38  |         await page.waitForTimeout(600);
  39  |       }
  40  |     }
  41  | 
  42  |     // Locate the first station row's operator slot container
  43  |     const firstStationRow = page.locator('tbody tr').first();
  44  |     const comboboxTrigger = firstStationRow.locator('td.bg-blue-50\\/20 .relative.flex-1 > div').first();
  45  |     await expect(comboboxTrigger).toBeVisible({ timeout: 15000 });
  46  | 
  47  |     // 1. Click to open floating popover
  48  |     await comboboxTrigger.click();
  49  |     await page.waitForTimeout(300);
  50  | 
  51  |     // 2. Verify search bar is visible and auto-focused
  52  |     const searchInput = page.locator('input[placeholder*="Search by name, EMP ID" i]');
  53  |     await expect(searchInput).toBeVisible();
  54  | 
  55  |     // 3. Test typing into the search bar
  56  |     await searchInput.fill('EMP');
  57  |     await page.waitForTimeout(200);
  58  | 
  59  |     // Verify search results appear
  60  |     const operatorItems = page.locator('div[class*="rounded-xl"][class*="cursor-pointer"]').filter({ hasText: /EMP-/i });
  61  |     const matchCount = await operatorItems.count();
  62  |     expect(matchCount).toBeGreaterThanOrEqual(1);
  63  | 
  64  |     // 4. Test Quick Filter tabs (e.g. Present tab)
  65  |     const presentFilterTab = page.locator('button').filter({ hasText: /Present \(/i }).first();
  66  |     if (await presentFilterTab.isVisible()) {
  67  |       await presentFilterTab.click();
  68  |       await page.waitForTimeout(200);
  69  |       await expect(presentFilterTab).toHaveClass(/bg-emerald-600/);
  70  |     }
  71  | 
  72  |     // 5. Test selecting an operator from the list
  73  |     const candidateItem = operatorItems.first();
  74  |     await candidateItem.click();
  75  |     await page.waitForTimeout(400);
  76  | 
  77  |     // Popover should close after selection
  78  |     await expect(searchInput).not.toBeVisible();
  79  | 
  80  |     // Trigger should now show the assigned operator with avatar, name, and rating
  81  |     await expect(comboboxTrigger).toHaveText(/EMP-|★/i);
  82  | 
  83  |     // 6. Test opening again and checking the 'Unassign' option
  84  |     await comboboxTrigger.click();
  85  |     await page.waitForTimeout(300);
  86  | 
  87  |     const unassignOption = page.locator('text=Unassign Operator (Leave slot empty)');
  88  |     if (await unassignOption.isVisible()) {
  89  |       await unassignOption.click();
  90  |       await page.waitForTimeout(400);
  91  | 
  92  |       // Trigger should now be empty / show unassigned placeholder
> 93  |       await expect(comboboxTrigger).toHaveText(/Assign .* Operator/i);
      |                                     ^ Error: expect(locator).toHaveText(expected) failed
  94  |     }
  95  |   });
  96  | 
  97  |   test('5.3 Should load Fixed Shift Target mode (/fixed-shift-target)', async ({ page }) => {
  98  |     await page.goto('/fixed-shift-target');
  99  |     await page.waitForLoadState('networkidle');
  100 | 
  101 |     const bodyText = await page.textContent('body');
  102 |     expect(bodyText).toMatch(/Shift Target|Takt Time|Shift Duration|Quota/i);
  103 |   });
  104 | 
  105 |   test('5.4 Should load Visual Operator Placement Floor Map (/operator-placement)', async ({ page }) => {
  106 |     await page.goto('/operator-placement');
  107 |     await page.waitForLoadState('networkidle');
  108 | 
  109 |     const bodyText = await page.textContent('body');
  110 |     expect(bodyText).toMatch(/Operator Placement|Workstation|Layout|Line|Machine/i);
  111 |   });
  112 | 
  113 |   test('5.5 Should load Real-time Production Monitoring Dashboard (/monitoring)', async ({ page }) => {
  114 |     await page.goto('/monitoring');
  115 |     await page.waitForLoadState('networkidle');
  116 | 
  117 |     const bodyText = await page.textContent('body');
  118 |     expect(bodyText).toMatch(/Production Monitoring|Hourly Board|Actual|Target|Defect|Pace/i);
  119 |   });
  120 | });
  121 | 
```