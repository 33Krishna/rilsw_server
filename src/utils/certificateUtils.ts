import { v4 as uuidv4 } from 'uuid';

export function generateCertificateNumber() {
  // Get current date
  const now = new Date();
  // Financial year: if before April, previous year/current year, else current year/next year
  const year = now.getMonth() < 3
    ? `${(now.getFullYear() - 1).toString().slice(-2)}-${now.getFullYear().toString().slice(-2)}`
    : `${now.getFullYear().toString().slice(-2)}-${(now.getFullYear() + 1).toString().slice(-2)}`;
  
  // Generate UUID for uniqueness
  const uuid = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  
  // For now, we'll use a simple approach with timestamp
  // In production, you might want to use a database counter or Redis
  const timestamp = Date.now().toString().slice(-4);
  
  return `EVXLAB/${year}/D${timestamp}${uuid}`;
}

// Alternative function that could be used with a database counter
export function generateSequentialCertificateNumber(counter: number) {
  const now = new Date();
  const year = now.getMonth() < 3
    ? `${(now.getFullYear() - 1).toString().slice(-2)}-${now.getFullYear().toString().slice(-2)}`
    : `${now.getFullYear().toString().slice(-2)}-${(now.getFullYear() + 1).toString().slice(-2)}`;
  
  // Format counter as D0001, D0002, etc.
  const formattedCounter = `D${counter.toString().padStart(4, '0')}`;
  
  return `EVXLAB/${year}/${formattedCounter}`;
}

export function capitalizeEachWord(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/(?:^|\s|-|\/|\(|\.)[a-z0-9]/g, (match) => match.toUpperCase());
} 