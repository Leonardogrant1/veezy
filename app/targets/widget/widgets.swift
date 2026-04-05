import WidgetKit
import SwiftUI

// MARK: – Data

private let appGroup = "group.studio.northbyte.veezy"

struct WidgetVision: Decodable {
    let phrase: String
    let imagePath: String
    let category: String?
}

struct VisionEntry: TimelineEntry {
    let date: Date
    let phrase: String
    let imagePath: String
    let category: String?
}

// MARK: – Provider

struct VisionProvider: TimelineProvider {

    func placeholder(in context: Context) -> VisionEntry {
        VisionEntry(date: Date(), phrase: "", imagePath: "", category: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (VisionEntry) -> Void) {
        let visions = loadVisions()
        let entry = visions.first.map {
            VisionEntry(date: Date(), phrase: $0.phrase, imagePath: $0.imagePath, category: $0.category)
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
                imagePath: vision.imagePath,
                category: vision.category
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
  
  
    private var categoryFontSize: CGFloat {
      switch family {
      case .systemLarge: return 12
      case .systemMedium: return 9
      default: return 10
      }
    }

    private var fontSize: CGFloat {
        switch family {
        case .systemLarge: return 16
        case .systemMedium: return 12
        default: return 12
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
        if entry.phrase.isEmpty && entry.imagePath.isEmpty {
            WidgetPlaceholderView()
        } else {
            VStack(alignment: .leading, spacing: 5) {
                Spacer()
                
                Text((entry.category ?? "Lifestyle").uppercased())
                    .font(.system(size: categoryFontSize, weight: .semibold, design: .default))
                    .foregroundColor(Color(red: 201/255, green: 168/255, blue: 76/255))
                    .kerning(2.5)

                Text(entry.phrase)
                    .font(.system(size: fontSize, weight: .bold, design: .serif))
                    .foregroundColor(Color(white: 0.92))
                    .minimumScaleFactor(0.7)
            }
            .padding(.horizontal, 18)
            .padding(.bottom, 16)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .containerBackground(for: .widget) {
                ZStack {
                    if let uiImage = backgroundImage {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                    } else {
                        Color.black
                    }
                    LinearGradient(
                        gradient: Gradient(colors: [.clear, Color.black.opacity(0.95)]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
            }
        }
    }
}

// MARK: – Placeholder View

struct WidgetPlaceholderView: View {
    var body: some View {
        Color.white
            .containerBackground(for: .widget) { Color.white }
            .overlay(
                Image("logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 64, height: 64)
            )
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

#Preview(as: .systemLarge) {
    widget()
} timeline: {
    VisionEntry(date: .now, phrase: "Ich lebe kadwd  ooiwdaw n  ionw", imagePath: "", category: nil)
    VisionEntry(date: .now, phrase: "", imagePath: "", category: nil)
}
