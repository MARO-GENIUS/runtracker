
import HeartRateAnalysis from './analysis/HeartRateAnalysis';
import PaceConsistencyAnalysis from './analysis/PaceConsistencyAnalysis';
import RunningMetricsAnalysis from './analysis/RunningMetricsAnalysis';
import TrainingZones from './analysis/TrainingZones';
import ImprovementTips from './analysis/ImprovementTips';

interface MetricsAnalysisProps {
  derivedMetrics: {
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
  };
  activity?: {
    average_heartrate?: number;
    max_heartrate?: number;
    average_speed?: number;
    distance?: number;
    moving_time?: number;
  };
}

const MetricsAnalysis = ({ derivedMetrics, activity }: MetricsAnalysisProps) => {
  return (
    <div className="space-y-6">
      <HeartRateAnalysis
        primaryZone={derivedMetrics.primaryZone}
        averageHeartRate={activity?.average_heartrate}
        maxHeartRate={activity?.max_heartrate}
        heartRateVariability={derivedMetrics.heartRateVariability}
      />

      <PaceConsistencyAnalysis
        averageSpeed={activity?.average_speed}
        paceConsistency={derivedMetrics.paceConsistency}
      />

      <RunningMetricsAnalysis
        avgCadence={derivedMetrics.avgCadence}
        hasCadenceData={derivedMetrics.hasCadenceData}
        avgElevationGainPerKm={derivedMetrics.avgElevationGainPerKm}
        distance={activity?.distance}
        movingTime={activity?.moving_time}
      />

      <TrainingZones effortZones={derivedMetrics.effortZones} />

      <ImprovementTips
        paceConsistency={derivedMetrics.paceConsistency}
        avgCadence={derivedMetrics.avgCadence}
        hasCadenceData={derivedMetrics.hasCadenceData}
        primaryZone={derivedMetrics.primaryZone}
      />
    </div>
  );
};

export default MetricsAnalysis;
