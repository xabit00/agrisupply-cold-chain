// ============================================================================
// AGRI-SUPPLY & COLD-CHAIN DOMAIN MODEL - SINGLE SOURCE OF TRUTH
// ============================================================================

// --- 1. USER & ROLE-BASED ACCESS CONTROL (RBAC) ---
export type UserRole = 'Farmer' | 'Transporter' | 'WarehouseAdmin' | 'Retailer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthSession {
  user: User;
  token: string;
}

// --- 2. PRODUCE & SHIPMENT ---
export type ProduceCategory =
  | 'Dairy'
  | 'Fruits'
  | 'Vegetables'
  | 'Meat'
  | 'Seafood'
  | 'Flowers';

export interface ProduceItem {
  id: string;
  name: string;
  category: ProduceCategory;
  quantityKg: number;
  optimalTempMin: number; // Celsius
  optimalTempMax: number; // Celsius
  optimalHumidityMin: number; // Percentage
  optimalHumidityMax: number; // Percentage
}

export type ShipmentStatus =
  | 'Draft'
  | 'Harvested'
  | 'InTransit'
  | 'ColdStorage'
  | 'Delivered'
  | 'Compromised';

/** Temperature-control regime applied during storage and transport. */
export type StorageMode = 'Ambient' | 'Refrigerated' | 'Frozen';

/** Where the lot is handed over; drives which custodian id is mandatory. */
export type DestinationType = 'Warehouse' | 'RetailOutlet' | 'DirectConsumer';

export interface GeoCoordinate {
  lat: number;
  lng: number;
  altitude?: number;
}

export interface LocationCheckpoint {
  name: string;
  address: string;
  coordinates: GeoCoordinate;
  reachedAt?: string;
}

export type PhotoSource = 'camera' | 'upload';

export interface ShipmentPhoto {
  id: string;
  label: string;
  dataUrl: string;
  source: PhotoSource;
  capturedAt: string;
  sizeBytes: number;
}

/** Splittable transport unit (reefer pallet / container) with its own seal. */
export interface ShipmentContainer {
  id: string;
  label: string;
  quantityKg: number;
  sealId?: string;
}

/** Chain-of-custody compliance metadata captured at registration time. */
export interface ShipmentCompliance {
  destinationType: DestinationType;
  requiresTransport: boolean;
  tamperSealEnabled: boolean;
  sealId?: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  farmerId: string;
  transporterId?: string;
  warehouseId?: string;
  retailerId?: string;
  produce: ProduceItem;
  origin: LocationCheckpoint;
  destination: LocationCheckpoint;
  status: ShipmentStatus;
  storageMode?: StorageMode;
  containers?: ShipmentContainer[];
  compliance?: ShipmentCompliance;
  currentLocation?: GeoCoordinate;
  temperatureAlert: boolean;
  humidityAlert: boolean;
  tamperAlert: boolean;
  photos?: ShipmentPhoto[];
  notes?: string;
  createdAt: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  updatedAt: string;
}

/**
 * Create-request DTO accepted by POST /api/shipments.
 * Validated by the SAME zod schema on the client (multi-step form) and on the
 * server (route handler), so validation rules can never drift.
 */
export interface ShipmentCreateRequest {
  farmerId: string;
  destinationType: DestinationType;
  requiresTransport: boolean;
  transporterId?: string;
  warehouseId?: string;
  retailerId?: string;
  storageMode: StorageMode;
  tamperSealEnabled: boolean;
  sealId?: string;
  splitsIntoContainers: boolean;
  containers: ShipmentContainer[];
  photos: ShipmentPhoto[];
  notes?: string;
  produce: {
    name: string;
    category: ProduceCategory;
    quantityKg: number;
    optimalTempMin?: number;
    optimalTempMax?: number;
    optimalHumidityMin?: number;
    optimalHumidityMax?: number;
  };
  origin: {
    name: string;
    address: string;
  };
  destination: {
    name: string;
    address: string;
  };
}

// --- 3. SENSOR & TELEMETRY (IoT) ---
export interface SensorReading {
  id: string;
  shipmentId: string;
  temperature: number; // Celsius
  humidity: number; // Percentage (0-100)
  batteryPct: number; // 0-100
  signalStrengthDbm: number;
  ambientLightLux?: number;
  location: GeoCoordinate;
  timestamp: string;
  isBreached: boolean;
  breachReason?: 'TEMP_HIGH' | 'TEMP_LOW' | 'HUMIDITY_HIGH' | 'HUMIDITY_LOW' | 'TAMPER';
}

export interface ColdChainThresholds {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
}

// --- 4. PIPELINE / ORDER / KANBAN STAGES ---
export type PipelineStage =
  | 'order_placed'
  | 'packed_inspected'
  | 'in_transit'
  | 'warehouse_hold'
  | 'out_for_delivery'
  | 'completed';

export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Order {
  id: string;
  shipmentId: string;
  orderNumber: string;
  buyerName: string;
  buyerRole: UserRole;
  stage: PipelineStage;
  priority: PriorityLevel;
  totalValue: number;
  currency: string;
  estimatedDelivery: string;
  notes?: string;
  updatedAt: string;
}

// --- 5. GEOFENCING & SPATIAL TRACKING ---
export type GeofenceType = 'OriginFarm' | 'TransitHub' | 'ColdStorageFacility' | 'RetailOutlet';

export interface Geofence {
  zoneId: string;
  name: string;
  type: GeofenceType;
  center: GeoCoordinate;
  radiusMeters: number;
  permittedTempRange: {
    min: number;
    max: number;
  };
}

export interface GeofenceAlert {
  id: string;
  shipmentId: string;
  zoneId: string;
  eventType: 'ENTER' | 'EXIT' | 'DWELL_EXCEEDED' | 'UNAUTHORIZED_ENTRY';
  timestamp: string;
  coordinates: GeoCoordinate;
}

// --- 6. OFFLINE QUEUE & SYNC (DEXIE) ---
export type OfflineActionType =
  | 'CREATE_SHIPMENT'
  | 'UPDATE_STATUS'
  | 'RECORD_SENSOR_BREACH'
  | 'UPDATE_KANBAN_STAGE';

export type QueueSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface QueuedTransaction<T = unknown> {
  id: string; // UUID / Idempotency Key
  idempotencyKey: string;
  action: OfflineActionType;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  queuedAt: string;
  syncedAt?: string;
  retryCount: number;
  status: QueueSyncStatus;
  errorMessage?: string;
}

// --- 7. PAGINATION, API RESPONSES & ANALYTICS ---
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
  statusFilter?: ShipmentStatus | 'ALL';
  categoryFilter?: ProduceCategory | 'ALL';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ColdChainMetrics {
  totalShipments: number;
  activeShipments: number;
  lossRatePct: number;
  avgDeliveryHours: number;
  temperatureBreachCount: number;
  complianceRatePct: number;
}
