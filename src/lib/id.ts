import { customAlphabet } from 'nanoid';

// Excludes visually ambiguous characters (0/O, 1/I/L) so a staff member can
// still type the code by hand if a damaged label's QR won't scan.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generate = customAlphabet(ALPHABET, 6);

export function generateUnitId(): string {
  const code = generate();
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
