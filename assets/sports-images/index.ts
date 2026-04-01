const sportsImages: Record<string, number[]> = {
    'athletics': [
        require('./athletics/0.jpeg'),
        require('./athletics/1.jpeg'),
        require('./athletics/2.jpeg'),
        require('./athletics/3.jpeg'),
        require('./athletics/4.jpeg'),
        require('./athletics/5.jpeg'),
        require('./athletics/6.jpeg'),
        require('./athletics/7.jpeg'),
        require('./athletics/8.jpeg'),
        require('./athletics/9.jpeg'),
    ],
    'combat-sports': [
        require('./combat-sports/0.jpeg'),
        require('./combat-sports/1.jpeg'),
        require('./combat-sports/2.jpeg'),
        require('./combat-sports/3.jpeg'),
        require('./combat-sports/4.jpeg'),
        require('./combat-sports/5.jpeg'),
        require('./combat-sports/6.jpeg'),
        require('./combat-sports/7.jpeg'),
        require('./combat-sports/8.jpeg'),
        require('./combat-sports/9.jpeg'),
    ],
    'endurance': [
        require('./endurance/0.jpeg'),
        require('./endurance/1.jpeg'),
        require('./endurance/2.jpeg'),
        require('./endurance/3.jpeg'),
        require('./endurance/4.jpeg'),
        require('./endurance/5.jpeg'),
        require('./endurance/6.jpeg'),
        require('./endurance/7.jpeg'),
        require('./endurance/8.jpeg'),
        require('./endurance/9.jpeg'),
    ],
    'other': [
        require('./other/0.jpeg'),
        require('./other/1.jpeg'),
        require('./other/2.jpeg'),
        require('./other/3.jpeg'),
        require('./other/4.jpeg'),
        require('./other/5.jpeg'),
        require('./other/6.jpeg'),
        require('./other/7.jpeg'),
        require('./other/8.jpeg'),
        require('./other/9.jpeg'),
    ],
    'racket-sports': [
        require('./racket-sports/0.jpeg'),
        require('./racket-sports/1.jpeg'),
        require('./racket-sports/2.jpeg'),
        require('./racket-sports/3.jpeg'),
        require('./racket-sports/4.jpeg'),
        require('./racket-sports/5.jpeg'),
        require('./racket-sports/6.jpeg'),
        require('./racket-sports/7.jpeg'),
        require('./racket-sports/8.jpeg'),
        require('./racket-sports/9.jpeg'),
    ],
    'strength-power': [
        require('./strength-power/0.jpeg'),
        require('./strength-power/1.jpeg'),
        require('./strength-power/2.jpeg'),
        require('./strength-power/3.jpeg'),
        require('./strength-power/4.jpeg'),
        require('./strength-power/5.jpeg'),
        require('./strength-power/6.jpeg'),
        require('./strength-power/7.jpeg'),
        require('./strength-power/8.jpeg'),
        require('./strength-power/9.jpeg'),
    ],
    'team-sports': [
        require('./team-sports/0.jpeg'),
        require('./team-sports/1.jpeg'),
        require('./team-sports/2.jpeg'),
        require('./team-sports/3.jpeg'),
        require('./team-sports/4.jpeg'),
        require('./team-sports/5.jpeg'),
        require('./team-sports/6.jpeg'),
        require('./team-sports/7.jpeg'),
        require('./team-sports/8.jpeg'),
        require('./team-sports/9.jpeg'),
    ],
    'water-sports': [
        require('./water-sports/0.jpeg'),
        require('./water-sports/1.jpeg'),
        require('./water-sports/2.jpeg'),
        require('./water-sports/3.jpeg'),
        require('./water-sports/4.jpeg'),
        require('./water-sports/5.jpeg'),
        require('./water-sports/6.jpeg'),
        require('./water-sports/7.jpeg'),
        require('./water-sports/8.jpeg'),
        require('./water-sports/9.jpeg'),
    ],
};

export function getRandomSportImage(selectedSports: string[], recentImages: number[] = []): number {
    const available = selectedSports.filter((s) => sportsImages[s]);
    const pool = available.length > 0 ? available : Object.keys(sportsImages);

    const allImages = pool.flatMap((slug) => sportsImages[slug]);
    const candidates = allImages.filter((img) => !recentImages.includes(img));
    const source = candidates.length > 0 ? candidates : allImages;

    return source[Math.floor(Math.random() * source.length)];
}
