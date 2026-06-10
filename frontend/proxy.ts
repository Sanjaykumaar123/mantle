import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { sanitizeNextPath } from "./lib/web3/auth";
import {
  WALLET_SESSION_COOKIE,
  getWalletSessionToken,
  parseWalletSession,
  validateWalletSession,
} from "./lib/web3/session";

const protectedPaths = [
  "/dashboard",
  "/assets",
  "/investors",
  "/transfers",
  "/disclosures",
  "/audit",
  "/compliance",
  "/compliance/passports",
  "/reports",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function getBackendBaseUrl(): string | null {
  const base =
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    "";
  if (!base) {
    return null;
  }
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

async function verifySessionWithBackend(token: string): Promise<"valid" | "invalid" | "error"> {
  const backendBaseUrl = getBackendBaseUrl();
  console.log("[Proxy Middleware] verifySessionWithBackend called with backendBaseUrl:", backendBaseUrl);
  if (!backendBaseUrl) {
    console.log("[Proxy Middleware] verifySessionWithBackend: backendBaseUrl is empty!");
    return "error";
  }

  try {
    const url = `${backendBaseUrl}/auth/me`;
    console.log("[Proxy Middleware] verifySessionWithBackend: Fetching", url);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    console.log("[Proxy Middleware] verifySessionWithBackend: response status:", response.status, "ok:", response.ok);
    if (response.ok) {
      return "valid";
    }
    if (response.status === 401 || response.status === 403) {
      try {
        const errText = await response.text();
        console.log("[Proxy Middleware] verifySessionWithBackend error response:", errText);
      } catch {}
      return "invalid";
    }
    return "error";
  } catch (err) {
    console.error("[Proxy Middleware] verifySessionWithBackend network/unexpected error:", err);
    return "error";
  }
}

function buildLoginRedirectUrl(request: NextRequest): URL {
  const target = sanitizeNextPath(`${request.nextUrl.pathname}${request.nextUrl.search}`);
  return new URL(`/login?next=${encodeURIComponent(target)}`, request.url);
}

function withClearedSessionCookie(response: NextResponse): NextResponse {
  response.cookies.delete(WALLET_SESSION_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionCookie = request.cookies.get(WALLET_SESSION_COOKIE)?.value ?? null;
  const session = parseWalletSession(sessionCookie);
  const hasValidSession = validateWalletSession(session);
  const isProtected = isProtectedPath(pathname);

  console.log(`[Proxy Middleware] Request: ${pathname}${search} | hasValidSession: ${hasValidSession} | isProtected: ${isProtected}`);

  if (!hasValidSession && sessionCookie) {
    console.log(`[Proxy Middleware] Session cookie present but invalid. isProtected: ${isProtected}`);
    if (isProtected) {
      console.log(`[Proxy Middleware] Redirecting to login because path is protected.`);
      return withClearedSessionCookie(NextResponse.redirect(buildLoginRedirectUrl(request)));
    }

    return withClearedSessionCookie(NextResponse.next());
  }

  if (hasValidSession) {
    const token = getWalletSessionToken(session);
    console.log(`[Proxy Middleware] Session is valid. Verifying token: ${token?.slice(0, 10)}...`);
    const verificationResult = token ? await verifySessionWithBackend(token) : "invalid";
    console.log(`[Proxy Middleware] Session verification result: ${verificationResult}`);

    if (verificationResult === "invalid") {
      if (isProtected || pathname === "/login") {
        console.log(`[Proxy Middleware] Verification failed (invalid). Redirecting to login & clearing cookie.`);
        return withClearedSessionCookie(NextResponse.redirect(buildLoginRedirectUrl(request)));
      }
      return withClearedSessionCookie(NextResponse.next());
    }

    if (verificationResult === "valid" && pathname === "/login") {
      const nextPath = sanitizeNextPath(request.nextUrl.searchParams.get("next"));
      console.log(`[Proxy Middleware] Already logged in. Redirecting to nextPath: ${nextPath}`);
      return NextResponse.redirect(new URL(nextPath, request.url));
    }
  }

  if (isProtected && !hasValidSession) {
    const target = sanitizeNextPath(`${pathname}${search}`);
    const loginUrl = new URL(`/login?next=${encodeURIComponent(target)}`, request.url);
    console.log(`[Proxy Middleware] Protected route but no valid session. Redirecting to: ${loginUrl.toString()}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/assets",
    "/assets/:path*",
    "/investors",
    "/investors/:path*",
    "/transfers",
    "/transfers/:path*",
    "/disclosures",
    "/disclosures/:path*",
    "/audit",
    "/audit/:path*",
    "/compliance",
    "/compliance/:path*",
    "/reports",
    "/reports/:path*",
    "/settings",
    "/settings/:path*",
  ],
};
