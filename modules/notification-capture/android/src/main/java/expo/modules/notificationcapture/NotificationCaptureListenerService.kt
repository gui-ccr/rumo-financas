package expo.modules.notificationcapture

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

class NotificationCaptureListenerService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return
    try {
      val packageName: String = sbn.packageName ?: return

      // Privacidade: nada de outros apps é lido nem guardado.
      if (packageName !in CaptureStore.getWatched(applicationContext)) return

      if (sbn.isOngoing) return
      val notification = sbn.notification ?: return
      if ((notification.flags and Notification.FLAG_GROUP_SUMMARY) != 0) return
      val extras = notification.extras ?: return

      val capture = RawCapture(
        key = "${sbn.key}|${sbn.postTime}",
        packageName = packageName,
        title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString(),
        text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString(),
        bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString(),
        postedAt = sbn.postTime,
      )
      CaptureStore.add(applicationContext, capture)
    } catch (e: Exception) {
      // Nunca deixar uma exceção derrubar o listener do sistema.
      Log.w(TAG, "Falha ao capturar notificação", e)
    }
  }

  companion object {
    private const val TAG = "NotifCapture"
  }
}
