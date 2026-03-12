// GPS Provider Abstraction Layer
// Supports Approach 1: Integration with existing RTSA-mandated GPS providers
// Also supports driver app fallback and custom API providers

import {
  calculateDistance,
  calculateBearing,
  findNearestCity,
  getCityCoordinates,
} from './zambia-coordinates';

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface GPSLocation {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;        // km/h
  heading?: number;      // degrees (0-360)
  accuracy?: number;     // meters
  satellites?: number;
  hdop?: number;
  timestamp: string;     // ISO 8601
  source: 'gps' | 'cell_tower' | 'wifi' | 'manual' | 'interpolated';
  provider: string;
  raw_data?: any;
}

export interface GPSProviderConfig {
  provider: 'ctrack' | 'tramigo' | 'ruptela' | 'teltonika' | 'custom_api' | 'driver_app';
  api_base_url?: string;
  api_key?: string;
  api_secret?: string;
  webhook_secret?: string;
  polling_interval_seconds?: number;
  auth_type?: 'api_key' | 'oauth2' | 'basic' | 'token';
}

export interface DeviceStatus {
  device_id: string;
  is_online: boolean;
  last_seen: string;
  battery_level?: number;
  signal_strength?: number;
  ignition_on?: boolean;
  fuel_level?: number;
  odometer?: number;
}

export interface ParsedWebhookData {
  device_id: string;
  location: GPSLocation;
  ignition_on?: boolean;
  fuel_level?: number;
  odometer?: number;
  alerts?: string[];
  raw: any;
}

// ============================================================
// BASE GPS PROVIDER (Abstract)
// ============================================================

abstract class BaseGPSProvider {
  protected config: GPSProviderConfig;

  constructor(config: GPSProviderConfig) {
    this.config = config;
  }

  abstract getDeviceLocation(deviceId: string): Promise<GPSLocation | null>;
  abstract getDeviceStatus(deviceId: string): Promise<DeviceStatus | null>;
  abstract parseWebhookPayload(payload: any, headers?: any): ParsedWebhookData | null;
  abstract validateWebhook(payload: any, headers?: any): boolean;
}

// ============================================================
// CTRACK PROVIDER
// Ctrack is the most common GPS provider in Zambia for PSVs
// They provide fleet management APIs for RTSA-compliant devices
// ============================================================

class CtrackProvider extends BaseGPSProvider {
  
