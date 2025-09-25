import { useAuth } from '../../hooks/useAuth';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import FeaturedArticlesHero from './FeaturedArticlesHero';
import RecentStories from './RecentStories';
import { colorPaletteUtils } from '../../config/colorPalette';
import { useEffect } from 'react';
import '../../styles/homepage-theme.css';

const Home = () => {
  const { isAuthenticated } = useAuth();

  // Apply color palette theme on component mount
  useEffect(() => {
    const theme = colorPaletteUtils.getStoredTheme();
    colorPaletteUtils.applyTheme(theme);
  }, []);

  return (
    <div className="min-h-screen flex flex-col homepage-bg">
      <PublicHeader />
      
      {/* Main Content */}
      <main className="flex-1">
        {/* Featured Articles Hero Section */}
        <FeaturedArticlesHero />
        
        {/* Recent Stories Section */}
        <RecentStories />
        
        <div className="max-w-6xl mx-auto px-6 lg:px-8 w-full">
          {/* Additional homepage content can go here */}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default Home;
