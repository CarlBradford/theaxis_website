import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';
import AnnouncementSection from '../components/AnnouncementSection';
import '../styles/homepage-theme.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col homepage-bg">
      <PublicHeader />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col justify-center items-center">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full">
          {/* Announcements Section */}
          <AnnouncementSection />
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;
