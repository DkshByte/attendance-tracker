package in.adgips.secf;

import android.os.Build;
import android.view.HapticFeedbackConstants;
import android.view.View;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Soft haptics.
 *
 * @capacitor/haptics drives the vibrator motor directly — its "selection" effect is
 * a 100ms buzz at amplitude 100, and its light impact is not much better. A hundred
 * milliseconds is an age: real UI feedback is 5-15ms. That is why it feels harsh, and
 * no amount of tuning from JavaScript fixes it, because the duration is baked into
 * the plugin.
 *
 * performHapticFeedback is the API Android's own UI uses. The constants map to
 * effects the phone's manufacturer tuned for that exact motor, they are an order of
 * magnitude shorter, and they follow the user's system haptic strength setting
 * instead of ignoring it.
 */
@CapacitorPlugin(name = "SoftHaptics")
public class SoftHapticsPlugin extends Plugin {

    @PluginMethod
    public void tap(PluginCall call) {
        final String kind = call.getString("kind", "tick");
        final View view = getBridge().getWebView();

        if (view == null) {
            call.resolve();
            return;
        }

        // performHapticFeedback is a View call and belongs on the UI thread
        getActivity().runOnUiThread(() -> view.performHapticFeedback(effectFor(kind)));
        call.resolve();
    }

    private int effectFor(String kind) {
        switch (kind) {
            // a completed action: saved, marked, signed in
            case "confirm":
                return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                        ? HapticFeedbackConstants.CONFIRM
                        : HapticFeedbackConstants.KEYBOARD_TAP;

            // something refused: wrong password, failed fingerprint
            case "reject":
                return Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                        ? HapticFeedbackConstants.REJECT
                        : HapticFeedbackConstants.LONG_PRESS;

            // a plain button, slightly more present than a tick
            case "tap":
                return HapticFeedbackConstants.VIRTUAL_KEY;

            // the default, and the quietest thing the platform offers
            default:
                return HapticFeedbackConstants.CLOCK_TICK;
        }
    }
}
