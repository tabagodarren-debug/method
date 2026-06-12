// plugins/swift/MethodSharedData.swift
import Foundation
import SwiftUI

extension View {
    @ViewBuilder
    func widgetBackground(_ color: Color) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(color, for: .widget)
        } else {
            self.background(color)
        }
    }
}

struct MethodData {
    let totalEarned: Int
    let rankTitle: String
    let rankLevel: Int
    let rankPercent: Double
    let meritToNext: Int
    let nextRankTitle: String
    let currentStreak: Int
    let personaName: String
    let daysRemaining: Int
    let weekActivity: [Bool]

    static let appGroup = "group.com.darrentabago.method"

    static func load() -> MethodData {
        let d = UserDefaults(suiteName: appGroup) ?? .standard
        let rawArray   = d.array(forKey: "weekActivity") ?? []
        let weekActivity = rawArray.compactMap { ($0 as? NSNumber)?.boolValue }
        return MethodData(
            totalEarned:   d.integer(forKey: "totalEarned"),
            rankTitle:     d.string(forKey: "rankTitle")  ?? "The Broke One",
            rankLevel:     d.integer(forKey: "rankLevel"),
            rankPercent:   d.double(forKey: "rankPercent"),
            meritToNext:   d.integer(forKey: "meritToNext"),
            nextRankTitle: d.string(forKey: "nextRankTitle") ?? "",
            currentStreak: d.integer(forKey: "currentStreak"),
            personaName:   d.string(forKey: "personaName") ?? "",
            daysRemaining: d.integer(forKey: "daysRemaining"),
            weekActivity:  weekActivity.count == 7 ? weekActivity : Array(repeating: false, count: 7)
        )
    }
}
