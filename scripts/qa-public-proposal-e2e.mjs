import { chromium } from "playwright";

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3005";
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const posts = [];
  page.on("request", (request) => {
    if (request.method() === "POST") posts.push(new URL(request.url()).pathname);
  });

  const response = await page.goto(`${baseUrl}/proposal/not-a-valid-token`, {
    waitUntil: "domcontentloaded",
    timeout: 20_000,
  });
  if (response?.status() !== 200) throw new Error(`Expected HTTP 200, got ${response?.status()}`);
  await page.getByRole("heading", { name: "This proposal link is not available" }).waitFor({ timeout: 20_000 });
  if ((await page.locator(".pp-doc").count()) !== 0) throw new Error("Unavailable proposal rendered a document");
  if ((await page.locator("form").count()) !== 0) throw new Error("Unavailable proposal rendered a response form");
  if (posts.length !== 0) throw new Error(`Unexpected POST requests: ${posts.join(", ")}`);
  console.log("PASS: malformed public proposal token is safe and non-probing");
} finally {
  await browser.close();
}
