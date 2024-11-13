
// generates a short random string
export function generateKey(): string {
    return Math.random().toString(36).substring(2, 9);
}
