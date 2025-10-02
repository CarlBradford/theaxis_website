import { useEffect } from 'react';

/**
 * Custom hook to set page title with "The AXIS |" prefix
 * @param {string} title - The page title to set
 */
export const usePageTitle = (title) => {
  useEffect(() => {
    if (title) {
      document.title = `The AXIS | ${title}`;
    } else {
      document.title = 'The AXIS';
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'The AXIS';
    };
  }, [title]);
};

export default usePageTitle;
