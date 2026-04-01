import { buildFeed, Category } from '@/data/quotes'
import { UserDataSettings } from '@/types/user-data'
import { devLog } from '@/utils/dev-log'
import { ExtensionStorage } from '@bacons/apple-targets'

const widgetStorage = new ExtensionStorage("group.studio.northbyte.discipl")


export function syncWidgetData(settings: UserDataSettings) {
    const quotes = buildFeed(settings.selectedCategories as Category[])

    widgetStorage.set('quotes', JSON.stringify(quotes))
    widgetStorage.set('sportCategories', JSON.stringify(settings.selectedSports))
    widgetStorage.set('notificationsPerDay', settings.notificationsPerDay)
    widgetStorage.set('startHour', settings.notificationStartHour)
    widgetStorage.set('endHour', settings.notificationEndHour)

    ExtensionStorage.reloadWidget();

    devLog('✅ Widget data synced:', quotes.length, 'quotes')
}