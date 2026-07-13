declare module 'google-play-scraper' {
    type GplayAppResult = { version: string; recentChanges?: string };
    const gplay: { app(opts: { appId: string }): Promise<GplayAppResult> };
    export default gplay;
}
