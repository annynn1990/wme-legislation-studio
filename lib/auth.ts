import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE_NAME = "wme_legislation_session";
function secret() {
 const value = process.env.AUTH_SECRET;
 if (!value || value.length < 32) throw new Error("AUTH_SECRET must contain at least 32 characters");
 return new TextEncoder().encode(value);
}
export async function createSession() {
 const token = await new SignJWT({ role: "admin" }).setProtectedHeader({ alg: "HS256" })
  .setIssuedAt().setExpirationTime("12h").sign(secret());
 const jar = await cookies();
 jar.set(COOKIE_NAME, token, {
  httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "strict", path: "/", maxAge: 43200
 });
}
export async function clearSession() {
 const jar = await cookies(); jar.delete(COOKIE_NAME);
}
export async function isAuthorized() {
 const jar = await cookies(); const token = jar.get(COOKIE_NAME)?.value;
 if (!token) return false;
 try { const { payload } = await jwtVerify(token, secret()); return payload.role === "admin"; }
 catch { return false; }
}
