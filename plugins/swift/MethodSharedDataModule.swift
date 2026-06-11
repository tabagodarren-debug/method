// plugins/swift/MethodSharedDataModule.swift
import ExpoModulesCore
import WidgetKit

public class MethodSharedDataModule: Module {
    public func definition() -> ModuleDefinition {
        Name("MethodSharedData")

        AsyncFunction("update") { (data: [String: Any]) in
            guard let defaults = UserDefaults(suiteName: "group.com.darrentabago.method") else {
                throw Exception(name: "AppGroupError", description: "App Group not accessible")
            }
            for (key, value) in data {
                defaults.set(value, forKey: key)
            }
            defaults.synchronize()
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
