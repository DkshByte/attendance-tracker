package in.adgips.secf;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SoftHapticsPlugin.class);
        super.onCreate(savedInstanceState);

        /*
         * The WebView draws its own scrollbars and its own overscroll glow, as a native
         * View, before the page gets a say. No CSS reaches them — `scrollbar-width` and
         * `::-webkit-scrollbar` only govern what the page paints inside the viewport.
         * Turning them off here is what makes the wrapped page stop reading as a browser.
         */
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
            webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);
            webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        }
    }
}
