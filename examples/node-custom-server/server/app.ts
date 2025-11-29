import "react-router";
import { createRequestHandler } from "@react-router/express";
import express from "express";

declare module "react-router" {
  interface AppLoadContext {
    VALUE_FROM_EXPRESS: string;
  }
}

export const app = express();

// API endpoint that returns numbers with comma formatting (the bug!)
app.get("/api/stats", (_req, res) => {
  res.json({
    revenue: "12,345.67",      // Bug: comma-formatted string
    users: "8,234",            // Bug: comma-formatted string  
    orders: "1,567",           // Bug: comma-formatted string
    conversion: "3.24",        // This one works (no comma)
  });
});

app.use(
  createRequestHandler({
    build: () => import("virtual:react-router/server-build"),
    getLoadContext() {
      return {
        VALUE_FROM_EXPRESS: "Hello from Express",
      };
    },
  }),
);
