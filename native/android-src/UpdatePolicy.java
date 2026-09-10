package app.yueliu.reader;

public final class UpdatePolicy {
    public static int versionCode(String version) {
        if (version == null || !version.matches("\\d{1,4}\\.\\d{1,3}\\.\\d{1,3}")) throw new IllegalArgumentException("无效版本号");
        String[] parts = version.split("\\.");
        long code = Long.parseLong(parts[0]) * 1000000 + Long.parseLong(parts[1]) * 1000 + Long.parseLong(parts[2]);
        if (code <= 0 || code > 2100000000L) throw new IllegalArgumentException("无效版本号");
        return (int) code;
    }
    public static String downloadUrl(String version) {
        versionCode(version);
        return "https://github.com/Tx13758627780/yueliu-reader/releases/download/v" + version + "/Yueliu-Reader-" + version + "-android.apk";
    }
    public static void validate(String version, String url, String digest, long size, long installed) {
        if (versionCode(version) <= installed) throw new IllegalArgumentException("只能安装比当前版本更新的安装包");
        if (!downloadUrl(version).equals(url)) throw new IllegalArgumentException("安装包来源无效");
        if (digest != null && !digest.isEmpty() && !digest.matches("[a-fA-F0-9]{64}")) throw new IllegalArgumentException("安装包校验值无效");
        if (size <= 0 || size > 200000000) throw new IllegalArgumentException("安装包大小无效");
    }
}
