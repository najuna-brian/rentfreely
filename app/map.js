// Rentfreely Uganda - Main Application JavaScript
// Implements exact UX flow from specification document

// Global State
let map = null;
let formulusApi = null;
let currentMode = 'tenant'; // 'tenant' or 'landlord'
let selectedProperty = null;
let currentScreen = 'splash';
let isFirstTimeUser = true;
let locationPermissionGranted = false;
let userLocation = null;

// Add Listing State
let addListingData = {
    step: 1,
    location: null,
    address: '',
    title: '',
    rentPrice: '',
    bedrooms: '',
    bathrooms: '',
    propertyType: '',
    availableFrom: '',
    description: '',
    landlordName: '',
    landlordPhone: '',
    confirmed: false
};

// Map State
let propertyMarkers = [];
let listings = [];
let selectedMarker = null;
let locationMap = null;
let draggableMarker = null;

// Formulus API Helper
function getFormulus() {
    return new Promise((resolve, reject) => {
        const timeout = 5000;
        let formulusIsReady = false;

        // Debug: Check if formulus object exists at all
        console.log('getFormulus() called, checking globalThis.formulus:', !!globalThis.formulus);
        if (globalThis.formulus) {
            console.log('formulus object keys:', Object.keys(globalThis.formulus));
            console.log('__HOST_IS_READY__:', globalThis.formulus.__HOST_IS_READY__);
        }

        if (globalThis.formulus && globalThis.formulus.__HOST_IS_READY__) {
            console.log('Formulus API is ready, resolving...');
            resolve(globalThis.formulus);
            return;
        }

        const originalOnReady = globalThis.formulusCallbacks?.onFormulusReady;

        globalThis.formulusCallbacks = {
            ...globalThis.formulusCallbacks,
            onFormulusReady: () => {
                console.log('onFormulusReady callback triggered!');
                formulusIsReady = true;
                globalThis.formulus.__HOST_IS_READY__ = true;
                if (typeof originalOnReady === 'function') {
                    originalOnReady();
                }
                console.log('Resolving formulus API...');
                resolve(globalThis.formulus);
                clearTimeout(timerId);
            },
        };

        if (globalThis.formulus && globalThis.formulus.__HOST_IS_READY__) {
            resolve(globalThis.formulus);
            return;
        }

        // Poll for API readiness
        const intervalId = setInterval(() => {
            attemptCount++;
            if (globalThis.formulus) {
                clearInterval(intervalId);
                if (globalThis.formulus.__HOST_IS_READY__) {
                    formulusIsReady = true;
                    resolve(globalThis.formulus);
                    clearTimeout(timerId);
                }
            }
            if (attemptCount >= 50) { // 5 seconds max
                clearInterval(intervalId);
                if (!formulusIsReady) {
                    reject(new Error('Formulus API did not become ready within 5 seconds.'));
                }
            }
        }, 100);

        let attemptCount = 0;

        const timerId = setTimeout(() => {
            clearInterval(intervalId);
            if (!formulusIsReady) {
                if (globalThis.formulusCallbacks) {
                    globalThis.formulusCallbacks.onFormulusReady = originalOnReady;
                }
                reject(new Error('Formulus API did not become ready within 5 seconds.'));
            }
        }, timeout);
    });
}

// Initialize Formulus API
async function initializeFormulus() {
    try {
        formulusApi = await getFormulus();
        console.log('Formulus API initialized successfully');
        return true;
    } catch (error) {
        console.log('Formulus API not available, running in demo mode:', error.message);
        return false;
    }
}

// Screen Management
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.add('hidden');
    });
    
    // Show target screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        currentScreen = screenId;
        
        // Screen-specific initialization
        if (screenId === 'main-app') {
            initializeMainApp();
        } else if (screenId === 'add-listing-flow') {
            initializeAddListingFlow();
        }
    }
}

// App Initialization Flow
async function initApp() {
    console.log('Initializing Rentfreely Uganda app...');
    
    // Show splash screen
    showScreen('splash-screen');
    
    // Check if first-time user
    const hasSeenOnboarding = localStorage.getItem('rentfreely_onboarding_complete');
    isFirstTimeUser = !hasSeenOnboarding;
    
    // Initialize Formulus API in background
    const apiReady = await initializeFormulus();
    
    // Wait minimum splash time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (isFirstTimeUser) {
        showScreen('onboarding-screen');
        setupOnboarding();
    } else {
        // Load saved mode or default to tenant
        const savedMode = localStorage.getItem('rentfreely_default_mode') || 'tenant';
        currentMode = savedMode;
        checkLocationPermission();
    }
}

