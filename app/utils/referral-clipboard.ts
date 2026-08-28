// Die Web-Landingpage legt beim Download-Klick "VEEZY:<CODE>" ins
// Clipboard — Format muss mit dem Landingpage-Download-Link übereinstimmen.
const CLIPBOARD_PATTERN = /^VEEZY:([A-Za-z0-9_-]{2,32})$/i;

export function parseReferralClipboard(text: string | null): string | null {
    const match = text?.trim().match(CLIPBOARD_PATTERN);
    return match ? match[1].toUpperCase() : null;
}
