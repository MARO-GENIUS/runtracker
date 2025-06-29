
import WeeklySummary from '../components/WeeklySummary';
import RecordsSlider from '../components/RecordsSlider';
import MonthlyStats from '../components/MonthlyStats';
import RunningCalendar from '../components/RunningCalendar';
import Layout from '../components/Layout';

const Dashboard = () => {
  return (
    <Layout>
      <WeeklySummary />
      <RunningCalendar />
      <RecordsSlider />
      <MonthlyStats />
    </Layout>
  );
};

export default Dashboard;
