// plugins/swift/MethodLiveActivityAttributes.swift
import ActivityKit
import Foundation

struct MethodLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var timeRemaining: Int    // seconds remaining
        var projectedMerit: Int   // merit earned if session ended now
    }

    let personaName: String
    let rankTitle: String
    let intervalMinutes: Int
}
