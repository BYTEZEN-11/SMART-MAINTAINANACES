

let mqtt = null;
let _client = null;

const crypto = require('crypto');

const hashApiKey = (raw) =>
  crypto.createHash('sha256').update(String(raw || '')).digest('hex');

const init = (io) => {
  if (_client) return _client;
  const broker = process.env.MQTT_BROKER_URL;
  if (!broker) {
    console.log('[mqtt] disabled (no MQTT_BROKER_URL)');
    return null;
  }

  try {
    mqtt = require('mqtt');
  } catch (e) {
    console.warn('[mqtt] `mqtt` package not installed, skipping');
    return null;
  }

  const topic = process.env.MQTT_TOPIC || 'aihma/+/+/+';
  _client = mqtt.connect(broker, {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 15_000,
  });

  _client.on('connect',     () => console.log(`[mqtt] connected to ${broker}, sub ${topic}`));
  _client.on('reconnect',   () => console.log('[mqtt] reconnecting…'));
  _client.on('error',       (err) => console.warn('[mqtt] error:', err.message));
  _client.on('close',       () => console.log('[mqtt] connection closed'));
  _client.subscribe(topic, { qos: 0 }, (err) => {
    if (err) console.warn('[mqtt] subscribe failed:', err.message);
  });

  _client.on('message', async (t, payloadBuf) => {
    try {
      const parts = t.split('/');                       
      if (parts.length < 4 || parts[0] !== 'aihma') return;
      const [, userId, deviceId, sensorType] = parts;

if (!/^[a-f0-9]{24}$/i.test(String(userId))) {
        console.warn('[mqtt] rejecting topic with non-ObjectId userId:', t);
        return;
      }

if (!payloadBuf || payloadBuf.length > 64 * 1024) {
        console.warn('[mqtt] dropping oversized payload:', payloadBuf && payloadBuf.length);
        return;
      }

      const payload = JSON.parse(payloadBuf.toString());

if (!payload || !payload.apiKey) {
        console.warn('[mqtt] rejecting payload with no apiKey');
        return;
      }
      const presentedHash = hashApiKey(payload.apiKey);
      const ConnectedDevice = require('../models/ConnectedDevice');
      const device = await ConnectedDevice.findOne({
        deviceId,
        user: userId,
        apiKeyHash: presentedHash,
      }).select('_id deviceType appliance').lean();
      if (!device) {
        console.warn('[mqtt] auth failure: device/apiKey/user mismatch');
        return;
      }

const valueNum = Number(payload.value);
      const flat = {
        user: userId,
        deviceId,
        source: sensorType || 'esp32',
        timestamp: new Date(),
        appliance: device.appliance || null,
        raw: payload,
      };
      if (Number.isFinite(valueNum)) {
        switch (sensorType) {
          case 'temperature': flat.temperature = valueNum; break;
          case 'humidity':    flat.humidity    = valueNum; break;
          case 'current':     flat.current     = valueNum; break;
          case 'voltage':     flat.voltage     = valueNum; break;
          case 'power':       flat.power       = valueNum; break;
          case 'frequency':   flat.frequency   = valueNum; break;
          case 'vibration':   flat.vibration   = valueNum; break;
          case 'gas':         flat.gas         = valueNum; break;
          default: flat.raw.value = valueNum; break;
        }
      }

      const SensorReading = require('../models/SensorReading');
      const reading = await SensorReading.create(flat);

const iot = require('./iotAnalysisService');
      const nestedReadings = {};
      if (flat.temperature != null) nestedReadings.temperature = { value: flat.temperature };
      if (flat.humidity != null)    nestedReadings.humidity    = { value: flat.humidity };
      if (flat.power != null || flat.current != null || flat.voltage != null) {
        nestedReadings.power = {
          consumption: flat.power ?? null,
          current: flat.current ?? null,
          voltage: flat.voltage ?? null,
        };
      }
      if (flat.vibration != null)   nestedReadings.vibration = { magnitude: flat.vibration };
      if (flat.gas != null) {
        nestedReadings.gas = { type: 'CO', concentration: flat.gas, threshold: 50, alert: flat.gas > 50 };
      }

const mongoose = require('mongoose');
      const Appliance = require('../models/Appliance');
      let appliance = null;
      const rawApplianceRef = device.appliance;
      if (!rawApplianceRef) {
        appliance = null;
      } else if (typeof rawApplianceRef === 'string' || rawApplianceRef instanceof mongoose.Types.ObjectId) {
        appliance = await Appliance.findById(rawApplianceRef).select('name type brand model').lean();
      } else if (typeof rawApplianceRef === 'object' && rawApplianceRef.type) {
        appliance = rawApplianceRef;
      } else if (typeof rawApplianceRef.toObject === 'function') {
        const obj = rawApplianceRef.toObject();
        if (obj && obj.type) appliance = obj;
      }
      const analysis = await iot
        .analyzeIoTData(
          { readings: nestedReadings },
          { _id: deviceId, deviceType: device.deviceType || sensorType, appliance },
        )
        .catch(() => ({ anomalies: [], metrics: {} }));

      if (analysis.anomalies?.length) {
        await SensorReading.updateOne(
          { _id: reading._id },
          { $set: { anomalies: analysis.anomalies.map((a) => ({
            type: a.type,
            severity: a.severity,
            message: a.description,
          })) } },
        );
      }

if (io) {
        io.to(`user_${userId}`).emit('sensor:reading', {
          deviceId,
          sensorType,
          value: valueNum,
          analysis,
          timestamp: reading.timestamp,
        });
      }
    } catch (e) {
      console.warn('[mqtt] message handler failed:', e.message);
    }
  });

  return _client;
};

module.exports = { init };