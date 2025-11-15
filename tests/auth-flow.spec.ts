import { test, expect } from "@playwright/test";

test("Full Auth0 login -> token -> backend API access", async ({ page }) => {
  const username = "testuser@test.test";
  const password = "Test1234!";

  // 1️⃣ Visit your app (should auto-redirect to Auth0 login)
  await page.goto("http://localhost:8080/");

  // 2️⃣ Auth0 login page
await page.locator('input[name="username"], input[name="email"]').fill(username);
await page.locator('input[type="password"]').fill(password);
await page.getByRole('button', { name: 'Continue', exact: true }).click();
  // 3️⃣ Wait for redirect back to your dashboard
  await page.waitForURL("http://localhost:8080/**");

  // 4️⃣ Confirm dashboard UI
  await expect(page.getByText("Pool Control Board")).toBeVisible();

  // 5️⃣ Extract real token from Auth0 SDK running in browser
    const tokenResponse = await page.request.post(
      `https://${process.env.TEST_AUTH0_DOMAIN}/oauth/token`,
      {
        data: {
          grant_type: "http://auth0.com/oauth/grant-type/password-realm",
          username,
          password,
          audience: "https://pbrobot.onrender.com/",
          client_id: process.env.TEST_AUTH0_CLIENT_ID,
          client_secret: process.env.TEST_AUTH0_CLIENT_SECRET, // create this in .env.test.local
          realm: "Username-Password-Authentication",
          scope: "openid profile email",
        },
      }
    );

    const { access_token } = await tokenResponse.json();

  expect(access_token).toBeTruthy();

  // 6️⃣ Call your backend WITH the real token
  const response = await page.request.get(
    "https://pbrobot.onrender.com/api/users/me",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  expect(response.status()).toBe(200);
});
