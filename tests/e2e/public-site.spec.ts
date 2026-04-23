import { expect, test } from "@playwright/test";

test.describe("Public site", () => {
  test("loads homepage, exposes theme toggle, and shows nav links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Robotics & AI Club").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Events" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Know us" })).toBeVisible();

    const toggle = page.getByRole("button", { name: /switch to light mode|switch to dark mode/i }).first();
    await expect(toggle).toBeVisible();

    await toggle.click({ force: true });
    await expect(toggle).toBeVisible();
  });

  test("events carousel first three cards are rendered with loaded images", async ({ page }) => {
    await page.goto("/#events");

    await expect(page.getByRole("heading", { name: "Events", exact: true })).toBeVisible();
    const emptyState = page.getByText("No events scheduled yet.");
    const eventLinks = page.locator('a[aria-label$="open event story"]');

    const hasEvents = (await eventLinks.count()) > 0;
    if (!hasEvents) {
      await expect(emptyState).toBeVisible();
      return;
    }

    await expect(eventLinks.first()).toBeVisible();
    const imageStatus = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[aria-label$="open event story"]')).slice(0, 3);
      return links.map((link) => {
        const img = link.querySelector("img");
        if (!img) return { hasImage: false, complete: false, width: 0 };
        return { hasImage: true, complete: img.complete, width: img.naturalWidth };
      });
    });

    for (const status of imageStatus) {
      expect(status.hasImage).toBeTruthy();
      expect(status.complete).toBeTruthy();
      expect(status.width).toBeGreaterThan(0);
    }
  });

  test("team directory route loads", async ({ page }) => {
    await page.goto("/team");
    await expect(page).toHaveURL(/\/team$/);
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
  });
});
