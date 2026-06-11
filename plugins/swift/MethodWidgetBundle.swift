// plugins/swift/MethodWidgetBundle.swift
import SwiftUI
import WidgetKit

@main
struct MethodWidgetBundle: WidgetBundle {
    var body: some Widget {
        MethodWidget()
        if #available(iOS 16.2, *) {
            MethodLiveActivityWidget()
        }
    }
}
