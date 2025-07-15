
interface PersonalRecord {
  distanceMeters: number;
  time: string;
}

interface TrainingZones {
  vma: { min: string; max: string; description: string };
  seuil: { min: string; max: string; description: string };
  tempo: { min: string; max: string; description: string };
  endurance: { min: string; max: string; description: string };
}

// Convertit un temps "MM:SS" en secondes totales
const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  return 0;
};

// Convertit des secondes en format MM:SS
const secondsToTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Calcule l'allure en min/km à partir de la distance et du temps
const calculatePacePerKm = (distanceMeters: number, timeStr: string): number => {
  const timeSeconds = timeToSeconds(timeStr);
  const distanceKm = distanceMeters / 1000;
  return timeSeconds / distanceKm;
};

export const calculateTrainingZones = (records: PersonalRecord[]): TrainingZones | null => {
  if (!records || records.length === 0) {
    return null;
  }

  // Chercher les records clés pour calculer les zones
  const record1Mile = records.find(r => r.distanceMeters === 1609); // 1 mile
  const record5k = records.find(r => r.distanceMeters === 5000);
  const record10k = records.find(r => r.distanceMeters === 10000);

  // Utiliser le meilleur indicateur disponible pour chaque zone
  let vmaPace = null;
  let seuilPace = null;

  // VMA : basée sur le record du mile (si disponible) ou 5km
  if (record1Mile) {
    vmaPace = calculatePacePerKm(1609, record1Mile.time);
  } else if (record5k) {
    // Estimer la VMA à partir du 5km (environ 5-10 sec/km plus rapide)
    vmaPace = calculatePacePerKm(5000, record5k.time) - 8;
  }

  // Seuil : basé sur le 10km (si disponible) ou estimé à partir du 5km
  if (record10k) {
    seuilPace = calculatePacePerKm(10000, record10k.time);
  } else if (record5k) {
    // Estimer le seuil à partir du 5km (environ 10-15 sec/km plus lent)
    seuilPace = calculatePacePerKm(5000, record5k.time) + 12;
  }

  if (!vmaPace && !seuilPace) {
    return null;
  }

  // Si on n'a qu'une des deux, estimer l'autre
  if (vmaPace && !seuilPace) {
    seuilPace = vmaPace + 25; // Seuil environ 25 sec/km plus lent que VMA
  } else if (seuilPace && !vmaPace) {
    vmaPace = seuilPace - 25; // VMA environ 25 sec/km plus rapide que seuil
  }

  // Calculer toutes les zones
  const vmaMin = vmaPace! - 5;
  const vmaMax = vmaPace! + 5;
  
  const seuilMin = seuilPace! - 5;
  const seuilMax = seuilPace! + 5;
  
  const tempoMin = seuilPace! + 10;
  const tempoMax = seuilPace! + 20;
  
  const enduranceMin = seuilPace! + 25;
  const enduranceMax = seuilPace! + 50;

  return {
    vma: {
      min: secondsToTime(vmaMin),
      max: secondsToTime(vmaMax),
      description: "VMA - Vitesse Maximale Aérobie"
    },
    seuil: {
      min: secondsToTime(seuilMin),
      max: secondsToTime(seuilMax),
      description: "Seuil anaérobie"
    },
    tempo: {
      min: secondsToTime(tempoMin),
      max: secondsToTime(tempoMax),
      description: "Tempo / Allure marathon"
    },
    endurance: {
      min: secondsToTime(enduranceMin),
      max: secondsToTime(enduranceMax),
      description: "Endurance fondamentale"
    }
  };
};

export const formatTrainingZonesForAI = (zones: TrainingZones): string => {
  return `ZONES D'INTENSITÉ PERSONNALISÉES (basées sur vos records) :

🔥 VMA (${zones.vma.description}) : ${zones.vma.min}/km à ${zones.vma.max}/km
⚡ SEUIL (${zones.seuil.description}) : ${zones.seuil.min}/km à ${zones.seuil.max}/km  
🏃 TEMPO (${zones.tempo.description}) : ${zones.tempo.min}/km à ${zones.tempo.max}/km
🚶 ENDURANCE (${zones.endurance.description}) : ${zones.endurance.min}/km à ${zones.endurance.max}/km

IMPORTANT : Ces zones sont calculées à partir de vos performances réelles et doivent être STRICTEMENT respectées selon le type de séance demandé.`;
};
