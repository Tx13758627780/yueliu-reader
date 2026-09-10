package app.yueliu.reader;

/** Requires two back actions at the root within three seconds. */
public final class BackExitGate {
    private long promptedAt = -1;
    public boolean shouldExit(long now) {
        if (promptedAt >= 0 && now >= promptedAt && now - promptedAt <= 3000) {
            reset(); return true;
        }
        promptedAt = now; return false;
    }
    public void reset() { promptedAt = -1; }
}
