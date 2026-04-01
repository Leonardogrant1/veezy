export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say'

export type UserDataSettings = {
    name: string
    age: string | null
    gender: Gender | null
    improvements: string[]
    notificationsEnabled: boolean
    notificationsPerDay: number
    notificationStartHour: number
    notificationEndHour: number
    randomizeNotificationTimes: boolean
    selectedCategories: string[]
    selectedSports: string[]
}