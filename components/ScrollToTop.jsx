import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Snap to top-left of the page
    window.scrollTo(0, 0);
  }, [pathname]); // Runs every time the path changes

  return null;
};

export default ScrollToTop;