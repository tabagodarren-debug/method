// plugins/swift/MethodModulesProvider.swift
import ExpoModulesCore

class MethodModulesProvider: ModulesProvider {
    override func getModuleClasses() -> [AnyModule.Type] {
        ExpoModulesProvider().getModuleClasses() + [
            MethodSharedDataModule.self,
            MethodLiveActivityModule.self,
        ]
    }
}
