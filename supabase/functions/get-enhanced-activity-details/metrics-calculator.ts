
import { EnhancedMetrics, ProcessedStreams } from './types.ts'

export function calculateDerivedMetrics(activity: any, streams: ProcessedStreams): EnhancedMetrics {
  const metrics: any = {}

  // Dénivelé moyen par km
  if (activity.total_elevation_gain && activity.distance) {
    metrics.avgElevationGainPerKm = (activity.total_elevation_gain / (activity.distance / 1000)).toFixed(1)
  }

  // Variabilité de la fréquence cardiaque
  if (streams.heartrate && streams.heartrate.length > 0) {
    const hrData = streams.heartrate.filter((hr: number) => hr > 0)
    if (hrData.length > 0) {
      const mean = hrData.reduce((sum: number, hr: number) => sum + hr, 0) / hrData.length
      const variance = hrData.reduce((sum: number, hr: number) => sum + Math.pow(hr - mean, 2), 0) / hrData.length
      metrics.heartRateVariability = Math.sqrt(variance).toFixed(1)
    }
  }

  // Zones d'effort (estimées)
  if (activity.average_heartrate) {
    const avgHr = activity.average_heartrate
    const maxHr = activity.max_heartrate || avgHr * 1.15
    
    metrics.effortZones = {
      zone1: Math.round(maxHr * 0.6), // Récupération
      zone2: Math.round(maxHr * 0.7), // Aérobie
      zone3: Math.round(maxHr * 0.8), // Seuil
      zone4: Math.round(maxHr * 0.9), // Anaérobie
      zone5: Math.round(maxHr * 1.0), // Neuromusculaire
    }

    // Déterminer la zone principale
    if (avgHr < metrics.effortZones.zone1) metrics.primaryZone = 'Récupération'
    else if (avgHr < metrics.effortZones.zone2) metrics.primaryZone = 'Aérobie légère'
    else if (avgHr < metrics.effortZones.zone3) metrics.primaryZone = 'Aérobie'
    else if (avgHr < metrics.effortZones.zone4) metrics.primaryZone = 'Seuil'
    else if (avgHr < metrics.effortZones.zone5) metrics.primaryZone = 'Anaérobie'
    else metrics.primaryZone = 'Neuromusculaire'
  }

  // Analyse de régularité d'allure
  if (streams.velocity && streams.velocity.length > 0) {
    const speeds = streams.velocity.filter((v: number) => v > 0)
    if (speeds.length > 0) {
      const meanSpeed = speeds.reduce((sum: number, speed: number) => sum + speed, 0) / speeds.length
      const speedVariance = speeds.reduce((sum: number, speed: number) => sum + Math.pow(speed - meanSpeed, 2), 0) / speeds.length
      metrics.paceConsistency = (1 / (1 + Math.sqrt(speedVariance))).toFixed(3) // Score de 0 à 1
    }
  }

  // Cadence moyenne si disponible
  if (streams.cadence && streams.cadence.length > 0) {
    const cadenceData = streams.cadence.filter((c: number) => c > 0)
    if (cadenceData.length > 0) {
      metrics.avgCadence = Math.round(cadenceData.reduce((sum: number, c: number) => sum + c, 0) / cadenceData.length)
      metrics.hasCadenceData = true
    }
  }

  return metrics
}
