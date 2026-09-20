import { expect, test } from "@playwright/test";

const API_URL = process.env.PLAYWRIGHT_API_URL ?? "http://localhost:8080";

function uniquePhone() {
  const local = `8${Date.now().toString().slice(-7)}`;
  return {
    from: `whatsapp:+503${local}`,
    display: `+503${local}`,
  };
}

test("a reclamo appears in the list, survives the ABIERTO filter, and shows its thread", async ({
  page,
  request,
}) => {
  const { from, display } = uniquePhone();
  const inboundBody = `Quiero poner un reclamo e2e ${Date.now()}`;

  const webhook = await request.post(`${API_URL}/webhook/whatsapp`, {
    form: {
      From: from,
      Body: inboundBody,
      MessageSid: `SMe2e${Date.now()}`,
    },
  });

  expect(webhook.ok()).toBeTruthy();
  expect(await webhook.json()).toMatchObject({
    ok: true,
    duplicated: false,
    intent: "RECLAMO",
  });

  await page.goto("/");
  await expect(page.getByTestId("cases-loading")).toBeHidden();

  const caseLink = page.getByRole("link", { name: display });
  await expect(caseLink).toBeVisible();
  await expect(page.getByTestId("cases-table")).toContainText("Reclamo");
  await expect(page.getByTestId("cases-table")).toContainText("Abierto");

  const filtered = page.waitForResponse((res) => {
    const url = new URL(res.url());
    return (
      res.request().method() === "GET" &&
      url.pathname.endsWith("/cases") &&
      url.searchParams.get("status") === "ABIERTO" &&
      res.ok()
    );
  });
  await page.getByTestId("filter-status").selectOption("ABIERTO");
  await filtered;
  await expect(page.getByTestId("cases-loading")).toBeHidden();
  await expect(caseLink).toBeVisible();

  await caseLink.click();
  await expect(
    page.getByRole("heading", { name: "Reclamo · Reclamo" }),
  ).toBeVisible();
  await expect(page.getByTestId("case-thread")).toContainText(inboundBody);
});
