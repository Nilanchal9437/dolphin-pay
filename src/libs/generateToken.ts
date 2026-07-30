import { SignJWT, importPKCS8 } from "jose";
import { v4 as uuidv4 } from "uuid";

export async function generateVoucherToken(userAgent: string = "server"): Promise<string> {
  const raw = process.env.PRIVATE_KEY_PEM;
  if (!raw) {
    throw new Error("PRIVATE_KEY_PEM not configured");
  }
  // CF may strip newlines or store as escaped \n — reconstruct proper PEM
  const normalized = raw.replace(/\\n/g, "\n").replace(/\r/g, "");
  const match = normalized.match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  if (!match) {
    throw new Error("PRIVATE_KEY_PEM is not a valid PKCS#8 PEM");
  }
  const b64 = match[1].replace(/\s/g, "");
  const lines = b64.match(/.{1,64}/g) ?? [];
  const privateKeyPem = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----\n`;
  const privateKey = await importPKCS8(privateKeyPem, "RS256");

  return new SignJWT({
    sub: "storefront-service",
    client_id: userAgent,
    scopes: [
      "vouchers:reserve",
      "vouchers:validate",
      "vouchers:redeem",
      "vouchers:status",
    ],
    jti: uuidv4(),
  })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(privateKey);
}
