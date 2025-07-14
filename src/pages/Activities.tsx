
import { useIsMobile } from '@/hooks/useIsMobile';
import ActivitiesView from '../components/ActivitiesView';
import MobileActivitiesView from '../components/MobileActivitiesView';
import Layout from '../components/Layout';

const Activities = () => {
  const isMobile = useIsMobile();

  return (
    <Layout>
      {isMobile ? (
        <MobileActivitiesView />
      ) : (
        <ActivitiesView />
      )}
    </Layout>
  );
};

export default Activities;
