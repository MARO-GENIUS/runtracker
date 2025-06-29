
export interface EnhancedMetrics {
  avgElevationGainPerKm?: string;
  heartRateVariability?: string;
  effortZones?: {
    zone1: number;
    zone2: number;
    zone3: number;
    zone4: number;
    zone5: number;
  };
  primaryZone?: string;
  paceConsistency?: string;
  avgCadence?: number;
  hasCadenceData?: boolean;
}

export interface ProcessedStreams {
  time: number[];
  heartrate: number[];
  cadence: number[];
  distance: number[];
  altitude: number[];
  velocity: number[];
  grade: number[];
}
