package expo.modules.notificationcapture

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationCaptureModule : Module() {

  private fun requireContext(): Context =
    appContext.reactContext ?: throw IllegalStateException("React context indisponível")

  /**
   * Opens the notification-access screen. Tries, in order, the detail screen of this listener (API 30+),
   * the list of notification listeners, and the app info screen (where "Permitir configurações restritas"
   * lives). Returns true as soon as one of them opens.
   */
  private fun openNotificationAccessSettings(): Boolean {
    val pkg = requireContext().packageName
    val listener = ComponentName(pkg, NotificationCaptureListenerService::class.java).flattenToString()

    val intents = buildList {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        add(
          Intent(Settings.ACTION_NOTIFICATION_LISTENER_DETAIL_SETTINGS)
            .putExtra(Settings.EXTRA_NOTIFICATION_LISTENER_COMPONENT_NAME, listener),
        )
      }
      add(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
      add(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.fromParts("package", pkg, null)))
    }
    return intents.any { startSettings(it) }
  }

  /**
   * Starts one settings screen. From the current Activity no extra flag is needed; from the application
   * context the intent must carry FLAG_ACTIVITY_NEW_TASK. Returns false when the screen cannot be opened.
   */
  private fun startSettings(intent: Intent): Boolean {
    val activity = appContext.currentActivity
    val context: Context = activity ?: requireContext()
    if (activity == null) intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return try {
      context.startActivity(intent)
      true
    } catch (e: RuntimeException) {
      // ActivityNotFoundException and SecurityException both extend RuntimeException.
      Log.w(TAG, "Tela de configuração indisponível: ${intent.action}", e)
      false
    }
  }

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
      openNotificationAccessSettings()
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

  private companion object {
    const val TAG = "NotificationCapture"
  }
}
