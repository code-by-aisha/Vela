/**
 * VELA — Generate a production-strength JWT secret
 * Run:  node scripts/generate-secret.js
 * Copy the output into server/.env as JWT_SECRET=<value>
 */
import { randomBytes } from 'crypto';
const secret = randomBytes(48).toString('hex');
console.log('\n✅ Your JWT_SECRET (paste into .env):\n');
console.log(`JWT_SECRET=${secret}\n`);
