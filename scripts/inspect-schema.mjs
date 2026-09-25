import fs from "fs";

const schema = fs.readFileSync("prisma/schema.prisma", "utf-8");
const models = schema.match(/model\s+\w+/g);
console.log("Models found:", models);

// Search for job or task
const lines = schema.split("\n");
lines.forEach((l, i) => {
  if (l.match(/model.*(Job|Task|Work|HR|Assign)/i)) {
    console.log(`Line ${i + 1}: ${l}`);
  }
});