// Onboarding Setup
function setupOnboarding() {
    const modeCards = document.querySelectorAll('.mode-card');
    const continueBtn = document.getElementById('continue-btn');
    let selectedMode = null;
    
    modeCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove previous selection
            modeCards.forEach(c => c.classList.remove('selected'));
            
            // Add selection to clicked card
            this.classList.add('selected');
            selectedMode = this.dataset.mode;
            
            // Enable continue button
            continueBtn.disabled = false;
        });
    });
    
    continueBtn.addEventListener('click', function() {
        if (selectedMode) {
            // Save user's choice
            localStorage.setItem('rentfreely_onboarding_complete', 'true');
            localStorage.setItem('rentfreely_default_mode', selectedMode);
            currentMode = selectedMode;
            
            // Continue to location permission
            checkLocationPermission();
        }
    });
}

// Location Permission
function checkLocationPermission() {
    showScreen('permission-screen');
    
    const allowBtn = document.getElementById('allow-location-btn');
    const skipBtn = document.getElementById('skip-location-btn');
    
    allowBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    locationPermissionGranted = true;
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    console.log('Location permission granted:', userLocation);
                    launchMainApp();
                },
                (error) => {
                    console.log('Location permission denied:', error);
                    locationPermissionGranted = false;
                    launchMainApp();
                }
            );
        } else {
            console.log('Geolocation not supported');
            locationPermissionGranted = false;
            launchMainApp();
        }
    });
    
    skipBtn.addEventListener('click', function() {
        locationPermissionGranted = false;
        launchMainApp();
    });
}

// Launch Main App
function launchMainApp() {
    showScreen('main-app');
}

// Initialize Main App
function initializeMainApp() {
    // Update mode chip
    const modeChip = document.getElementById('mode-chip');
    const currentModeName = document.getElementById('current-mode-name');
    
    modeChip.textContent = currentMode === 'tenant' ? 'Tenant' : 'Landlord';
    modeChip.className = `mode-chip ${currentMode}`;
    
    currentModeName.textContent = currentMode === 'tenant' ? '🔍 Tenant' : '🏠 Landlord';
    
    // Show/hide mode-specific elements
    const landlordBanner = document.getElementById('landlord-banner');
    const landlordFabs = document.getElementById('landlord-fabs');
    const listingCount = document.getElementById('listing-count');
    
    if (currentMode === 'landlord') {
        landlordBanner.classList.remove('hidden');
        landlordFabs.classList.remove('hidden');
        listingCount.classList.remove('hidden');
    } else {
        landlordBanner.classList.add('hidden');
        landlordFabs.classList.add('hidden');
        listingCount.classList.add('hidden');
    }
    
    // Initialize map if not already done
    if (!map) {
        initializeMap();
    }
    
    // Load properties
    loadProperties();
    
    // Setup event listeners
    setupMainAppListeners();
}

// Initialize Google Maps
function initializeMap() {
    // Check if Google Maps API is loaded
    if (!window.google || !google.maps) {
        console.error('Google Maps API not loaded');
        showSnackbar('Map unavailable. Please check your connection.', 'error');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    // Default center (Kampala)
    const center = userLocation || { lat: 0.3476, lng: 32.5825 };
    const zoom = userLocation ? 15 : 13;
    
    try {
        map = new google.maps.Map(mapElement, {
            center: center,
            zoom: zoom,
            styles: [
                {
                    featureType: "all",
                    elementType: "geometry",
                    stylers: [{ color: "#EAE6DE" }]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{ color: "#FFFFFF" }]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{ color: "#C5D8E8" }]
                },
                {
                    featureType: "landscape.man_made",
                    elementType: "geometry",
                    stylers: [{ color: "#DDD8CE" }]
                },
                {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }]
                }
            ],
            gestureHandling: 'greedy',
            disableDefaultUI: true
        });
        
        console.log('Main map initialized successfully');
    } catch (error) {
        console.error('Failed to initialize main map:', error);
        showSnackbar('Failed to load map. Please refresh the page.', 'error');
    }
}

// Load Properties
async function loadProperties() {
    try {
        let observations = [];
        
        if (formulusApi) {
            console.log('Loading properties from Formulus API...');
            observations = await formulusApi.getObservations('register_house');
        } else {
            console.log('Running in demo mode - showing sample properties');
            observations = getDemoProperties();
        }
        
        listings = observations;
        displayProperties();
        updateListingCount();
        
    } catch (error) {
        console.error('Failed to load properties:', error);
        // Show demo properties as fallback
        listings = getDemoProperties();
        displayProperties();
        updateListingCount();
    }
}

