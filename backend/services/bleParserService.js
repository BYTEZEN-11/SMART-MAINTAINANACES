

const MAX_FIELD = 1_000_000;
const MIN_FIELD = -1_000_000;

const toFinite = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n > MAX_FIELD || n < MIN_FIELD) return null;
  return n;
};

const trimObject = (obj) => Object.fromEntries(
  Object.entries(obj).filter(([, v]) => v !== null && v !== undefined)
);

const parseSensorData = (input) => {
  if (input === null || input === undefined) {
    return { ok: false, error: "Empty payload" };
  }

let raw;
  if (typeof input === "string") {
    raw = input;
  } else if (Buffer.isBuffer(input)) {
    raw = input.toString("utf8");
  } else if (typeof input === "object") {
    raw = JSON.stringify(input);
  } else {
    return { ok: false, error: "Unsupported payload type" };
  }

  raw = raw.trim();
  if (!raw) return { ok: false, error: "Empty payload" };

try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const { temperature, humidity, vibration, power, ...extra } = obj;
      return {
        ok: true,
        data: trimObject({
          temperature: toFinite(temperature),
          humidity:    toFinite(humidity),
          vibration:   toFinite(vibration),
          power:       toFinite(power),
          extra: Object.keys(extra).length > 0 ? extra : undefined,
        }),
      };
    }
  } catch (_) {
    
  }

const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { ok: false, error: "No values in payload" };

  const [t, h, v, p] = parts;
  return {
    ok: true,
    data: trimObject({
      temperature: toFinite(t),
      humidity:    toFinite(h),
      vibration:   toFinite(v),
      power:       toFinite(p),
    }),
  };
};

const encodeSensorData = (reading) => {
  if (!reading || typeof reading !== "object") return null;
  return JSON.stringify(trimObject({
    temperature: toFinite(reading.temperature),
    humidity:    toFinite(reading.humidity),
    vibration:   toFinite(reading.vibration),
    power:       toFinite(reading.power),
  }));
};

module.exports = {
  parseSensorData,
  encodeSensorData,
};