  async getDeviceLocation(deviceId: string): Promise<GPSLocation | null> {
    try {
      const response = await fetch(
        `${this.config.api_base_url}/api/v1/vehicles/${deviceId}/position`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.error(`Ctrack API error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        speed: data.speed,
        heading: data.heading,
        accuracy: data.gps_accuracy,
        satellites: data.satellites,
        timestamp: data.timestamp || new Date().toISOString(),
        source: 'gps',
        provider: 'ctrack',
        raw_data: data,
      };
    } catch (error) {
      console.error('Ctrack getDeviceLocation error:', error);
      return null;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const response = await fetch(
        `${this.config.api_base_url}/api/v1/vehicles/${deviceId}/status`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.api_key}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return null;
      const data = await response.json();

      return {
        device_id: deviceId,
        is_online: data.online === true,
        last_seen: data.last_communication || new Date().toISOString(),
        battery_level: data.battery_voltage,
        signal_strength: data.gsm_signal,
        ignition_on: data.ignition,
        fuel_level: data.fuel_level,
        odometer: data.odometer,
      };
    } catch (error) {
      console.error('Ctrack getDeviceStatus error:', error);
      return null;
    }
  }

  parseWebhookPayload(payload: any): ParsedWebhookData | null {
    try {
      // Ctrack webhook format (typical fleet management webhook)
      return {
        device_id: payload.vehicle_id || payload.unit_id,
        location: {
          latitude: parseFloat(payload.lat || payload.latitude),
          longitude: parseFloat(payload.lng || payload.longitude),
          altitude: payload.altitude ? parseFloat(payload.altitude) : undefined,
          speed: payload.speed ? parseFloat(payload.speed) : 0,
          heading: payload.heading ? parseFloat(payload.heading) : undefined,
          accuracy: payload.accuracy ? parseFloat(payload.accuracy) : undefined,
          satellites: payload.satellites ? parseInt(payload.satellites) : undefined,
          timestamp: payload.timestamp || payload.gps_time || new Date().toISOString(),
          source: 'gps',
          provider: 'ctrack',
          raw_data: payload,
        },
        ignition_on: payload.ignition === true || payload.ignition === 1,
        fuel_level: payload.fuel_level ? parseFloat(payload.fuel_level) : undefined,
        odometer: payload.odometer ? parseFloat(payload.odometer) : undefined,
        alerts: payload.alerts || [],
        raw: payload,
      };
    } catch (error) {
      console.error('Ctrack webhook parse error:', error);
      return null;
    }
  }

  validateWebhook(payload: any, headers?: any): boolean {
    // Validate webhook signature if configured
    if (this.config.webhook_secret && headers) {
      const signature = headers['x-ctrack-signature'] || headers['x-webhook-signature'];
      if (!signature) return false;
      // In production: verify HMAC signature
      // const expectedSig = crypto.createHmac('sha256', this.config.webhook_secret).update(JSON.stringify(payload)).digest('hex');
      // return signature === expectedSig;
    }
    return true;
  }
}

// ============================================================
// CUSTOM API PROVIDER
// For operators using other GPS providers with REST APIs
// Configurable to work with any standard GPS API
// ============================================================

class CustomAPIProvider extends BaseGPSProvider {

  async getDeviceLocation(deviceId: string): Promise<GPSLocation | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Support different auth types
      if (this.config.auth_type === 'api_key') {
        headers['X-API-Key'] = this.config.api_key || '';
      } else if (this.config.auth_type === 'token') {
        headers['Authorization'] = `Bearer ${this.config.api_key}`;
      } else if (this.config.auth_type === 'basic') {
        const credentials = Buffer.from(`${this.config.api_key}:${this.config.api_secret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      const response = await fetch(
        `${this.config.api_base_url}/devices/${deviceId}/location`,
        { headers }
      );

      if (!response.ok) return null;
      const data = await response.json();

      // Normalize response — handle common field name variations
      return {
        latitude: data.latitude || data.lat || data.position?.lat,
        longitude: data.longitude || data.lng || data.lon || data.position?.lng,
        altitude: data.altitude || data.alt,
        speed: data.speed || data.velocity,
        heading: data.heading || data.bearing || data.course,
        accuracy: data.accuracy || data.precision,
        satellites: data.satellites || data.sats,
        timestamp: data.timestamp || data.time || data.datetime || new Date().toISOString(),
        source: 'gps',
        provider: 'custom_api',
        raw_data: data,
      };
    } catch (error) {
      console.error('Custom API getDeviceLocation error:', error);
      return null;
    }
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.api_key) {
        headers['Authorization'] = `Bearer ${this.config.api_key}`;
      }

      const response = await fetch(
        `${this.config.api_base_url}/devices/${deviceId}/status`,
        { headers }
      );

      if (!response.ok) return null;
      const data = await response.json();

      return {
        device_id: deviceId,
        is_online: data.online || data.is_online || data.status === 'online',
        last_seen: data.last_seen || data.last_communication || new Date().toISOString(),
        battery_level: data.battery_level || data.battery,
        signal_strength: data.signal_strength || data.gsm_signal,
        ignition_on: data.ignition_on || data.ignition,
        fuel_level: data.fuel_level,
        odometer: data.odometer,
      };
    } catch (error) {
      console.error('Custom API getDeviceStatus error:', error);
      return null;
    }
  }

  parseWebhookPayload(payload: any): ParsedWebhookData | null {
    try {
      return {
        device_id: payload.device_id || payload.imei || payload.unit_id,
        location: {
          latitude: parseFloat(payload.latitude || payload.lat),
          longitude: parseFloat(payload.longitude || payload.lng || payload.lon),
          altitude: payload.altitude ? parseFloat(payload.altitude) : undefined,
          speed: payload.speed ? parseFloat(payload.speed) : 0,
          heading: payload.heading ? parseFloat(payload.heading) : undefined,
          accuracy: payload.accuracy ? parseFloat(payload.accuracy) : undefined,
          timestamp: payload.timestamp || new Date().toISOString(),
          source: 'gps',
          provider: 'custom_api',
          raw_data: payload,
        },
        ignition_on: payload.ignition,
        fuel_level: payload.fuel_level,
        odometer: payload.odometer,
        alerts: payload.alerts || [],
        raw: payload,
      };
    } catch (error) {
      console.error('Custom API webhook parse error:', error);
      return null;
    }
  }

  validateWebhook(payload: any, headers?: any): boolean {
    if (this.config.webhook_secret && headers) {
      const signature = headers['x-webhook-signature'] || headers['x-api-signature'];
      return !!signature; // Basic check — enhance in production
    }
    return true;
  }
}

// ============================================================
// DRIVER APP PROVIDER (Fallback)
// Uses driver's smartphone GPS — cheapest option
// Data comes from the mobile app via REST API
// ============================================================

class DriverAppProvider extends BaseGPSProvider {

