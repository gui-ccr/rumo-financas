package expo.modules.notificationcapture

import android.content.ComponentName
import android.content.Context
import android.provider.Settings
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

data class RawCapture(
  val key: String,
  val packageName: String,
  val title: String?,
  val text: String?,
  val bigText: String?,
  val postedAt: Long,
) {
  fun toJson(): JSONObject = JSONObject()
    .put("key", key)
    .put("packageName", packageName)
    .put("title", title ?: JSONObject.NULL)
    .put("text", text ?: JSONObject.NULL)
    .put("bigText", bigText ?: JSONObject.NULL)
    .put("postedAt", postedAt)

  fun toMap(): Map<String, Any?> = mapOf(
    "key" to key,
    "packageName" to packageName,
    "title" to title,
    "text" to text,
    "bigText" to bigText,
    "postedAt" to postedAt,
  )

  companion object {
    private fun JSONObject.optStr(name: String): String? =
      if (isNull(name)) null else getString(name)

    fun fromJson(o: JSONObject): RawCapture = RawCapture(
      key = o.getString("key"),
      packageName = o.getString("packageName"),
      title = o.optStr("title"),
      text = o.optStr("text"),
      bigText = o.optStr("bigText"),
      postedAt = o.getLong("postedAt"),
    )
  }
}

/**
 * Fila durável (SharedPreferences + JSON) de notificações capturadas.
 * Usada tanto pelo NotificationListenerService (app fechado) quanto pelo módulo JS.
 */
object CaptureStore {
  private const val PREFS_NAME = "notification_capture"
  private const val KEY_QUEUE = "queue"
  private const val KEY_WATCHED = "watched_packages"
  private const val MAX_ITEMS = 500
  private const val ENABLED_LISTENERS_KEY = "enabled_notification_listeners"

  val DEFAULT_WATCHED: List<String> = listOf("com.nu.production")

  private val lock = Any()

  /** Callback registrado enquanto o módulo JS está observando o evento onCapture. */
  @Volatile
  var onCapture: ((RawCapture) -> Unit)? = null

  private fun prefs(context: Context) =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  fun getWatched(context: Context): List<String> {
    val raw = prefs(context).getString(KEY_WATCHED, null) ?: return DEFAULT_WATCHED
    return try {
      val arr = JSONArray(raw)
      (0 until arr.length()).map { arr.getString(it) }
    } catch (e: JSONException) {
      DEFAULT_WATCHED
    }
  }

  fun setWatched(context: Context, packages: List<String>) {
    val arr = JSONArray()
    packages.distinct().forEach { arr.put(it) }
    prefs(context).edit().putString(KEY_WATCHED, arr.toString()).commit()
  }

  /** Adiciona uma captura. Retorna false se a key já estava na fila. */
  fun add(context: Context, capture: RawCapture): Boolean {
    synchronized(lock) {
      val items = readQueue(context)
      for (i in 0 until items.length()) {
        if (items.getJSONObject(i).optString("key") == capture.key) return false
      }
      items.put(capture.toJson())

      val start = maxOf(0, items.length() - MAX_ITEMS)
      val trimmed = JSONArray()
      for (i in start until items.length()) trimmed.put(items.get(i))

      prefs(context).edit().putString(KEY_QUEUE, trimmed.toString()).commit()
    }
    onCapture?.invoke(capture)
    return true
  }

  /** Retorna a fila inteira e a esvazia, de forma atômica. */
  fun drain(context: Context): List<RawCapture> {
    synchronized(lock) {
      val items = readQueue(context)
      prefs(context).edit().putString(KEY_QUEUE, "[]").commit()
      return (0 until items.length()).mapNotNull { i ->
        try {
          RawCapture.fromJson(items.getJSONObject(i))
        } catch (e: JSONException) {
          null
        }
      }
    }
  }

  private fun readQueue(context: Context): JSONArray {
    val raw = prefs(context).getString(KEY_QUEUE, null) ?: return JSONArray()
    return try {
      JSONArray(raw)
    } catch (e: JSONException) {
      JSONArray()
    }
  }

  /** true se o usuário habilitou este app como listener em Settings.Secure. */
  fun hasListenerPermission(context: Context): Boolean {
    // Settings.Secure.ENABLED_NOTIFICATION_LISTENERS é @hide; a chave é pública na prática.
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      ENABLED_LISTENERS_KEY,
    ) ?: return false
    val component = ComponentName(context, NotificationCaptureListenerService::class.java)
    return enabled.split(":").any { ComponentName.unflattenFromString(it) == component }
  }
}
