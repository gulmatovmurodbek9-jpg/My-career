// Интернети суст (20.10): 2G/3G ё «сарфаи трафик». Safari ин маълумотро намедиҳад — он гоҳ false.
export const slowNetwork = () => {
    const connection = typeof navigator !== "undefined" ? navigator.connection : null;
    if (!connection) return false;
    return Boolean(connection.saveData) || /(^|-)(2g|3g)$/.test(String(connection.effectiveType || ""));
};

// Сабти садо барои шинохти нутқ: Opus бо 24 кбит/с (пешфарзи браузер то 128 кбит/с) —
// порчаи 5-сонияӣ ~15 КБ, на ~80 КБ.
export const recorderFor = (stream) => {
    const types = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];
    const mimeType = typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported
        ? types.find((type) => MediaRecorder.isTypeSupported(type)) : undefined;
    try {
        return new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 24000 });
    } catch {
        return new MediaRecorder(stream);
    }
};
