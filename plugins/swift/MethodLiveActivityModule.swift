// plugins/swift/MethodLiveActivityModule.swift
import ExpoModulesCore
import ActivityKit

public class MethodLiveActivityModule: Module {
    // Stored as opaque Any to avoid @available version gymnastics on the property itself
    private var activityId: String?

    public func definition() -> ModuleDefinition {
        Name("MethodLiveActivity")

        AsyncFunction("start") { (params: [String: Any]) in
            guard #available(iOS 16.2, *) else { return }
            let attrs = MethodLiveActivityAttributes(
                personaName:     params["personaName"] as? String ?? "",
                rankTitle:       params["rankTitle"] as? String ?? "",
                intervalMinutes: params["intervalMinutes"] as? Int ?? 25
            )
            let projected = params["projectedMerit"] as? Int ?? 25
            let state     = MethodLiveActivityAttributes.ContentState(
                timeRemaining: attrs.intervalMinutes * 60,
                projectedMerit: projected
            )
            let content  = ActivityContent(state: state, staleDate: nil)
            let activity = try Activity<MethodLiveActivityAttributes>.request(
                attributes: attrs, content: content
            )
            self.activityId = activity.id
        }

        AsyncFunction("update") { (timeRemaining: Int) in
            guard #available(iOS 16.2, *), let id = self.activityId else { return }
            guard let activity = Activity<MethodLiveActivityAttributes>
                .activities.first(where: { $0.id == id }) else { return }
            let projected = activity.content.state.projectedMerit
            let newState  = MethodLiveActivityAttributes.ContentState(
                timeRemaining: timeRemaining,
                projectedMerit: projected
            )
            await activity.update(ActivityContent(state: newState, staleDate: nil))
        }

        AsyncFunction("end") { (earnedMerit: Int) in
            guard #available(iOS 16.2, *), let id = self.activityId else { return }
            guard let activity = Activity<MethodLiveActivityAttributes>
                .activities.first(where: { $0.id == id }) else { return }
            let finalState = MethodLiveActivityAttributes.ContentState(
                timeRemaining: 0, projectedMerit: earnedMerit
            )
            let policy: ActivityUIDismissalPolicy = earnedMerit > 0
                ? .after(.now + 4)
                : .immediate
            await activity.end(ActivityContent(state: finalState, staleDate: nil), dismissalPolicy: policy)
            self.activityId = nil
        }
    }
}
