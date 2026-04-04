import WidgetKit
import SwiftUI

// MARK: – Data

private let appGroup = "group.studio.northbyte.veezy"

struct WidgetVision: Decodable {
    let phrase: String
    let imagePath: String
}

struct VisionEntry: TimelineEntry {
    let date: Date
    let phrase: String
    let imagePath: String
}

// MARK: – Provider

struct VisionProvider: TimelineProvider {

    func placeholder(in context: Context) -> VisionEntry {
        VisionEntry(date: Date(), phrase: "Deine Vision wird Realität.", imagePath: "")
    }

    func getSnapshot(in context: Context, completion: @escaping (VisionEntry) -> Void) {
        let visions = loadVisions()
        let entry = visions.first.map {
            VisionEntry(date: Date(), phrase: $0.phrase, imagePath: $0.imagePath)
        } ?? placeholder(in: context)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<VisionEntry>) -> Void) {
        let visions = loadVisions()

        guard !visions.isEmpty else {
            let fallback = placeholder(in: context)
            completion(Timeline(entries: [fallback], policy: .after(Date().addingTimeInterval(3 * 3600))))
            return
        }

        let now = Date()
        let entries: [VisionEntry] = visions.shuffled().enumerated().map { index, vision in
            VisionEntry(
                date: Calendar.current.date(byAdding: .hour, value: index * 3, to: now)!,
                phrase: vision.phrase,
                imagePath: vision.imagePath
            )
        }

        // .atEnd → nach dem letzten Entry wird eine neue Timeline angefordert
        completion(Timeline(entries: entries, policy: .atEnd))
    }

    private func loadVisions() -> [WidgetVision] {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let json = defaults.string(forKey: "visions"),
            let data = json.data(using: .utf8),
            let visions = try? JSONDecoder().decode([WidgetVision].self, from: data)
        else { return [] }
        return visions
    }
}

// MARK: – View

struct VisionWidgetView: View {
    var entry: VisionEntry
    @Environment(\.widgetFamily) var family

    private var fontSize: CGFloat {
        switch family {
        case .systemLarge: return 22
        case .systemMedium: return 18
        default: return 14
        }
    }

    private var backgroundImage: UIImage? {
        guard
            !entry.imagePath.isEmpty,
            let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup)
        else { return nil }
        return UIImage(contentsOfFile: containerURL.appendingPathComponent(entry.imagePath).path)
    }

    var body: some View {
        Text(entry.phrase)
            .font(.system(size: fontSize, design: .serif))
            .italic()
            .foregroundColor(.white)
            .multilineTextAlignment(.center)
            .minimumScaleFactor(0.7)
            .padding(.all, family == .systemLarge ? 24 : nil)
            .containerBackground(for: .widget) {
                ZStack {
                    if let uiImage = backgroundImage {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Color.black
                    }
                    Color.black.opacity(0.45)
                }
            }
    }
}

// MARK: – Widget

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: VisionProvider()) { entry in
            VisionWidgetView(entry: entry)
        }
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: – Preview

#Preview(as: .systemMedium) {
    widget()
} timeline: {
    VisionEntry(date: .now, phrase: "Deine Vision wird Realität.", imagePath: "")
    VisionEntry(date: .now, phrase: "Du bist auf dem Weg zu deinem Ziel.", imagePath: "")
}
