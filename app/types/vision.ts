export type VisionCategory =
    | 'wealth'
    | 'body'
    | 'lifestyle'
    | 'relationships'
    | 'mindset'
    | 'purpose';

export type VisionStatus = 'pending' | 'ready' | 'failed';

export type Vision = {
    id: string
    title: string
    phrase: string
    category: VisionCategory
    imagePath: string | null
    createdAt: string
    imageVersion: number
    status?: VisionStatus
    pendingSince?: number
    affirmationsAffirmation?: string[]
    affirmationsFuel?: string[]
}
