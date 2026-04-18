import { timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function bearerAuth(expectedToken: string) {
  if (!expectedToken) {
    throw new Error("MCP_BEARER_TOKEN is required");
  }
  const expected = Buffer.from(expectedToken);

  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("authorization") ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) {
      res.status(401).json({ error: "missing bearer token" });
      return;
    }

    const provided = Buffer.from(match[1].trim());
    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      res.status(401).json({ error: "invalid bearer token" });
      return;
    }

    next();
  };
}
