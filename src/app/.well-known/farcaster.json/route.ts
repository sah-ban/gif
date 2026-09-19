export async function GET(request: Request) {
  const domain = request.headers.get("host")?.split(":")[0] || "";

  const oldDomain = "gif.itscashless.com";

  const oldAccountAssociation = {
    header:
      "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
    payload: "eyJkb21haW4iOiJnaWYuaXRzY2FzaGxlc3MuY29tIn0",
    signature:
      "07HrfqIEkBXrpqGwIcPgDtH8rAO2b5sQpWf77Y6/tsEsJvKSFZtXzvA05hCIxnLnZCWBDg020WE0eiGTnJ8QuRs=",
  };

  const newAccountAssociation = {
    header: "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
    payload: "eyJkb21haW4iOiJnaWYuc2FoYmFuLmRldiJ9",
    signature: "zVji8d6bxsNGi8kld+ImO8B535SxvQq/CQi5q7MPPFxhEk7hB3f6fXBvTK4zeyrjuzmUk32UyYzQ/jXYILEb6hw="
  };

  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: domain === oldDomain ? oldAccountAssociation : newAccountAssociation,
    frame: {
      version: "1",
      name: "GIF",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      buttonTitle: "Open GIF Explorer",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#333333",
      description: "Search and cast GIFs on Farcaster",
      primaryCategory: "utility",
      castShareUrl: appUrl,
      webhookUrl: `${appUrl}/api/webhook`,
      canonicalDomain: "gif.sahban.dev",
    },
    baseBuilder: {
      allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
    },
  };

  return Response.json(config);
}
