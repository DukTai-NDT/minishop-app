import { app } from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT ?? 4000);
const server = app.listen(port, () =>
  console.log(`MiniShop API listening at http://localhost:${port}`)
);
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () =>
    server.close(() => void prisma.$disconnect().finally(() => process.exit(0)))
  );
}
