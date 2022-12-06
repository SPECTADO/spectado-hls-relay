import autocannon from "autocannon";
import os from "os";
import dotenv from "dotenv";

dotenv.config();
const env = process.env;
const coreCount = os.cpus().length;

console.log(`Starting... with '${coreCount}' workers.`);

const run = async () => {
  const config = {
    url: env.LT_url || "http://localhost:8080",
    connections: parseInt(env.LT_connections) || 100,
    amount: parseInt(env.LT_amount) || 5,
    workers: coreCount,
  };

  console.log(config);
  const result = await autocannon(config);
  console.log(result);
};

run();
