
export interface RunRecord {
  id: string;
  distance: string;
  time: string;
  pace: string;
  date: string;
  location: string;
  isRecent: boolean;
}

export interface WeeklyRun {
  day: string;
  distance: number;
  date: string;
}

export const weeklyData: WeeklyRun[] = [
  { day: 'Lun', distance: 8.5, date: '2024-06-10' },
  { day: 'Mar', distance: 0, date: '2024-06-11' },
  { day: 'Mer', distance: 12.2, date: '2024-06-12' },
  { day: 'Jeu', distance: 6.1, date: '2024-06-13' },
  { day: 'Ven', distance: 0, date: '2024-06-14' },
  { day: 'Sam', distance: 15.8, date: '2024-06-15' },
  { day: 'Dim', distance: 21.1, date: '2024-06-16' },
];

export const personalRecords: RunRecord[] = [
  {
    id: '1',
    distance: '400m',
    time: '1:18',
    pace: '3:15/km',
    date: '15 Mai 2024',
    location: 'Stade Charléty, Paris',
    isRecent: true
  },
  {
    id: '2',
    distance: '1km',
    time: '3:42',
    pace: '3:42/km',
    date: '2 Juin 2024',
    location: 'Parc des Buttes-Chaumont',
    isRecent: true
  },
  {
    id: '3',
    distance: '5km',
    time: '19:28',
    pace: '3:54/km',
    date: '28 Mai 2024',
    location: 'Bois de Vincennes',
    isRecent: true
  },
  {
    id: '4',
    distance: '10km',
    time: '41:15',
    pace: '4:08/km',
    date: '12 Avril 2024',
    location: 'Bois de Boulogne',
    isRecent: false
  },
  {
    id: '5',
    distance: 'Semi',
    time: '1:32:45',
    pace: '4:23/km',
    date: '3 Mars 2024',
    location: 'Semi de Paris',
    isRecent: false
  },
  {
    id: '6',
    distance: 'Marathon',
    time: '3:18:32',
    pace: '4:42/km',
    date: '14 Octobre 2023',
    location: 'Marathon de Chicago',
    isRecent: false
  }
];

export const monthlyStats = {
  currentMonth: {
    km: 156.8,
    target: 200,
    percentage: 78
  },
  previousMonth: {
    km: 142.3
  },
  yearTotal: 1847.5,
  previousYear: 1623.2
};