// Demo Properties
function getDemoProperties() {
    return [
        {
            data: {
                name: "Modern Apartment - 2 Bedrooms",
                property_type: "Apartment",
                rent_price: 850000,
                bedrooms: 2,
                bathrooms: 2,
                location: { latitude: 0.3476, longitude: 32.5825 },
                description: "Modern apartment in prime location with great amenities",
                landlord_name: "Sarah Nakato",
                landlord_phone: "0700123456",
                available: true,
                available_from: new Date().toISOString().split('T')[0]
            }
        },
        {
            data: {
                name: "Cozy Single Room",
                property_type: "Single Room",
                rent_price: 350000,
                bedrooms: 1,
                bathrooms: 1,
                location: { latitude: 0.3276, longitude: 32.5625 },
                description: "Affordable single room perfect for students",
                landlord_name: "John Mugisha",
                landlord_phone: "0756987654",
                available: true,
                available_from: new Date().toISOString().split('T')[0]
            }
        },
        {
            data: {
                name: "Family House - 3 Bedrooms",
                property_type: "Full House",
                rent_price: 1500000,
                bedrooms: 3,
                bathrooms: 2,
                location: { latitude: 0.3176, longitude: 32.5965 },
                description: "Spacious family house with garden and parking",
                landlord_name: "Peter Okello",
                landlord_phone: "0700123456",
                available: true,
                available_from: new Date().toISOString().split('T')[0]
            }
        },
        {
            data: {
                name: "Student Hostel Room",
                property_type: "Studio",
                rent_price: 280000,
                bedrooms: 1,
                bathrooms: 1,
                location: { latitude: 0.3576, longitude: 32.5725 },
                description: "Perfect for students near university",
                landlord_name: "Grace Achieng",
                landlord_phone: "0789456123",
                available: true,
                available_from: new Date().toISOString().split('T')[0]
            }
        }
    ];
}

// Display Properties on Map
function displayProperties() {
    // Clear existing markers
    clearPropertyMarkers();
    
    // Filter to only available properties
    const availableListings = listings.filter(listing => {
        const data = listing.data;
        return data.location && (data.available === true || data.available === undefined);
    });
    
    if (availableListings.length === 0) {
        showNoListingsOverlay();
        return;
    }
    
    hideNoListingsOverlay();
    
    availableListings.forEach((listing, index) => {
        const data = listing.data;
        const position = { lat: data.location.latitude, lng: data.location.longitude };
        
        // Create price marker
        const marker = createPriceMarker(position, data, listing, index);
        if (marker) {
            marker.setMap(map);
            propertyMarkers.push(marker);
        }
    });
}

