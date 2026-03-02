import dotenv from 'dotenv';

export function loadEnv(project: 'smoke' | 'e2e', required: Array<any>): void {
  dotenv.config({ path: `.env.${project}` });

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(
        `Missing ${key} in .env.${project}`
      );
    }
  }
}