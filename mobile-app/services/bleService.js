import { Platform } from 'react-native';
import Constants from 'expo-constants';

let BleManager;
const _isExpoGo = Constants?.appOwnership === 'expo';
if (Platform.OS !== 'web' && !_isExpoGo) {
  try {
    BleManager = require('react-native-ble-plx').BleManager;
  } catch (e) {
    console.warn('react-native-ble-plx not available:', e.message);
  }
} else if (_isExpoGo) {
  console.warn('BLE disabled — native module unavailable in Expo Go. Use a development build for BLE features.');
}

class BLEServiceStub {
  async requestPermissions() {
    console.warn('BLE is not supported on web');
    return false;
  }
  async isBluetoothEnabled() { return false; }
  async scanDevices() { throw new Error('BLE is not supported on web'); }
  stopScan() {}
  async connectToDevice() { throw new Error('BLE is not supported on web'); }
  async disconnectDevice() {}
  async readCharacteristic() { throw new Error('BLE is not supported on web'); }
  async writeCharacteristic() { throw new Error('BLE is not supported on web'); }
  monitorCharacteristic() { throw new Error('BLE is not supported on web'); }
  parseSensorData(rawData) {
    try {
      return JSON.parse(rawData);
    } catch (e) {
      const values = rawData.split(',').map(v => parseFloat(v.trim()));
      return {
        temperature: values[0] || null,
        humidity: values[1] || null,
        vibration: values[2] || null,
        power: values[3] || null
      };
    }
  }
  destroy() {}
}

class BLEService {
  constructor() {
    if (!BleManager) {
      console.warn('BleManager not available — BLE features disabled');
      this.manager = null;
    } else {
      try {
        this.manager = new BleManager();
      } catch (error) {
        console.warn('Failed to initialize BleManager (possibly running in Expo Go or native module missing):', error?.message || error);
        this.manager = null;
      }
    }
    this.connectedDevice = null;
  }

async requestPermissions() {
    if (!this.manager) {
      console.warn('BLE is not available on this platform');
      return false;
    }

    if (Platform.OS === 'android') {
      const { PermissionsAndroid } = require('react-native');
      if (Platform.Version >= 31) {
        
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    return true; 
  }

async isBluetoothEnabled() {
    if (!this.manager) return false;
    const state = await this.manager.state();
    return state === 'PoweredOn';
  }

async scanDevices(onDeviceFound, duration = 10000) {
    if (!this.manager) {
      throw new Error('BLE is not available on this platform');
    }

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      throw new Error('Bluetooth is not enabled');
    }

    const devices = new Map();

    this.manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan error:', error);
        return;
      }

      if (device && device.name && !devices.has(device.id)) {
        devices.set(device.id, device);
        onDeviceFound({
          id: device.id,
          name: device.name,
          rssi: device.rssi,
          serviceUUIDs: device.serviceUUIDs || []
        });
      }
    });

setTimeout(() => {
      this.manager.stopDeviceScan();
    }, duration);
  }

stopScan() {
    if (this.manager) {
      this.manager.stopDeviceScan();
    }
  }

async connectToDevice(deviceId) {
    if (!this.manager) {
      throw new Error('BLE is not available on this platform');
    }
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;
      return device;
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

async disconnectDevice() {
    if (this.connectedDevice) {
      await this.connectedDevice.cancelConnection();
      this.connectedDevice = null;
    }
  }

async readCharacteristic(serviceUUID, characteristicUUID) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const characteristic = await this.connectedDevice.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );
      return this.decodeBase64(characteristic.value);
    } catch (error) {
      console.error('Read error:', error);
      throw error;
    }
  }

async writeCharacteristic(serviceUUID, characteristicUUID, data) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      const base64Data = this.encodeBase64(data);
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Data
      );
    } catch (error) {
      console.error('Write error:', error);
      throw error;
    }
  }

monitorCharacteristic(serviceUUID, characteristicUUID, callback) {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    this.connectedDevice.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.error('Monitor error:', error);
          return;
        }
        const value = this.decodeBase64(characteristic.value);
        callback(value);
      }
    );
  }

decodeBase64(base64) {
    if (!base64) return '';
    return Buffer.from(base64, 'base64').toString('utf-8');
  }

encodeBase64(data) {
    return Buffer.from(data).toString('base64');
  }

parseSensorData(rawData) {
    try {
      
      const data = JSON.parse(rawData);
      return data;
    } catch (e) {

const values = rawData.split(',').map(v => parseFloat(v.trim()));
      
      return {
        temperature: values[0] || null,
        humidity: values[1] || null,
        vibration: values[2] || null,
        power: values[3] || null
      };
    }
  }

destroy() {
    this.stopScan();
    if (this.connectedDevice) {
      this.disconnectDevice();
    }
    if (this.manager) {
      this.manager.destroy();
    }
  }
}

const bleServiceInstance =
  Platform.OS === 'web' || _isExpoGo || !BleManager ? new BLEServiceStub() : new BLEService();
export default bleServiceInstance;

export { BLEServiceStub, BLEService };
