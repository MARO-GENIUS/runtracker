
import { useIsMobile } from '@/hooks/useIsMobile';
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RunningCalendar from '../components/RunningCalendar';
import MobileDashboard from '../components/MobileDashboard';
import Layout from '../components/Layout';

const Dashboard = () => {
  const isMobile = useIsMobile();

  return (
    <Layout>
      {isMobile ? (
        <MobileDashboard />
      ) : (
        <div className="space-y-6 sm:space-y-8">
          <WeeklySummary />
          <RunningCalendar />
          <RecordsSlider />
          <MonthlyStats />
        </div>
      )}
    </Layout>
  );
};

export default Dashboard;