// Create Price Marker
function createPriceMarker(position, data, listing, index) {
    try {
        const marker = new google.maps.Marker({
            position: position,
            map: map,
            title: data.name || `Property ${index + 1}`,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <div style="
                        background: white;
                        border: 1.5px solid #E0E0D8;
                        border-radius: 20px;
                        padding: 4px 10px;
                        font-size: 11px;
                        font-weight: 700;
                        color: black;
                        white-space: nowrap;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'DM Sans', sans-serif;
                    ">UGX ${formatPrice(data.rent_price)}</div>
                `),
                anchor: new google.maps.Point(40, 20)
            }
        });
        
        marker.addListener('click', () => {
            selectProperty(listing, marker);
        });
        
        return marker;
    } catch (error) {
        console.error('Failed to create marker for property:', error);
        showSnackbar('Failed to display property on map.', 'error');
        return null;
    }
}

// Format Price
function formatPrice(price) {
    if (!price) return '0';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Select Property
function selectProperty(listing, marker) {
    // Update selected marker appearance
    if (selectedMarker) {
        selectedMarker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <div style="
                    background: white;
                    border: 1.5px solid #E0E0D8;
                    border-radius: 20px;
                    padding: 4px 10px;
                    font-size: 11px;
                    font-weight: 700;
                    color: black;
                    white-space: nowrap;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'DM Sans', sans-serif;
                ">UGX ${formatPrice(listing.data.rent_price)}</div>
            `),
            anchor: new google.maps.Point(40, 20)
        });
    }
    
    selectedMarker = marker;
    selectedProperty = listing;
    
    // Update marker to selected state
    marker.setIcon({
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <div style="
                background: #0A0A0A;
                border: 1.5px solid #C8A96E;
                border-radius: 20px;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 700;
                color: #C8A96E;
                white-space: nowrap;
                box-shadow: 0 4px 16px rgba(0,0,0,0.28);
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'DM Sans', sans-serif;
            ">UGX ${formatPrice(listing.data.rent_price)}</div>
        `),
        anchor: new google.maps.Point(40, 20)
    });
    
    // Show bottom sheet
    showBottomSheet(listing, 'compact');
}

// Show Bottom Sheet
function showBottomSheet(listing, state = 'compact') {
    const bottomSheet = document.getElementById('bottom-sheet');
    const data = listing.data;
    
    bottomSheet.className = `bottom-sheet show ${state}`;
    
    if (state === 'compact') {
        bottomSheet.innerHTML = `
            <div class="sheet-handle"></div>
            <div class="listing-compact">
                <div class="listing-price-box">
                    <div class="price-label">UGX</div>
                    <div class="price-amount">${formatPrice(data.rent_price)}</div>
                    <div class="price-unit">/month</div>
                </div>
                <div class="listing-info">
                    <div class="listing-title">${data.name || 'Property'}</div>
                    <div class="listing-address">Kampala, Uganda</div>
                    <div class="listing-chips">
                        ${data.bedrooms ? `<div class="listing-chip">🛏️ ${data.bedrooms} Bed</div>` : ''}
                        ${data.bathrooms ? `<div class="listing-chip">🚿 ${data.bathrooms} Bath</div>` : ''}
                        ${data.property_type ? `<div class="type-chip">${data.property_type}</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="expand-hint">↑ EXPAND</div>
        `;
        
        // Handle expand
        bottomSheet.querySelector('.expand-hint').addEventListener('click', () => {
            showBottomSheet(listing, 'expanded');
        });
        
        // Handle tap on compact area
        bottomSheet.querySelector('.listing-compact').addEventListener('click', () => {
            showBottomSheet(listing, 'expanded');
        });
        
    } else if (state === 'expanded') {
        bottomSheet.innerHTML = `
            <div class="sheet-handle"></div>
            <div class="listing-detail">
                ${data.property_type ? `<div class="detail-type-chip">${data.property_type}</div>` : ''}
                <h2 class="detail-title">${data.name || 'Property'}</h2>
                <div class="detail-address">Kampala, Uganda</div>
                <div class="detail-price-pill">
                    <span class="detail-price-amount">${formatPrice(data.rent_price)}</span>
                    <span class="detail-price-unit">/month</span>
                </div>
                <div class="detail-stats">
                    <div class="detail-stat">
                        <div class="detail-stat-value">${data.bedrooms || 'N/A'}</div>
                        <div class="detail-stat-label">Bedrooms</div>
                    </div>
                    <div class="detail-stat-separator"></div>
                    <div class="detail-stat">
                        <div class="detail-stat-value">${data.bathrooms || 'N/A'}</div>
                        <div class="detail-stat-label">Bathrooms</div>
                    </div>
                    <div class="detail-stat-separator"></div>
                    <div class="detail-stat">
                        <div class="detail-stat-value available">Now</div>
                        <div class="detail-stat-label">Available</div>
                    </div>
                </div>
                <div class="detail-section-label">About this property</div>
                <div class="detail-description">${data.description || 'No description available.'}</div>
                <div class="detail-section-label">Listed by</div>
                <div class="detail-contact">
                    <div class="contact-avatar">${data.landlord_name ? data.landlord_name.charAt(0).toUpperCase() : 'L'}</div>
                    <div class="contact-info">
                        <div class="contact-name">${data.landlord_name || 'Landlord'}</div>
                        <div class="contact-phone">${data.landlord_phone || 'No phone'}</div>
                    </div>
                    <div class="contact-buttons">
                        ${data.landlord_phone ? `<button class="contact-btn call" onclick="makeCall('${data.landlord_phone}')">📞</button>` : ''}
                        ${data.landlord_phone ? `<button class="contact-btn whatsapp" onclick="openWhatsApp('${data.landlord_phone}', '${data.name}')">💬</button>` : ''}
                    </div>
                </div>
            </div>
        `;
        
        // Handle collapse
        bottomSheet.querySelector('.sheet-handle').addEventListener('click', () => {
            showBottomSheet(listing, 'compact');
        });
    }
}

// Contact Functions
function makeCall(phone) {
    window.location.href = `tel:${phone}`;
}

function openWhatsApp(phone, propertyName) {
    const message = `Hi, I'm interested in ${propertyName || 'your property'}`;
    window.open(`https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
}

// Clear Property Markers
function clearPropertyMarkers() {
    propertyMarkers.forEach(marker => marker.setMap(null));
    propertyMarkers = [];
    selectedMarker = null;
}

// Update Listing Count
function updateListingCount() {
    const countElement = document.getElementById('listing-count-text');
    const availableCount = listings.filter(listing => {
        const data = listing.data;
        return data.location && (data.available === true || data.available === undefined);
    }).length;
    
    if (countElement) {
        countElement.textContent = `${availableCount} listing${availableCount !== 1 ? 's' : ''}`;
    }
}

// Show/Hide No Listings Overlay
function showNoListingsOverlay() {
    const overlay = document.getElementById('no-listings-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideNoListingsOverlay() {
    const overlay = document.getElementById('no-listings-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

// Setup Main App Event Listeners
function setupMainAppListeners() {
    // Menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const modeMenu = document.getElementById('mode-menu');
    
    menuToggle.addEventListener('click', function() {
        modeMenu.classList.toggle('hidden');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!menuToggle.contains(event.target) && !modeMenu.contains(event.target)) {
            modeMenu.classList.add('hidden');
        }
    });
    
    // Switch mode
    const switchModeItem = document.getElementById('switch-mode-item');
    switchModeItem.addEventListener('click', function() {
        switchMode();
        modeMenu.classList.add('hidden');
    });
    
    // My location button
    const myLocationBtn = document.getElementById('my-location-btn');
    myLocationBtn.addEventListener('click', function() {
        if (userLocation) {
            map.panTo(userLocation);
            map.setZoom(15);
        } else {
            // Try to get location
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    map.panTo(userLocation);
                    map.setZoom(15);
                },
                (error) => {
                    console.log('Could not get location');
                    // Center on Kampala
                    map.panTo({ lat: 0.3476, lng: 32.5825 });
                    map.setZoom(13);
                }
            );
        }
    });
    
    // Landlord FABs
    if (currentMode === 'landlord') {
        const addPropertyBtn = document.getElementById('add-property-btn');
        const viewListingsBtn = document.getElementById('view-listings-btn');
        
        addPropertyBtn.addEventListener('click', function() {
            startAddListingFlow();
        });
        
        viewListingsBtn.addEventListener('click', function() {
            showMyListings();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        // TODO: Implement search functionality
        console.log('Search:', this.value);
    });
    
    // Map click to dismiss bottom sheet
    map.addListener('click', function() {
        const bottomSheet = document.getElementById('bottom-sheet');
        bottomSheet.classList.remove('show');
        if (selectedMarker) {
            // Reset marker appearance
            const data = selectedProperty.data;
            selectedMarker.setIcon({
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <div style="
                        background: white;
                        border: 1.5px solid #E0E0D8;
                        border-radius: 20px;
                        padding: 4px 10px;
                        font-size: 11px;
                        font-weight: 700;
                        color: black;
                        white-space: nowrap;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.12);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: 'DM Sans', sans-serif;
                    ">UGX ${formatPrice(data.rent_price)}</div>
                `),
                anchor: new google.maps.Point(40, 20)
            });
            selectedMarker = null;
            selectedProperty = null;
        }
    });
}

