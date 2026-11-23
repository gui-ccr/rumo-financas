package expo.modules.notificationcapture

import android.content.Context
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationCaptureModule : Module() {

  private fun requireContext(): Context =
    appContext.reactContext ?: throw IllegalStateException("React context indisponível")

  override fun definition() = ModuleDefinition {
    Name("NotificationCapture")

    Events("onCapture")

    OnStartObserving("onCapture") {
      CaptureStore.onCapture = { capture ->
        sendEvent("onCapture", capture.toMap())
      }
    }

    OnStopObserving("onCapture") {
      CaptureStore.onCapture = null
    }

    Function("hasPermission") {
      CaptureStore.hasListenerPermission(requireContext())
    }

    Function("openPermissionSettings") {
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      requireContext().startActivity(intent)
    }

    Function("setWatchedPackages") { packages: List<String> ->
      CaptureStore.setWatched(requireContext(), packages)
    }

    Function("getWatchedPackages") {
      CaptureStore.getWatched(requireContext())
    }

    Function("drainCaptures") {
      CaptureStore.drain(requireContext()).map { it.toMap() }
    }
  }
}
