package in.adgips.secf;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoftHapticsPlugin.class);
        super.onCreate(savedInstanceState);
        stripBrowserChrome();
        publishInsets();
    }

    @Override
    public void onResume() {
        super.onResume();
        // Capacitor configures the WebView after onCreate, which puts the scrollbar
        // back. Re-applying on resume is what makes it stay gone.
        stripBrowserChrome();
    }

    /**
     * The WebView draws its own scrollbars and its own overscroll glow, as a native
     * View, before the page gets a say. No CSS reaches them — `scrollbar-width` and
     * `::-webkit-scrollbar` only govern what the page paints inside the viewport.
     * Turning them off here is what makes the wrapped page stop reading as a browser.
     */
    private void stripBrowserChrome() {
        final WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) {
            return;
        }

        // The page is bundled in the APK, so there is nothing to save by caching it —
        // and a stale cached index.html survives a reinstall, which makes a shipped fix
        // look like it did nothing. Always read the file that was installed.
        WebSettings settings = webView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        Runnable strip = () -> {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setScrollbarFadingEnabled(true);
            webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
            webView.setBackgroundColor(0xFF000000);   // the theme's ground; anything else is a visible frame
        };

        strip.run();
        // and again after the current layout pass, once Capacitor has finished its own setup
        webView.post(strip);
    }

    /**
     * env(safe-area-inset-*) is populated from the display CUTOUT only — the notch.
     * The status bar and the gesture pill are systemBars() insets and never reach CSS
     * at all, so on a phone with no notch the header sat under the clock and the nav
     * sat under the gesture bar. targetSdk 36 makes edge-to-edge mandatory, so there
     * is no opting out; the insets have to be handed to the page by hand.
     *
     * ime() goes across too: the sign-in and claim forms have their CTA below four
     * fields, and with the keyboard up and nothing consuming the inset it is
     * unreachable.
     */
    private void publishInsets() {
        final WebView webView = getBridge() == null ? null : getBridge().getWebView();
        if (webView == null) {
            return;
        }
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, insets) -> {
            Insets bars = insets.getInsets(WindowInsetsCompat.Type.systemBars());
            Insets ime = insets.getInsets(WindowInsetsCompat.Type.ime());
            float d = getResources().getDisplayMetrics().density;
            String js = "document.documentElement.style.setProperty('--sa-top','" + (bars.top / d) + "px');"
                    + "document.documentElement.style.setProperty('--sa-bottom','" + (bars.bottom / d) + "px');"
                    + "document.documentElement.style.setProperty('--sa-ime','" + (ime.bottom / d) + "px');";
            webView.evaluateJavascript(js, null);
            return insets;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
