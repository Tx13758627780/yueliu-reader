package app.yueliu.reader;

import android.app.Activity;
import android.content.Intent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "YueliuFiles")
public class YueliuFilesPlugin extends Plugin {
    private boolean choosing = false;

    @PluginMethod public void saveText(PluginCall call) {
        String name = call.getString("name"), text = call.getString("text");
        if (name == null || !name.matches("[A-Za-z0-9._-]{1,120}") || text == null || text.length() > 150000000) {
            call.reject("文件格式或大小无效"); return;
        }
        if (choosing) { call.reject("请先完成上一次导出"); return; }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(name.endsWith(".json") ? "application/json" : "text/xml");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        choosing = true;
        try { startActivityForResult(call, intent, "savedFile"); }
        catch (Exception error) { choosing = false; call.reject("无法打开系统文件保存窗口", error); }
    }

    @ActivityCallback private void savedFile(PluginCall call, ActivityResult result) {
        choosing = false;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            call.resolve(new JSObject().put("saved", false)); return;
        }
        getBridge().execute(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(result.getData().getData(), "wt")) {
                if (stream == null) throw new java.io.IOException("无法写入文件");
                try (OutputStreamWriter writer = new OutputStreamWriter(stream, StandardCharsets.UTF_8)) {
                    writer.write(call.getString("text", ""));
                }
                call.resolve(new JSObject().put("saved", true));
            } catch (Exception error) { call.reject("文件未能保存，请重新选择位置", error); }
        });
    }
}
