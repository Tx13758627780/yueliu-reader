package app.yueliu.reader;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.security.MessageDigest;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(name = "YueliuUpdater")
public class YueliuUpdaterPlugin extends Plugin {
    private SharedPreferences prefs() { return getContext().getSharedPreferences("yueliu-updates", Context.MODE_PRIVATE); }
    private DownloadManager manager() { return (DownloadManager) getContext().getSystemService(Context.DOWNLOAD_SERVICE); }
    private int flags() { return Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES; }
    private PackageInfo installed() throws Exception { return getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), flags()); }
    private long code(PackageInfo info) { return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode; }
    private boolean canInstall() { return Build.VERSION.SDK_INT < 26 || getContext().getPackageManager().canRequestPackageInstalls(); }
    private File target(String version) throws Exception {
        UpdatePolicy.versionCode(version);
        File base = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
        if (base == null) throw new Exception("下载存储不可用");
        return new File(base, "updates/yueliu-" + version + ".apk");
    }
    private void clear() {
        long id = prefs().getLong("id", -1);
        if (id != -1) manager().remove(id);
        prefs().edit().clear().apply();
    }
    @PluginMethod public void info(PluginCall call) {
        try { PackageInfo info = installed(); call.resolve(new JSObject().put("version", info.versionName).put("versionCode", code(info)).put("canInstall", canInstall())); }
        catch (Exception e) { call.reject("无法读取应用版本", e); }
    }
    @PluginMethod public void download(PluginCall call) {
        try {
            String version = call.getString("version"), url = call.getString("url"), digest = call.getString("sha256", "");
            long size = call.getLong("size", 0L);
            UpdatePolicy.validate(version, url, digest, size, code(installed()));
            File file = target(version);
            clear();
            if (file.exists() && !file.delete()) throw new Exception("旧安装包无法清理，请稍后重试");
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setTitle("阅流 " + version + " 更新");
            request.setDescription("下载完成后返回阅流确认安装");
            request.setMimeType("application/vnd.android.package-archive");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE);
            request.setDestinationInExternalFilesDir(getContext(), Environment.DIRECTORY_DOWNLOADS, "updates/yueliu-" + version + ".apk");
            long id = manager().enqueue(request);
            prefs().edit().putLong("id", id).putString("version", version).putString("sha256", digest).putLong("size", size).apply();
            call.resolve(new JSObject().put("started", true));
        } catch (Exception e) { call.reject(e.getMessage(), e); }
    }
    @PluginMethod public void status(PluginCall call) {
        try {
            String version = prefs().getString("version", "");
            long id = prefs().getLong("id", -1);
            if (id == -1) { call.resolve(new JSObject().put("phase", "idle")); return; }
            if (UpdatePolicy.versionCode(version) <= code(installed())) { clear(); call.resolve(new JSObject().put("phase", "idle")); return; }
            try (Cursor cursor = manager().query(new DownloadManager.Query().setFilterById(id))) {
                if (cursor == null || !cursor.moveToFirst()) { prefs().edit().clear().apply(); call.resolve(new JSObject().put("phase", "idle")); return; }
                int state = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS));
                String phase = state == DownloadManager.STATUS_SUCCESSFUL ? "downloaded" : state == DownloadManager.STATUS_FAILED ? "failed" : state == DownloadManager.STATUS_PAUSED ? "paused" : "downloading";
                long received = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                long total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                int reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON));
                call.resolve(new JSObject().put("phase", phase).put("version", version).put("received", received).put("total", total).put("canInstall", canInstall()).put("message", phase.equals("failed") ? "下载失败（" + reason + "），请检查网络或存储后重试" : phase.equals("paused") ? "等待网络恢复，系统将继续下载" : ""));
            }
        } catch (Exception e) { call.reject("无法读取下载状态", e); }
    }
    @PluginMethod public void cancel(PluginCall call) { try { clear(); call.resolve(); } catch (Exception e) { call.reject("无法取消下载", e); } }
    private Set<String> signatures(PackageInfo info) {
        Signature[] values = Build.VERSION.SDK_INT >= 28 ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        Set<String> result = new HashSet<>();
        if (values != null) for (Signature value : values) result.add(value.toCharsString());
        return result;
    }
    private File verifiedApk() throws Exception {
        String version = prefs().getString("version", "");
        File file = target(version);
        if (!file.isFile() || file.length() != prefs().getLong("size", -1)) throw new Exception("安装包尚未下载完整，请重新下载");
        String expected = prefs().getString("sha256", "");
        if (!expected.isEmpty()) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            try (FileInputStream stream = new FileInputStream(file)) { byte[] buffer = new byte[65536]; int n; while ((n = stream.read(buffer)) != -1) digest.update(buffer, 0, n); }
            StringBuilder actual = new StringBuilder(); for (byte value : digest.digest()) actual.append(String.format("%02x", value & 0xff));
            if (!expected.equalsIgnoreCase(actual.toString())) throw new Exception("安装包校验失败，请重新下载");
        }
        PackageInfo current = installed(), next = getContext().getPackageManager().getPackageArchiveInfo(file.getAbsolutePath(), flags());
        if (next == null || !getContext().getPackageName().equals(next.packageName) || code(next) != UpdatePolicy.versionCode(version) || code(next) <= code(current)) throw new Exception("安装包应用身份或版本不匹配");
        Set<String> own = signatures(current), newer = signatures(next);
        if (own.isEmpty() || !own.equals(newer)) throw new Exception("安装包签名与当前应用不同，无法保留数据覆盖更新。请先导出备份并联系维护者；不要直接卸载旧版。");
        return file;
    }
    @PluginMethod public void install(PluginCall call) {
        getBridge().execute(() -> {
            try {
                File file = verifiedApk();
                getActivity().runOnUiThread(() -> {
                    try {
                        if (!canInstall()) {
                            getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName())));
                            call.resolve(new JSObject().put("permissionRequired", true)); return;
                        }
                        Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".updater", file);
                        Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive");
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        getActivity().startActivity(intent);
                        call.resolve(new JSObject().put("installerOpened", true));
                    } catch (Exception e) { call.reject("无法打开安装界面，请检查系统安装权限", e); }
                });
            } catch (Exception e) { call.reject(e.getMessage(), e); }
        });
    }
}
