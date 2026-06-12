// plugins/swift/MethodWidget.swift
import SwiftUI
import WidgetKit

// MARK: - Timeline entry + provider

struct MethodEntry: TimelineEntry {
    let date: Date
    let data: MethodData
}

struct MethodProvider: TimelineProvider {
    func placeholder(in context: Context) -> MethodEntry {
        MethodEntry(date: .now, data: MethodData.load())
    }
    func getSnapshot(in context: Context, completion: @escaping (MethodEntry) -> Void) {
        completion(MethodEntry(date: .now, data: MethodData.load()))
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<MethodEntry>) -> Void) {
        let entry = MethodEntry(date: .now, data: MethodData.load())
        let next  = Calendar.current.date(byAdding: .minute, value: 30, to: .now)!
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// MARK: - Shared sub-views

private struct WeekDotsView: View {
    let weekActivity: [Bool]
    let size: CGFloat

    var body: some View {
        HStack(spacing: 5) {
            ForEach(0..<min(7, weekActivity.count), id: \.self) { i in
                Circle()
                    .fill(color(i))
                    .frame(width: size, height: size)
            }
        }
    }

    private func color(_ i: Int) -> Color {
        guard weekActivity[i] else { return .white.opacity(0.18) }
        return i == 6 ? .white : .white.opacity(0.85)
    }
}

private let darkBg = Color(red: 0.102, green: 0.102, blue: 0.102)
private let topShine = LinearGradient(
    colors: [.white.opacity(0.15), .clear],
    startPoint: .top, endPoint: .bottom
)

// MARK: - Small view

private struct SmallView: View {
    let data: MethodData

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("method.")
                .font(.system(size: 10, weight: .light))
                .foregroundColor(.white.opacity(0.45))
            Spacer()
            identityLine
            Text("\(data.totalEarned)")
                .font(.system(size: 32, weight: .bold))
                .foregroundColor(.white)
                .minimumScaleFactor(0.7)
            WeekDotsView(weekActivity: data.weekActivity, size: 6)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(darkBg)
        .overlay(alignment: .top) { topShine.frame(height: 32).clipped() }
    }

    private var identityLine: some View {
        HStack(spacing: 3) {
            if !data.personaName.isEmpty {
                Text(data.personaName.uppercased())
                    .font(.system(size: 9, weight: .medium)).tracking(2)
                    .foregroundColor(.white.opacity(0.5))
                Text("·").font(.system(size: 9)).foregroundColor(.white.opacity(0.3))
            }
            Text(data.rankTitle.uppercased())
                .font(.system(size: 9, weight: .semibold)).tracking(1.5)
                .foregroundColor(.white.opacity(0.7))
        }
        .lineLimit(1).minimumScaleFactor(0.8)
    }
}

// MARK: - Medium view

private struct MediumView: View {
    let data: MethodData

    var body: some View {
        HStack(spacing: 0) {
            leftColumn
            Rectangle().fill(.white.opacity(0.10)).frame(width: 1).padding(.vertical, 4)
            rightColumn.padding(.leading, 14)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(darkBg)
        .overlay(alignment: .top) { topShine.frame(height: 32).clipped() }
    }

    private var leftColumn: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("method.").font(.system(size: 11, weight: .light)).foregroundColor(.white.opacity(0.45))
            Spacer()
            Text("\(data.totalEarned)")
                .font(.system(size: 36, weight: .bold)).foregroundColor(.white).minimumScaleFactor(0.6)
            HStack(spacing: 4) {
                WeekDotsView(weekActivity: data.weekActivity, size: 7)
                if data.currentStreak > 0 {
                    Text("Day \(data.currentStreak)")
                        .font(.system(size: 9, weight: .medium)).foregroundColor(.white.opacity(0.4))
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rightColumn: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 3) {
                if !data.personaName.isEmpty {
                    Text(data.personaName.uppercased())
                        .font(.system(size: 9, weight: .medium)).tracking(2).foregroundColor(.white.opacity(0.5))
                    Text("·").font(.system(size: 9)).foregroundColor(.white.opacity(0.3))
                }
                Text(data.rankTitle.uppercased())
                    .font(.system(size: 9, weight: .semibold)).tracking(1.5).foregroundColor(.white.opacity(0.7))
            }
            .lineLimit(1).minimumScaleFactor(0.8)
            Spacer()
            rankProgressSection
            if data.daysRemaining > 0 {
                Text("\(data.daysRemaining) days to goal")
                    .font(.system(size: 10, weight: .light)).foregroundColor(.white.opacity(0.4))
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var rankProgressSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.08)).frame(height: 5)
                    RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.85))
                        .frame(width: max(0, geo.size.width * CGFloat(data.rankPercent)), height: 5)
                }
            }
            .frame(height: 5)
            Text(data.nextRankTitle.isEmpty ? "MAX RANK" : "\(data.meritToNext) to \(data.nextRankTitle.uppercased())")
                .font(.system(size: 9, weight: .semibold)).tracking(1)
                .foregroundColor(.white.opacity(0.65)).lineLimit(1).minimumScaleFactor(0.7)
        }
    }
}

// MARK: - Entry view (family switch)

struct MethodEntryView: View {
    let entry: MethodEntry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemMedium: MediumView(data: entry.data)
        default:            SmallView(data: entry.data)
        }
    }
}

// MARK: - Widget declaration

struct MethodWidget: Widget {
    let kind = "MethodWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MethodProvider()) { entry in
            MethodEntryView(entry: entry)
                .widgetBackground(darkBg)
        }
        .configurationDisplayName("Method")
        .description("Your rank, merit, and streak.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
