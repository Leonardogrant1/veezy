import { buildFeed, Category } from '@/data/quotes'
import { devLog } from '@/utils/dev-log'

type WidgetSettings = {
    selectedCategories: string[];
    selectedSports: string[];
    notificationsPerDay: number;
    notificationStartHour: number;
    notificationEndHour: number;
};
import { ExtensionStorage } from '@bacons/apple-targets'

const widgetStorage = new ExtensionStorage("group.studio.northbyte.discipl")


export function syncWidgetData(settings: WidgetSettings) {
    const quotes = buildFeed(settings.selectedCategories as Category[])

    widgetStorage.set('quotes', JSON.stringify(quotes))
    widgetStorage.set('sportCategories', JSON.stringify(settings.selectedSports))
    widgetStorage.set('notificationsPerDay', settings.notificationsPerDay)
    widgetStorage.set('startHour', settings.notificationStartHour)
    widgetStorage.set('endHour', settings.notificationEndHour)

    ExtensionStorage.reloadWidget();

    devLog('✅ Widget data synced:', quotes.length, 'quotes')
}