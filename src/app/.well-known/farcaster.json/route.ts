export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL;

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjI2ODQzOCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDIxODA4RUUzMjBlREY2NGMwMTlBNmJiMEY3RTRiRkIzZDYyRjA2RWMifQ",
      payload: "eyJkb21haW4iOiJmYy1naWYudmVyY2VsLmFwcCJ9",
      signature: "MHg3ODFmMjhhNDk2NDY2ZWQ3OTBlN2ZlMWE5ODYxMWQ2NTQ1MTk5ZWZiYzM0ZTk1MWM4MTVkM2FmZTAxZTFjYzkyNTQ5NjZhOGZiODY3NDQ1OGNlMDFiMDIzNGVjMWVhNzM2ODkwZjI4Zjc3ZmQzN2JkYmM0N2RmZDE3NzY3MGQ5NjFj",
    },
    frame: {
      version: "1",
      name: "GIF",
      iconUrl: `${appUrl}/logo.png`,
      homeUrl: appUrl,
      buttonTitle: "OPen GIF Search",
      splashImageUrl: `${appUrl}/logo.png`,
      splashBackgroundColor: "#FFFFFF",
    },
    baseBuilder: {
      allowedAddresses: ["0x06e5B0fd556e8dF43BC45f8343945Fb12C6C3E90"],
    },
  };

  return Response.json(config);
}
