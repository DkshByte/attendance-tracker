package in.adgips.secf;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoftHapticsPlugin.class);
        super.onCreate(savedInstanceState);
        stripBrowserChrome();
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
            webView.setBackgroundColor(0xFF07090C);   // no white frame before first paint
        };

        strip.run();
        // and again after the current layout pass, once Capacitor has finished its own setup
        webView.post(strip);
    }
}