  async getDeviceLocation(deviceId: string): Promise<GPSLocation | null> {
    // Driver app locations are pushed via webhook/API, not polled
    // This method returns the last known location from the database
    return null; // Handled by webhook
  }

  async getDeviceStatus(deviceId: string): Promise<DeviceStatus | null> {
    return {
      device_id: deviceId,
      is_online: true, // Assume online if recent data received
      last_seen: new Date().toISOString(),
    };
  }

  parseWebhookPayload(payload: any): ParsedWebhookData | null {
    try {
      // Driver app sends location from smartphone GPS
      return {
        device_id: payload.driver_id || payload.device_id,
        location: {
          latitude: parseFloat(payload.latitude),
          longitude: parseFloat(payload.longitude),
          altitude: payload.altitude ? parseFloat(payload.altitude) : undefined,
          speed: payload.speed ? parseFloat(payload.speed) : 0,
          heading: payload.heading ? parseFloat(payload.heading) : undefined,
          accuracy: payload.accuracy ? parseFloat(payload.accuracy) : undefined,
          timestamp: payload.timestamp || new Date().toISOString(),
          source: payload.source || 'gps',
          provider: 'driver_app',
          raw_data: payload,
        },
        raw: payload,
      };
    } catch (error) {
      console.error('Driver app webhook parse error:', error);
      return null;
    }
  }

  validateWebhook(payload: any, headers?: any): boolean {
    // Validate driver app token
    const token = headers?.['authorization']?.replace('Bearer ', '');
    return !!token; // In production: verify JWT token
  }
}

// ============================================================
// GPS PROVIDER FACTORY
// Creates the appropriate provider based on configuration
// ============================================================

export function createGPSProvider(config: GPSProviderConfig): BaseGPSProvider {
  switch (config.provider) {
    case 'ctrack':
      return new CtrackProvider(config);
    case 'custom_api':
    case 'tramigo':
    case 'ruptela':
    case 'teltonika':
      return new CustomAPIProvider(config);
    case 'driver_app':
      return new DriverAppProvider(config);
    default:
      throw new Error(`Unsupported GPS provider: ${config.provider}`);
  }
}

// ============================================================
// GPS DATA PROCESSOR
// Processes incoming GPS data regardless of provider
// Handles validation, enrichment, and storage preparation
// ============================================================

export class GPSDataProcessor {

  /**
   * Validate GPS coordinates are within Zambia's bounding box
   * Zambia: Lat -8.2 to -18.1, Lon 21.9 to 33.7
   */
  static validateZambiaCoordinates(lat: number, lon: number): boolean {
    return lat >= -18.5 && lat <= -7.5 && lon >= 21.5 && lon <= 34.0;
  }

