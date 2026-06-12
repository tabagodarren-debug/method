// plugins/swift/MethodLiveActivityWidget.swift
import SwiftUI
import WidgetKit
import ActivityKit

private func fmt(_ secs: Int) -> String {
    String(format: "%02d:%02d", secs / 60, secs % 60)
}

@available(iOS 16.2, *)
struct MethodLiveActivityWidget: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: MethodLiveActivityAttributes.self) { context in
            LockScreenView(state: context.state, attrs: context.attributes)
                .widgetBackground(Color(red: 0.102, green: 0.102, blue: 0.102))
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("LOCKED IN")
                            .font(.system(size: 9, weight: .semibold)).tracking(3)
                            .foregroundColor(.white.opacity(0.5))
                        HStack(spacing: 3) {
                            if !context.attributes.personaName.isEmpty {
                                Text(context.attributes.personaName)
                                    .font(.system(size: 10, weight: .medium)).tracking(1)
                                    .foregroundColor(.white.opacity(0.7))
                                Text("·").foregroundColor(.white.opacity(0.3))
                            }
                            Text(context.attributes.rankTitle)
                                .font(.system(size: 10, weight: .medium))
                                .foregroundColor(.white.opacity(0.7))
                        }
                        .lineLimit(1).minimumScaleFactor(0.8)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(fmt(context.state.timeRemaining))
                        .font(.system(size: 26, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if context.state.timeRemaining == 0 && context.state.projectedMerit > 0 {
                        Text("+\(context.state.projectedMerit) MERIT EARNED")
                            .font(.system(size: 12, weight: .semibold)).tracking(1)
                            .foregroundColor(.white.opacity(0.85))
                    } else {
                        Text("+ \(context.state.projectedMerit) MERIT INCOMING")
                            .font(.system(size: 11, weight: .light)).tracking(0.5)
                            .foregroundColor(.white.opacity(0.65))
                    }
                }
            } compactLeading: {
                Text("₦")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            } compactTrailing: {
                Text(fmt(context.state.timeRemaining))
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            } minimal: {
                Text(fmt(context.state.timeRemaining))
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundColor(.white)
            }
        }
    }
}

@available(iOS 16.2, *)
private struct LockScreenView: View {
    let state: MethodLiveActivityAttributes.ContentState
    let attrs: MethodLiveActivityAttributes

    var body: some View {
        HStack(alignment: .center, spacing: 0) {
            VStack(alignment: .leading, spacing: 5) {
                Text("method.")
                    .font(.system(size: 11, weight: .light)).foregroundColor(.white.opacity(0.45))
                Text(personaLine)
                    .font(.system(size: 12, weight: .medium)).foregroundColor(.white.opacity(0.7))
                    .lineLimit(1).minimumScaleFactor(0.8)
                sessionProgress
                Text(footerText)
                    .font(.system(size: 10, weight: .light)).foregroundColor(.white.opacity(0.45))
            }
            Spacer()
            Text(fmt(state.timeRemaining))
                .font(.system(size: 40, weight: .bold, design: .monospaced))
                .foregroundColor(.white)
        }
        .padding(16)
        .background(Color(red: 0.102, green: 0.102, blue: 0.102))
    }

    private var personaLine: String {
        attrs.personaName.isEmpty
            ? attrs.rankTitle
            : "\(attrs.personaName) is locked in · \(attrs.rankTitle)"
    }

    private var footerText: String {
        state.timeRemaining == 0 && state.projectedMerit > 0
            ? "+\(state.projectedMerit) merit earned"
            : "earning up to \(state.projectedMerit) merit"
    }

    private var sessionProgress: some View {
        GeometryReader { geo in
            let total    = Double(attrs.intervalMinutes * 60)
            let elapsed  = max(0, total - Double(state.timeRemaining))
            let progress = total > 0 ? elapsed / total : 0
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.08)).frame(height: 4)
                RoundedRectangle(cornerRadius: 3).fill(.white.opacity(0.7))
                    .frame(width: geo.size.width * progress, height: 4)
            }
        }
        .frame(height: 4)
    }
}
