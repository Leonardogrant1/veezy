export type SelfReferenceImages = {
    face_front: string | null
    face_left:  string | null
    face_right: string | null
    body:       string | null
}

export type UserData = {
    userId: string
    hasOnboarded: boolean
    hasSeenTutorial: boolean
    name: string
    age: number
    gender: 'male' | 'female' | 'other'
    notifications: boolean
    imagesUsed: number
    selfReferenceImages: SelfReferenceImages
}
