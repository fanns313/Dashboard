import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";

// Force HTTPS for NextAuth behind proxies that don't send X-Forwarded-Proto correctly
const forceHttps = (handler: any) => async (req: NextRequest, ...args: any[]) => {
  if (process.env.AUTH_URL?.startsWith("https://")) {
    const headers = new Headers(req.headers);
    headers.set("x-forwarded-proto", "https");
    
    // Create a new request with the spoofed header and https protocol
    const httpsUrl = req.url.replace(/^http:/, "https:");
    const newReq = new NextRequest(httpsUrl, {
      method: req.method,
      headers: headers,
      body: req.body,
      duplex: 'half'
    } as any);
    
    return handler(newReq, ...args);
  }
  return handler(req, ...args);
};

export const GET = forceHttps(handlers.GET);
export const POST = forceHttps(handlers.POST);
