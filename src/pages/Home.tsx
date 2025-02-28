import React, { useState, useRef, useEffect } from 'react';
import { MapPin, Star, Clock, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { db, COLLECTIONS } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type { Vendor, Service } from '../types/database';

const QUICK_TAGS = [
  'Käsinpesu',
  'Täyspalvelu',
  'Yksityiskohdat',
  'Kiillotus',
  'Vahaus',
  'Sisäpesu',
  'Moottorin pesu',
  'Nahanhoito',
  'Pinnoitus',
  'Keraamiset pinnoitteet'
];
const CITIES = [
  'Helsinki',
  'Espoo', 
  'Tampere',
  'Vantaa',
  'Oulu',
  'Turku',
  'Jyväskylä',
  'Lahti',
  'Kuopio',
  'Pori',
  'Joensuu',
  'Lappeenranta',
  'Hämeenlinna',
  'Vaasa',
  'Seinäjoki',
  'Rovaniemi',
  'Mikkeli',
  'Kotka',
  'Salo',
  'Porvoo'
];

// Default placeholder image for vendors without a cover image
const DEFAULT_COVER_IMAGE = 'https://images.unsplash.com/photo-1605164599901-7e001fac9118?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';

const Home = () => {
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState('');
  const [scrollPosition, setScrollPosition] = useState(0);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right' | null>(null);
  const [autoScrollInterval, setAutoScrollInterval] = useState<NodeJS.Timeout | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const vendorSliderRef = useRef<HTMLDivElement>(null);
  const [showVendorLeftArrow, setShowVendorLeftArrow] = useState(false);
  const [showVendorRightArrow, setShowVendorRightArrow] = useState(true);
  const animationRef = useRef<number | null>(null);
  const lastScrollTimeRef = useRef<number>(0);
  const lastScrollPositionRef = useRef<number>(0);
  const [tampereVendors, setTampereVendors] = useState<any[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Fetch real vendors from Firestore
  useEffect(() => {
    const fetchTampereVendors = async () => {
      try {
        setIsLoadingVendors(true);
        const vendorsRef = collection(db, COLLECTIONS.VENDORS);
        const q = query(
          vendorsRef,
          where('city', '==', 'Tampere'),
          where('verified', '==', true),
          limit(8)
        );
        
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const vendors = querySnapshot.docs.map(doc => {
            const data = doc.data() as Vendor;
            return {
              id: doc.id,
              businessName: data.businessName,
              coverImage: data.coverImage || null, // Set to null if no cover image
              description: data.description || 'Autopesupalvelut Tampereella',
              rating: data.rating || 4.5,
              deliveryTime: '20-30'
            };
          });
          
          if (vendors.length > 0) {
            setTampereVendors(vendors);
          } else {
            // Fallback to default vendors if no real vendors found
            setTampereVendors([
              {
                id: '1',
                businessName: 'Premium Autopesu',
                coverImage: null,
                description: 'Laadukas käsinpesu ja vahaus',
                rating: 4.8,
                deliveryTime: '20-30'
              },
              {
                id: '2',
                businessName: 'Tampereen Autopesu',
                coverImage: null,
                description: 'Nopea ja tehokas autopesu',
                rating: 4.5,
                deliveryTime: '15-25'
              },
              {
                id: '3',
                businessName: 'Kiilto Autopesu',
                coverImage: null,
                description: 'Erikoistunut kiillotuksiin',
                rating: 4.9,
                deliveryTime: '45-55'
              },
              {
                id: '4',
                businessName: 'Eco Autopesu',
                coverImage: null,
                description: 'Ympäristöystävällinen pesu',
                rating: 4.7,
                deliveryTime: '20-30'
              }
            ]);
          }
        } else {
          // Fallback to default vendors if no vendors found
          setTampereVendors([
            {
              id: '1',
              businessName: 'Premium Autopesu',
              coverImage: null,
              description: 'Laadukas käsinpesu ja vahaus',
              rating: 4.8,
              deliveryTime: '20-30'
            },
            {
              id: '2',
              businessName: 'Tampereen Autopesu',
              coverImage: null,
              description: 'Nopea ja tehokas autopesu',
              rating: 4.5,
              deliveryTime: '15-25'
            },
            {
              id: '3',
              businessName: 'Kiilto Autopesu',
              coverImage: null,
              description: 'Erikoistunut kiillotuksiin',
              rating: 4.9,
              deliveryTime: '45-55'
            },
            {
              id: '4',
              businessName: 'Eco Autopesu',
              coverImage: null,
              description: 'Ympäristöystävällinen pesu',
              rating: 4.7,
              deliveryTime: '20-30'
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching Tampere vendors:', error);
        // Fallback to default vendors on error
        setTampereVendors([
          {
            id: '1',
            businessName: 'Premium Autopesu',
            coverImage: null,
            description: 'Laadukas käsinpesu ja vahaus',
            rating: 4.8,
            deliveryTime: '20-30'
          },
          {
            id: '2',
            businessName: 'Tampereen Autopesu',
            coverImage: null,
            description: 'Nopea ja tehokas autopesu',
            rating: 4.5,
            deliveryTime: '15-25'
          },
          {
            id: '3',
            businessName: 'Kiilto Autopesu',
            coverImage: null,
            description: 'Erikoistunut kiillotuksiin',
            rating: 4.9,
            deliveryTime: '45-55'
          },
          {
            id: '4',
            businessName: 'Eco Autopesu',
            coverImage: null,
            description: 'Ympäristöystävällinen pesu',
            rating: 4.7,
            deliveryTime: '20-30'
          }
        ]);
      } finally {
        setIsLoadingVendors(false);
      }
    };

    fetchTampereVendors();
  }, []);

  const handleImageError = (vendorId: string) => {
    setImageErrors(prev => ({
      ...prev,
      [vendorId]: true
    }));
  };

  const checkScrollPosition = () => {
    if (!sliderRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    setScrollPosition(scrollLeft);
    
    // Calculate scroll velocity for animation effects
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;
    if (timeDelta > 0) {
      const scrollDelta = Math.abs(scrollLeft - lastScrollPositionRef.current);
      const velocity = scrollDelta / timeDelta;
      
      // Apply velocity-based effects if needed
      if (velocity > 0.5) {
        // Fast scroll detected
        setIsScrolling(true);
        clearTimeout(autoScrollInterval as NodeJS.Timeout);
        setAutoScrollInterval(setTimeout(() => setIsScrolling(false), 300));
      }
    }
    
    lastScrollTimeRef.current = now;
    lastScrollPositionRef.current = scrollLeft;
  };

  const checkVendorScrollPosition = () => {
    if (!vendorSliderRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = vendorSliderRef.current;
    setShowVendorLeftArrow(scrollLeft > 5);
    setShowVendorRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    const slider = sliderRef.current;
    if (slider) {
      slider.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
      
      // Start auto-scroll animation
      startAutoScroll();
      
      return () => {
        slider.removeEventListener('scroll', checkScrollPosition);
        if (autoScrollInterval) clearTimeout(autoScrollInterval);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
    }
  }, []);

  useEffect(() => {
    const vendorSlider = vendorSliderRef.current;
    if (vendorSlider) {
      vendorSlider.addEventListener('scroll', checkVendorScrollPosition);
      checkVendorScrollPosition();
      
      return () => {
        vendorSlider.removeEventListener('scroll', checkVendorScrollPosition);
      };
    }
  }, [tampereVendors]);

  // Auto-scroll animation to subtly move the slider
  const startAutoScroll = () => {
    let direction: 'left' | 'right' = 'right';
    let speed = 0.2;
    let active = true;
    let lastTime = performance.now();
    
    const animate = (time: number) => {
      if (!active || !sliderRef.current) {
        animationRef.current = null;
        return;
      }
      
      const delta = time - lastTime;
      lastTime = time;
      
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      
      // Change direction when reaching edges
      if (scrollLeft <= 0) {
        direction = 'right';
        speed = 0;
        setTimeout(() => { speed = 0.2; }, 1000); // Pause at the edge
      } else if (scrollLeft >= scrollWidth - clientWidth) {
        direction = 'left';
        speed = 0;
        setTimeout(() => { speed = 0.2; }, 1000); // Pause at the edge
      }
      
      // Apply scroll with easing
      const amount = direction === 'right' ? speed : -speed;
      sliderRef.current.scrollLeft += amount;
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    // Add event listeners to pause animation on user interaction
    if (sliderRef.current) {
      const pauseAnimation = () => {
        active = false;
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      };
      
      const resumeAnimation = () => {
        // Only resume after some time of inactivity
        setTimeout(() => {
          active = true;
          if (!animationRef.current) {
            lastTime = performance.now();
            animationRef.current = requestAnimationFrame(animate);
          }
        }, 5000);
      };
      
      sliderRef.current.addEventListener('mouseenter', pauseAnimation);
      sliderRef.current.addEventListener('touchstart', pauseAnimation);
      sliderRef.current.addEventListener('mouseleave', resumeAnimation);
      sliderRef.current.addEventListener('touchend', resumeAnimation);
      
      return () => {
        if (sliderRef.current) {
          sliderRef.current.removeEventListener('mouseenter', pauseAnimation);
          sliderRef.current.removeEventListener('touchstart', pauseAnimation);
          sliderRef.current.removeEventListener('mouseleave', resumeAnimation);
          sliderRef.current.removeEventListener('touchend', resumeAnimation);
        }
      };
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = sliderRef.current;
    if (!container) return;
    
    setScrollDirection(direction);
    
    // Calculate dynamic scroll amount based on container width
    const scrollAmount = direction === 'left' 
      ? -Math.min(container.clientWidth * 0.8, 300) 
      : Math.min(container.clientWidth * 0.8, 300);
    
    // Apply smooth scroll with custom easing
    const startPosition = container.scrollLeft;
    const targetPosition = startPosition + scrollAmount;
    const startTime = performance.now();
    const duration = 600; // ms
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    // Easing function for natural movement
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      container.scrollLeft = startPosition + (scrollAmount * easedProgress);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animateScroll);
      } else {
        // Animation complete
        animationRef.current = null;
        setScrollDirection(null);
        
        // Check if we need to update arrow visibility
        checkScrollPosition();
      }
    };
    
    animationRef.current = requestAnimationFrame(animateScroll);
  };

  const handleVendorScroll = (direction: 'left' | 'right') => {
    const container = vendorSliderRef.current;
    if (!container) return;
    
    // Calculate dynamic scroll amount based on container width
    const scrollAmount = direction === 'left' 
      ? -Math.min(container.clientWidth * 0.8, 600) 
      : Math.min(container.clientWidth * 0.8, 600);
    
    // Apply smooth scroll with custom easing
    const startPosition = container.scrollLeft;
    const targetPosition = startPosition + scrollAmount;
    const startTime = performance.now();
    const duration = 600; // ms
    
    // Easing function for natural movement
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3);
    };
    
    let animationFrameId: number;
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      container.scrollLeft = startPosition + (scrollAmount * easedProgress);
      
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animateScroll);
      } else {
        // Check if we need to update arrow visibility
        checkVendorScrollPosition();
      }
    };
    
    animationFrameId = requestAnimationFrame(animateScroll);
  };

  // Navigate to vendor profile
  const handleVendorClick = (vendorId: string) => {
    navigate(`/vendor/${vendorId}`);
  };

  // New function to handle city search
  const handleCitySearch = (city: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append('city', city);
    searchParams.append('q', 'pesu');
    navigate(`/search?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <SearchBar 
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
        />

        {/* Quick Service Tags */}
        <div className="mt-6 overflow-x-auto pb-4">
          <div className="flex space-x-2 whitespace-nowrap">
            {QUICK_TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div className="mt-8 relative">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Kaupungit</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleScroll('left')}
                className={`p-2 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  showLeftArrow 
                    ? 'opacity-100 hover:bg-gray-50 hover:shadow-md transform hover:scale-110' 
                    : 'opacity-0 cursor-default'
                } ${scrollDirection === 'left' ? 'bg-gray-100' : ''}`}
                disabled={!showLeftArrow}
                aria-hidden={!showLeftArrow}
              >
                <svg className={`w-5 h-5 transition-transform duration-300 ${scrollDirection === 'left' ? 'scale-90' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                onClick={() => handleScroll('right')}
                className={`p-2 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  showRightArrow 
                    ? 'opacity-100 hover:bg-gray-50 hover:shadow-md transform hover:scale-110' 
                    : 'opacity-0 cursor-default'
                } ${scrollDirection === 'right' ? 'bg-gray-100' : ''}`}
                disabled={!showRightArrow}
                aria-hidden={!showRightArrow}
              >
                <svg className={`w-5 h-5 transition-transform duration-300 ${scrollDirection === 'right' ? 'scale-90' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div 
            ref={sliderRef}
            className={`overflow-x-auto pb-6 scrollbar-hide scroll-smooth city-slider ${isScrolling ? 'scrolling' : ''}`}
          >
            <div className="flex space-x-5 min-w-max px-1">
              {CITIES.map((city, index) => (
                <button
                  key={city}
                  onClick={() => handleCitySearch(city)}
                  className={`flex-shrink-0 text-center group city-item transition-transform duration-500 ease-out
                    ${scrollDirection === 'right' ? 'animate-slide-right' : ''}
                    ${scrollDirection === 'left' ? 'animate-slide-left' : ''}
                  `}
                  style={{
                    animationDelay: `${index * 30}ms`,
                    transform: scrollDirection ? 'scale(0.98)' : 'scale(1)'
                  }}
                >
                  <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg 
                    group-hover:shadow-xl transition-all duration-300 
                    relative overflow-hidden
                    before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-gray-100 before:to-gray-200
                    after:absolute after:inset-0 after:rounded-full after:bg-white/30 after:opacity-0 
                    group-hover:after:opacity-100 after:transition-opacity after:duration-300
                    group-hover:scale-105 group-hover:ring-2 group-hover:ring-gray-200/50"
                  >
                    <div className="relative z-10 group-hover:text-blue-500 transition-colors duration-300">
                      <MapPin className="w-8 h-8 text-gray-700 group-hover:text-blue-500 transition-colors duration-300" />
                    </div>
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 rounded-full blur-xl transition-opacity duration-300"></div>
                  </div>
                  <span className="font-medium text-sm text-gray-700 group-hover:text-blue-600 transition-colors duration-300">{city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Autopesu Tampere Section */}
        <div className="mt-12 relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Autopesu Tampere</h2>
              <p className="text-gray-500 text-sm mt-1">Parhaat autopesut Tampereella</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleVendorScroll('left')}
                className={`p-2 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  showVendorLeftArrow 
                    ? 'opacity-100 hover:bg-gray-50 hover:shadow-md transform hover:scale-110' 
                    : 'opacity-0 cursor-default'
                }`}
                disabled={!showVendorLeftArrow}
                aria-hidden={!showVendorLeftArrow}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleVendorScroll('right')}
                className={`p-2 bg-white rounded-full shadow-sm transition-all duration-300 ${
                  showVendorRightArrow 
                    ? 'opacity-100 hover:bg-gray-50 hover:shadow-md transform hover:scale-110' 
                    : 'opacity-0 cursor-default'
                }`}
                disabled={!showVendorRightArrow}
                aria-hidden={!showVendorRightArrow}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            ref={vendorSliderRef}
            className="overflow-x-auto pb-6 scrollbar-hide scroll-smooth"
          >
            <div className="flex space-x-4 min-w-max">
              {isLoadingVendors ? (
                // Loading skeleton
                Array(4).fill(0).map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-72 h-64 bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
                    <div className="h-32 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                tampereVendors.map((vendor) => (
                  <div 
                    key={vendor.id}
                    className="flex-shrink-0 w-72 bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 group cursor-pointer"
                    onClick={() => handleVendorClick(vendor.id)}
                  >
                    <div className="relative">
                      {/* Cover image with fallback */}
                      <div className="h-32 bg-gray-100 overflow-hidden">
                        {vendor.coverImage && !imageErrors[vendor.id] ? (
                          <img 
                            src={vendor.coverImage} 
                            alt={vendor.businessName}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={() => handleImageError(vendor.id)}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-500">{vendor.businessName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Pagination dots */}
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                        {[0, 1, 2, 3, 4].map((dot) => (
                          <div 
                            key={dot} 
                            className={`w-1.5 h-1.5 rounded-full ${dot === 0 ? 'bg-white' : 'bg-white/50'}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                        {vendor.businessName}
                      </h3>
                      <p className="text-gray-500 text-sm mb-3">{vendor.description}</p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium ml-1">{vendor.rating.toFixed(1)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-3 h-3 mr-1" />
                          <span className="text-xs">{vendor.deliveryTime} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