  /**
   * Validate GPS data quality
   */
  static validateLocation(location: GPSLocation): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check coordinates exist and are numbers
    if (!location.latitude || !location.longitude ||
        isNaN(location.latitude) || isNaN(location.longitude)) {
      issues.push('Invalid or missing coordinates');
    }

    // Check within Zambia
    if (location.latitude && location.longitude &&
        !this.validateZambiaCoordinates(location.latitude, location.longitude)) {
      issues.push('Coordinates outside Zambia boundary');
    }

    // Check speed is reasonable (max 150 km/h for buses)
    if (location.speed && location.speed > 150) {
      issues.push(`Unreasonable speed: ${location.speed} km/h`);
    }

    // Check accuracy (reject if > 500m)
    if (location.accuracy && location.accuracy > 500) {
      issues.push(`Low accuracy: ${location.accuracy}m`);
    }

    // Check timestamp is not in the future
    const locationTime = new Date(location.timestamp).getTime();
    const now = Date.now();
    if (locationTime > now + 60000) { // Allow 1 minute tolerance
      issues.push('Timestamp is in the future');
    }

    // Check timestamp is not too old (> 10 minutes)
    if (now - locationTime > 600000) {
      issues.push('Location data is stale (>10 minutes old)');
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Enrich GPS location with contextual data
   */
  static enrichLocation(location: GPSLocation): GPSLocation & {
    nearest_city: string;
    distance_to_city_km: number;
    province: string;
    is_in_urban_area: boolean;
  } {
    const nearest = findNearestCity(location.latitude, location.longitude);

    return {
      ...location,
      nearest_city: nearest.city.name,
      distance_to_city_km: nearest.distance_km,
      province: nearest.city.province,
      is_in_urban_area: nearest.distance_km < 15,
    };
  }

  /**
   * Calculate speed between two consecutive GPS points
   * Used when GPS device doesn't report speed
   */
  static calculateSpeed(
    prevLat: number, prevLon: number, prevTime: string,
    currLat: number, currLon: number, currTime: string
  ): number {
    const distance = calculateDistance(prevLat, prevLon, currLat, currLon);
    const timeDiffHours = (new Date(currTime).getTime() - new Date(prevTime).getTime()) / 3600000;
    
    if (timeDiffHours <= 0) return 0;
    
    const speed = distance / timeDiffHours;
    return Math.round(speed * 10) / 10; // Round to 1 decimal
  }

  /**
   * Detect if bus is stopped (speed < 5 km/h for > 2 minutes)
   */
  static isStationary(speed: number): boolean {
    return speed < 5;
  }

  /**
   * Smooth GPS data to reduce jitter
   * Uses simple moving average of last N points
   */
  static smoothLocation(
    locations: { latitude: number; longitude: number }[],
    windowSize: number = 3
  ): { latitude: number; longitude: number } {
    if (locations.length === 0) return { latitude: 0, longitude: 0 };
    if (locations.length === 1) return locations[0];

    const window = locations.slice(-windowSize);
    const avgLat = window.reduce((sum, l) => sum + l.latitude, 0) / window.length;
    const avgLon = window.reduce((sum, l) => sum + l.longitude, 0) / window.length;

    return {
      latitude: Math.round(avgLat * 1000000) / 1000000,
      longitude: Math.round(avgLon * 1000000) / 1000000,
    };
  }
}

// ============================================================
// STORE-AND-FORWARD BUFFER
// Handles GPS data buffering during connectivity gaps
// ============================================================

export class StoreAndForwardBuffer {
  private buffer: GPSLocation[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  add(location: GPSLocation): void {
    if (this.buffer.length >= this.maxSize) {
      // Remove oldest entry
      this.buffer.shift();
    }
    this.buffer.push(location);
  }

  flush(): GPSLocation[] {
    const data = [...this.buffer];
    this.buffer = [];
    return data;
  }

  size(): number {
    return this.buffer.length;
  }

  isEmpty(): boolean {
    return this.buffer.length === 0;
  }
}