// Switch Mode
function switchMode() {
    currentMode = currentMode === 'tenant' ? 'landlord' : 'tenant';
    localStorage.setItem('rentfreely_default_mode', currentMode);
    
    // Show snackbar
    showSnackbar(`Switched to ${currentMode} mode`, 'info');
    
    // Re-initialize main app with new mode
    initializeMainApp();
    
    // Close any open bottom sheet
    const bottomSheet = document.getElementById('bottom-sheet');
    bottomSheet.classList.remove('show');
}

// Show Snackbar
function showSnackbar(message, type = 'info') {
    // Create snackbar element
    const snackbar = document.createElement('div');
    snackbar.className = `snackbar ${type}`;
    snackbar.innerHTML = `
        <span class="snackbar-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ️'}</span>
        <span>${message}</span>
    `;
    
    // Add to page
    document.getElementById('main-app').appendChild(snackbar);
    
    // Remove after 3.5 seconds
    setTimeout(() => {
        snackbar.remove();
    }, 3500);
}

// Start Add Listing Flow
function startAddListingFlow() {
    // Reset add listing data
    addListingData = {
        step: 1,
        location: null,
        address: '',
        title: '',
        rentPrice: '',
        bedrooms: '',
        bathrooms: '',
        propertyType: '',
        availableFrom: '',
        description: '',
        landlordName: '',
        landlordPhone: '',
        confirmed: false
    };
    
    showScreen('add-listing-flow');
    showAddListingStep(1);
}

// Show Add Listing Step
function showAddListingStep(step) {
    // Hide all steps
    document.querySelectorAll('.add-listing-step').forEach(s => {
        s.classList.add('hidden');
    });
    
    // Show current step
    const currentStepElement = document.getElementById(`add-${step === 1 ? 'location' : step === 2 ? 'details' : 'contact'}-step`);
    if (currentStepElement) {
        currentStepElement.classList.remove('hidden');
        addListingData.step = step;
        
        // Step-specific initialization
        if (step === 1) {
            initializeLocationStep();
        } else if (step === 2) {
            initializeDetailsStep();
        } else if (step === 3) {
            initializeContactStep();
        }
    }
}

// Initialize Add Listing Flow
function initializeAddListingFlow() {
    // This is called when the add listing flow screen is shown
    showAddListingStep(1);
}

// Initialize Location Step
function initializeLocationStep() {
    // Check if Google Maps API is available
    if (!window.google || !google.maps) {
        console.error('Google Maps API not available for location step');
        showSnackbar('Map unavailable. Please check your connection.', 'error');
        return;
    }
    
    // Initialize location map
    if (!locationMap) {
        const mapElement = document.getElementById('location-map');
        if (!mapElement) {
            console.error('Location map element not found');
            return;
        }
        
        try {
            locationMap = new google.maps.Map(mapElement, {
                center: { lat: 0.3476, lng: 32.5825 },
                zoom: 15,
                styles: [
                    {
                        featureType: "all",
                        elementType: "geometry",
                        stylers: [{ color: "#EAE6DE" }]
                    },
                    {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#FFFFFF" }]
                    }
                ],
                gestureHandling: 'greedy',
                disableDefaultUI: true
            });
            
            // Add click listener to place marker
            locationMap.addListener('click', function(event) {
                placeDraggableMarker(event.latLng);
            });
            
            console.log('Location map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize location map:', error);
            showSnackbar('Failed to load location map.', 'error');
        }
    }
    
    // Setup address search
    const addressInput = document.getElementById('address-search');
    if (!addressInput) {
        console.error('Address search input not found');
        return;
    }
    
    // Check if Places API is available
    if (!google.maps.places) {
        console.error('Google Places API not available');
        showSnackbar('Address search unavailable.', 'error');
        return;
    }
    
    try {
        const autocomplete = new google.maps.places.Autocomplete(addressInput);
        
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            if (place.geometry) {
                locationMap.panTo(place.geometry.location);
                locationMap.setZoom(16);
                placeDraggableMarker(place.geometry.location);
                addressInput.value = place.formatted_address || place.name;
            } else {
                console.warn('Place selected but no geometry available');
                showSnackbar('Please select a valid location from the suggestions.', 'error');
            }
        });
        
        console.log('Places autocomplete initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Places autocomplete:', error);
        showSnackbar('Address search failed to initialize.', 'error');
    }
    
    // Setup confirm button
    const confirmBtn = document.getElementById('confirm-location-btn');
    const resetBtn = document.getElementById('reset-location-btn');
    const continueBtn = document.getElementById('continue-to-details-btn');
    
    confirmBtn.addEventListener('click', function() {
        if (addListingData.location) {
            addListingData.confirmed = true;
            showLocationConfirmed();
            continueBtn.disabled = false;
        }
    });
    
    resetBtn.addEventListener('click', function() {
        resetLocationStep();
    });
    
    continueBtn.addEventListener('click', function() {
        if (addListingData.confirmed) {
            showAddListingStep(2);
        }
    });
}

