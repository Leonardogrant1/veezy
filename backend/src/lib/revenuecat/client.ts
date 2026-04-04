import { RCAttribute, RCCustomer } from "./types.js";

export class RevenueCatClient {

    private static get endpoint(): string {
        const projectId = process.env.REVENUECAT_PROJECT_ID;
        if (!projectId) throw new Error('REVENUECAT_PROJECT_ID not set');
        return `https://api.revenuecat.com/v2/projects/${projectId}`;
    }

    private static get secret(): string {
        const secret = process.env.REVENUECAT_SECRET;
        if (!secret) throw new Error('REVENUECAT_SECRET not set');
        return secret;
    }

    private static get headers(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.secret}`,
            'Content-Type': 'application/json',
        };
    }

    static async fetchCustomer(userId: string): Promise<RCCustomer> {
        const res = await fetch(`${this.endpoint}/customers/${encodeURIComponent(userId)}`, {
            headers: this.headers,
        });
        if (res.status === 404) throw Object.assign(new Error('User not found'), { status: 404 });
        if (!res.ok) throw new Error(`RevenueCat API error: ${res.status}`);
        return await res.json() as RCCustomer;
    }

    static async fetchAttributes(userId: string): Promise<RCAttribute[]> {
        const res = await fetch(`${this.endpoint}/customers/${encodeURIComponent(userId)}/attributes`, {
            headers: this.headers,
        });
        if (!res.ok) throw new Error(`RevenueCat API error: ${res.status}`);
        const data = await res.json() as { items: RCAttribute[] };
        return data.items;
    }

    static async setAttributes(userId: string, attrs: Record<string, string>): Promise<void> {
        const attributes = Object.entries(attrs).map(([name, value]) => ({ name, value }));
        await fetch(`${this.endpoint}/customers/${encodeURIComponent(userId)}/attributes`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ attributes }),
        });
    }
}
