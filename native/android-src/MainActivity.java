package app.yueliu.reader;

import android.os.Bundle;
import android.os.SystemClock;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private final BackExitGate exitGate = new BackExitGate();
    private boolean backInFlight = false;
    private Toast exitToast;
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(YueliuFilesPlugin.class);
        super.onCreate(savedInstanceState);
        // Keep the entire WebView (including dialogs) clear of system controls.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        View content = findViewById(android.R.id.content);
        int topGap = Math.round(8 * getResources().getDisplayMetrics().density);
        int bottomGap = Math.round(4 * getResources().getDisplayMetrics().density);
        ViewCompat.setOnApplyWindowInsetsListener(content, (view, windowInsets) -> {
            Insets safe = windowInsets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            Insets keyboard = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            view.setPadding(safe.left, safe.top + topGap, safe.right,
                Math.max(safe.bottom + bottomGap, keyboard.bottom));
            // Insets have been applied here; prevent WebView applying them again.
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(content);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override public void handleOnBackPressed() {
                WindowInsetsCompat insets = ViewCompat.getRootWindowInsets(content);
                if (insets != null && insets.isVisible(WindowInsetsCompat.Type.ime())) {
                    WindowCompat.getInsetsController(getWindow(), content).hide(WindowInsetsCompat.Type.ime());
                    resetExit(); return;
                }
                if (backInFlight || getBridge() == null) return;
                backInFlight = true;
                getBridge().getWebView().evaluateJavascript(
                    "window.__yueliuBack ? window.__yueliuBack() : 'loading'", result -> {
                        if ("\"root\"".equals(result)) {
                            if (exitGate.shouldExit(SystemClock.elapsedRealtime())) {
                                if (exitToast != null) exitToast.cancel();
                                finishAndRemoveTask();
                            } else {
                                if (exitToast != null) exitToast.cancel();
                                exitToast = Toast.makeText(MainActivity.this, "再次滑动返回退出应用", Toast.LENGTH_SHORT);
                                exitToast.show();
                            }
                        } else {
                            resetExit();
                        }
                        // Allow React to finish closing the current layer before another back.
                        content.postDelayed(() -> backInFlight = false, 180);
                    });
            }
        });
    }
    private void resetExit() { exitGate.reset(); if (exitToast != null) exitToast.cancel(); }
    @Override public void onPause() { resetExit(); super.onPause(); }
}
