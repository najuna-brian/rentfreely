let map;
let marker;
let selectedLocation = null;
let searchBox;
let geocoder;

function initMap() {
    // Uganda center coordinates
    const ugandaCenter = { lat: 1.3733, lng: 32.2903 };
    
    // Initialize map centered on Uganda with appropriate zoom
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: ugandaCenter,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        styles: [
            {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
            }
        ]
    });
    
    // Initialize geocoder
    geocoder = new google.maps.Geocoder();
    
    // Initialize search box
    const searchInput = document.getElementById('search-input');
    searchBox = new google.maps.places.SearchBox(searchInput);
    
    // Bias search results to Uganda bounds
    const ugandaBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-1.5, 29.5),
        new google.maps.LatLng(4.0, 35.0)
    );
    searchBox.setBounds(ugandaBounds);
    
    // Listen for place selection
    searchBox.addListener('places_changed', function() {
        const places = searchBox.getPlaces();
        if (places.length === 0) {
            return;
        }
        
        const place = places[0];
        if (!place.geometry || !place.geometry.location) {
            console.log("Place has no geometry");
            return;
        }
        
        // Center map on selected place
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
        }
        
        // Clear any existing marker - user will click to place property
        if (marker) {
            marker.setMap(null);
            marker = null;
            selectedLocation = null;
        }
        updateLocationInfo();
    });
    
    // Add click listener to map for property placement
    map.addListener('click', function(event) {
        placePropertyMarker(event.latLng);
    });
    
    // Try to get user's current location (if in Uganda)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                // Check if user is in Uganda (rough bounds)
                const inUganda = userLocation.lat >= -1.5 && userLocation.lat <= 4.0 && 
                               userLocation.lng >= 29.5 && userLocation.lng <= 35.0;
                
                if (inUganda) {
                    map.setCenter(userLocation);
                    map.setZoom(15);
                }
            },
            function() {
                console.log('Location access denied, staying centered on Uganda');
            }
        );
    }
}

function placePropertyMarker(location) {
    // Remove existing marker if any
    if (marker) {
        marker.setMap(null);
    }
    
    // Store selected location
    selectedLocation = {
        lat: location.lat(),
        lng: location.lng()
    };
    
    // Create new marker for property
    marker = new google.maps.Marker({
        position: location,
        map: map,
        title: 'Property Location',
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/home.png',
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    // Get address using reverse geocoding
    geocoder.geocode({ location: selectedLocation }, function(results, status) {
        let address = 'No address found';
        if (status === 'OK' && results[0]) {
            address = results[0].formatted_address;
        }
        
        // Create info window with property details
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="padding: 8px; min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0;">🏠 Property Location</h4>
                    <p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${address}</p>
                    <p style="margin: 4px 0; font-size: 11px; color: #666;">
                        ${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}
                    </p>
                    <button onclick="openPropertyForm()" 
                            style="margin-top: 8px; padding: 6px 12px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        Register This Property
                    </button>
                </div>
            `
        });
        
        marker.addListener('click', function() {
            infoWindow.open(map, marker);
        });
        
        // Auto-open info window
        setTimeout(() => infoWindow.open(map, marker), 500);
    });
    
    // Update UI
    updateLocationInfo();
}

function updateLocationInfo() {
    const coordsElement = document.getElementById('coords');
    const registerBtn = document.getElementById('register-btn');
    
    if (selectedLocation) {
        coordsElement.textContent = `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`;
        registerBtn.disabled = false;
    } else {
        coordsElement.textContent = 'Not selected';
        registerBtn.disabled = true;
    }
}

function openPropertyForm() {
    if (!selectedLocation) {
        alert('Please select a property location first by clicking on the map');
        return;
    }
    
    // Store location data for form transfer
    const propertyData = {
        location: {
            lat: selectedLocation.lat,
            lng: selectedLocation.lng
        },
        coords: `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
    };
    
    // Store in localStorage for form to access
    localStorage.setItem('rentfreely_property_location', JSON.stringify(propertyData));
    
    // Open the real ODE form with pre-filled data
    try {
        // Check if we're in Formulus/ODE environment
        if (window.Formulus || window.ODE) {
            // Use Formulus form opener
            const formSystem = window.Formulus || window.ODE;
            
            // Open register_house form with pre-filled location
            formSystem.openForm('register_house', {
                prefill: {
                    location: {
                        latitude: selectedLocation.lat,
                        longitude: selectedLocation.lng
                    }
                }
            });
        } else if (window.ode && window.ode.openForm) {
            // Alternative ODE API
            window.ode.openForm('register_house', {
                location: propertyData.location
            });
        } else {
            // Try to navigate to form via URL (common in ODE)
            const formUrl = `#/forms/register_house?location=${propertyData.coords}`;
            window.location.hash = formUrl;
            
            // Also try to trigger form via custom event
            window.dispatchEvent(new CustomEvent('openForm', {
                detail: {
                    formName: 'register_house',
                    data: {
                        location: propertyData.location
                    }
                }
            }));
        }
    } catch (error) {
        console.error('Error opening ODE form:', error);
        
        // Fallback: try URL navigation
        try {
            window.location.href = `#/forms/register_house?lat=${selectedLocation.lat}&lng=${selectedLocation.lng}`;
        } catch (e) {
            alert('Unable to open form. Please ensure you are running this app in Formulus/ODE environment.');
        }
    }
    
    console.log('Opening ODE form with property data:', propertyData);
}

// Handle register button click
document.getElementById('register-btn').addEventListener('click', function() {
    if (selectedLocation) {
        openPropertyForm();
    }
});

// Initialize location info on page load
document.addEventListener('DOMContentLoaded', function() {
    updateLocationInfo();
});

// Make functions globally available for onclick handlers
window.openPropertyForm = openPropertyForm;
