import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { Dashboard } from '@/components/dashboard/Dashboard';

const Index = () => {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  );
};

export default Index;