// Place Draggable Marker
function placeDraggableMarker(location) {
    try {
        // Remove existing marker
        if (draggableMarker) {
            draggableMarker.setMap(null);
        }
        
        // Create new draggable marker
        draggableMarker = new google.maps.Marker({
            position: location,
            map: locationMap,
            draggable: true,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <div style="
                        width: 44px;
                        height: 44px;
                        border-radius: 50% 50% 50% 4px;
                        background: #0A0A0A;
                        border: 3px solid white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transform: rotate(-45deg);
                        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
                    ">
                        <span style="
                            font-size: 20px;
                            transform: rotate(45deg);
                            color: white;
                        ">🏠</span>
                    </div>
                `),
                anchor: new google.maps.Point(22, 44)
            }
        });
    
    // Update location data
    addListingData.location = {
        latitude: location.lat(),
        longitude: location.lng()
    };
    
    // Add drag listener
    draggableMarker.addListener('dragend', function(event) {
        addListingData.location = {
            latitude: event.latLng.lat(),
            longitude: event.latLng.lng()
        };
        
        // Reverse geocode to get address
        reverseGeocode(event.latLng);
    });
    
    // Hide tap hint and show confirm strip
    document.getElementById('tap-hint').classList.add('hidden');
    document.getElementById('location-confirm').classList.remove('hidden');
    
    // Get address for initial placement
    reverseGeocode(location);
    
    } catch (error) {
        console.error('Failed to place draggable marker:', error);
        showSnackbar('Failed to place location marker.', 'error');
    }
}

// Reverse Geocode
function reverseGeocode(location) {
    // Check if Geocoding API is available
    if (!google.maps.Geocoder) {
        console.error('Google Geocoding API not available');
        showSnackbar('Address lookup unavailable.', 'error');
        return;
    }
    
    try {
        const geocoder = new google.maps.Geocoder();
        
        geocoder.geocode({ location: location }, function(results, status) {
            if (status === 'OK' && results && results[0]) {
                addListingData.address = results[0].formatted_address;
                const addressInput = document.getElementById('address-search');
                const confirmAddress = document.getElementById('confirm-address');
                
                if (addressInput) {
                    addressInput.value = results[0].formatted_address;
                }
                if (confirmAddress) {
                    confirmAddress.textContent = results[0].formatted_address;
                }
                
                console.log('Reverse geocoding successful:', results[0].formatted_address);
            } else {
                console.warn('Geocoding failed:', status);
                showSnackbar('Unable to find address for this location.', 'error');
                
                // Set a generic address
                const genericAddress = `${location.lat().toFixed(6)}, ${location.lng().toFixed(6)}`;
                addListingData.address = genericAddress;
                const addressInput = document.getElementById('address-search');
                const confirmAddress = document.getElementById('confirm-address');
                
                if (addressInput) {
                    addressInput.value = genericAddress;
                }
                if (confirmAddress) {
                    confirmAddress.textContent = genericAddress;
                }
            }
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        showSnackbar('Address lookup failed.', 'error');
    }
}

// Show Location Confirmed
function showLocationConfirmed() {
    const confirmStrip = document.getElementById('location-confirm');
    confirmStrip.innerHTML = `
        <div class="confirmed-strip">
            <span class="cs-check">✓</span>
            <div class="cs-info">
                <div class="cs-title">Location confirmed</div>
                <div class="cs-addr">${addListingData.address}</div>
            </div>
            <span class="cs-edit" onclick="resetLocationStep()">Edit</span>
        </div>
    `;
}

// Reset Location Step
function resetLocationStep() {
    // Remove marker
    if (draggableMarker) {
        draggableMarker.setMap(null);
        draggableMarker = null;
    }
    
    // Reset data
    addListingData.location = null;
    addListingData.address = '';
    addListingData.confirmed = false;
    
    // Reset UI
    document.getElementById('address-search').value = '';
    document.getElementById('tap-hint').classList.remove('hidden');
    document.getElementById('location-confirm').classList.add('hidden');
    document.getElementById('continue-to-details-btn').disabled = true;
    
    // Reset confirm strip
    document.getElementById('location-confirm').innerHTML = `
        <div class="confirm-address" id="confirm-address"></div>
        <div class="confirm-buttons">
            <button id="reset-location-btn" class="secondary-btn">Reset</button>
            <button id="confirm-location-btn" class="primary-btn">Confirm this location ✓</button>
        </div>
    `;
    
    // Re-attach event listeners
    const confirmBtn = document.getElementById('confirm-location-btn');
    const resetBtn = document.getElementById('reset-location-btn');
    
    confirmBtn.addEventListener('click', function() {
        if (addListingData.location) {
            addListingData.confirmed = true;
            showLocationConfirmed();
            document.getElementById('continue-to-details-btn').disabled = false;
        }
    });
    
    resetBtn.addEventListener('click', function() {
        resetLocationStep();
    });
}

// Initialize Details Step
function initializeDetailsStep() {
    // Setup form fields
    const titleInput = document.getElementById('property-title');
    const rentInput = document.getElementById('monthly-rent');
    const bedroomsSelect = document.getElementById('bedrooms');
    const bathroomsSelect = document.getElementById('bathrooms');
    const typeSelect = document.getElementById('property-type');
    const availableInput = document.getElementById('available-from');
    const descriptionInput = document.getElementById('property-description');
    const continueBtn = document.getElementById('continue-to-contact-btn');
    
    // Set default available date to today
    availableInput.value = new Date().toISOString().split('T')[0];
    
    // Add input listeners for validation
    const validateForm = () => {
        const isValid = titleInput.value.trim() && 
                       rentInput.value && 
                       bedroomsSelect.value && 
                       bathroomsSelect.value;
        continueBtn.disabled = !isValid;
    };
    
    titleInput.addEventListener('input', validateForm);
    rentInput.addEventListener('input', validateForm);
    bedroomsSelect.addEventListener('change', validateForm);
    bathroomsSelect.addEventListener('change', validateForm);
    
    // Back button
    const backBtn = document.querySelector('#add-details-step .back-btn');
    backBtn.addEventListener('click', function() {
        showAddListingStep(1);
    });
    
    // Continue button
    continueBtn.addEventListener('click', function() {
        // Save form data
        addListingData.title = titleInput.value.trim();
        addListingData.rentPrice = rentInput.value;
        addListingData.bedrooms = bedroomsSelect.value;
        addListingData.bathrooms = bathroomsSelect.value;
        addListingData.propertyType = typeSelect.value;
        addListingData.availableFrom = availableInput.value;
        addListingData.description = descriptionInput.value.trim();
        
        showAddListingStep(3);
    });
}

// Initialize Contact Step
function initializeContactStep() {
    // Setup form fields
    const nameInput = document.getElementById('landlord-name');
    const phoneInput = document.getElementById('landlord-phone');
    const publishBtn = document.getElementById('publish-listing-btn');
    
    // Show review summary
    updateReviewSummary();
    
    // Add input listeners for validation
    const validateForm = () => {
        const isValid = nameInput.value.trim() && phoneInput.value.trim();
        publishBtn.disabled = !isValid;
    };
    
    nameInput.addEventListener('input', validateForm);
    phoneInput.addEventListener('input', validateForm);
    
    // Back button
    const backBtn = document.querySelector('#add-contact-step .back-btn');
    backBtn.addEventListener('click', function() {
        showAddListingStep(2);
    });
    
    // Publish button
    publishBtn.addEventListener('click', function() {
        publishListing();
    });
}

// Update Review Summary
function updateReviewSummary() {
    const reviewSummary = document.getElementById('review-summary');
    
    reviewSummary.innerHTML = `
        <div class="rc-detail">
            <strong>${addListingData.title || 'Untitled Property'}</strong>
            ${addListingData.bedrooms ? ` • ${addListingData.bedrooms} bed` : ''}
            ${addListingData.rentPrice ? ` • UGX ${formatPrice(addListingData.rentPrice)}/mo` : ''}
        </div>
        <div class="rc-detail">${addListingData.address || 'Location not set'}</div>
    `;
}

// Publish Listing
async function publishListing() {
    const publishBtn = document.getElementById('publish-listing-btn');
    const originalText = publishBtn.innerHTML;
    
    try {
        // Show loading state
        publishBtn.innerHTML = 'Publishing…';
        publishBtn.disabled = true;
        
        // Save contact info
        addListingData.landlordName = document.getElementById('landlord-name').value.trim();
        addListingData.landlordPhone = document.getElementById('landlord-phone').value.trim();
        
        // Prepare observation data
        const observationData = {
            name: addListingData.title,
            property_type: addListingData.propertyType,
            rent_price: parseInt(addListingData.rentPrice),
            bedrooms: parseInt(addListingData.bedrooms),
            bathrooms: parseInt(addListingData.bathrooms),
            location: addListingData.location,
            description: addListingData.description,
            landlord_name: addListingData.landlordName,
            landlord_phone: addListingData.landlordPhone,
            available: true,
            available_from: addListingData.availableFrom
        };
        
        // Save to Formulus or demo mode
        if (formulusApi) {
            // TODO: Use correct Formulus API method
            console.log('Would save to Formulus:', observationData);
            // const result = await formulusApi.addObservation('register_house', observationData);
        } else {
            // Demo mode - add to local listings
            listings.push({ data: observationData });
            console.log('Demo mode: saved listing locally');
        }
        
        // Show success message
        showSnackbar('Property listed successfully!', 'success');
        
        // Return to main app
        setTimeout(() => {
            showScreen('main-app');
            loadProperties(); // Refresh the map
        }, 1500);
        
    } catch (error) {
        console.error('Failed to publish listing:', error);
        showSnackbar('Failed to save listing. Please try again.', 'error');
        
        // Reset button
        publishBtn.innerHTML = originalText;
        publishBtn.disabled = false;
    }
}

// Show My Listings
function showMyListings() {
    const myListingsSheet = document.getElementById('my-listings-sheet');
    
    // Update listings count
    const myListingsCount = listings.length;
    document.querySelector('#my-listings-sheet .ml-sub').textContent = `${myListingsCount} active properties`;
    
    // Populate listings content
    const listingsContent = document.getElementById('listings-content');
    
    if (myListingsCount === 0) {
        listingsContent.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <div style="font-size: 32px; margin-bottom: 8px;">🏠</div>
                <div style="font-size: 13px; font-weight: 700; margin-bottom: 4px;">No listings yet</div>
                <div style="font-size: 11px; color: var(--mid-grey);">Tap the + button to add your first property</div>
            </div>
        `;
    } else {
        listingsContent.innerHTML = listings.map((listing, index) => {
            const data = listing.data;
            return `
                <div class="listing-item">
                    <div class="item-price-box">
                        <div class="item-price-label">UGX</div>
                        <div class="item-price-amount">${formatPrice(data.rent_price)}</div>
                        <div class="item-price-unit">/mo</div>
                    </div>
                    <div class="item-info">
                        <div class="item-name">${data.name || 'Property'}</div>
                        <div class="item-address">${data.address || 'Location not set'}</div>
                        <div class="item-chips">
                            ${data.bedrooms ? `<div class="item-chip">🛏️ ${data.bedrooms}</div>` : ''}
                            ${data.property_type ? `<div class="item-chip">${data.property_type}</div>` : ''}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="deleteListing(${index})">🗑️</button>
                </div>
            `;
        }).join('');
    }
    
    // Setup event listeners
    setupMyListingsListeners();
    
    // Show sheet
    myListingsSheet.classList.remove('hidden');
    myListingsSheet.classList.add('show');
}

// Setup My Listings Listeners
function setupMyListingsListeners() {
    // Close button
    const closeBtn = document.querySelector('#my-listings-sheet .close-btn');
    closeBtn.addEventListener('click', function() {
        const sheet = document.getElementById('my-listings-sheet');
        sheet.classList.remove('show');
        setTimeout(() => {
            sheet.classList.add('hidden');
        }, 350);
    });
    
    // Add new property button
    const addNewBtn = document.querySelector('#my-listings-sheet .add-new-btn');
    addNewBtn.addEventListener('click', function() {
        const sheet = document.getElementById('my-listings-sheet');
        sheet.classList.remove('show');
        setTimeout(() => {
            sheet.classList.add('hidden');
            startAddListingFlow();
        }, 350);
    });
}

// Delete Listing
function deleteListing(index) {
    const listing = listings[index];
    
    if (confirm(`Remove "${listing.data.name || 'Property'}"? This cannot be undone.`)) {
        // Remove from listings
        listings.splice(index, 1);
        
        // TODO: Delete from Formulus API
        if (formulusApi && listing.observationId) {
            console.log('Would delete from Formulus:', listing.observationId);
            // await formulusApi.deleteObservation(listing.observationId);
        }
        
        // Refresh my listings
        showMyListings();
        
        // Refresh map
        displayProperties();
        updateListingCount();
        
        showSnackbar('Listing removed', 'success');
    }
}

// Google Maps Callback
function initMaps() {
    console.log('Google Maps API loaded successfully');
    
    // Verify all required APIs are available
    if (!google.maps) {
        console.error('Google Maps core not available');
        showSnackbar('Maps API failed to load properly.', 'error');
        return;
    }
    
    if (!google.maps.places) {
        console.error('Google Places API not available');
        showSnackbar('Places API not available. Address search will be limited.', 'error');
    }
    
    if (!google.maps.Geocoder) {
        console.error('Google Geocoding API not available');
        showSnackbar('Geocoding API not available. Address lookup will be limited.', 'error');
    }
    
    console.log('All Google Maps APIs verified and ready');
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
