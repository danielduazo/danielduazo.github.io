// API Key MacBook Pro Chrome
// AIzaSyALKhUPm8aKcUyqaMyy8uQFC9tA8lDnzBs

var map;
var geocoder;
var markers = []; // Array that holds the pins/markers of start/end locations

// Function to initialize the maps
function initialize() {
    var myLatLng = {lat: 37.8715926, lng: -122.25974699999998}; // 1224 E Acacia Ave, El Segundo, CA 90245

    // Set map options
    var mapOpt = {
        center: myLatLng, // Center at myLatLng
        zoom: 15,
        mapTypeId:google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('googleMap'), mapOpt); // Create new map object in googleMap div

    // Try HTML5 geolocation to center map at current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            map.setCenter(pos)
        })
    }

    var startAddrInput = document.getElementById('startAddress'); // Start address input DOM
    var endAddrInput = document.getElementById('endAddress'); // End address input DOM

    var startAutocomplete = new google.maps.places.Autocomplete(startAddrInput, {types: ['geocode']}); // Create autocomplete search box for start address input
    var endAutocomplete = new google.maps.places.Autocomplete(endAddrInput, {types: ['geocode']}); // Create autocomplete search box for end address input

    // Record lat and lng when a location is entered into the start address box
    google.maps.event.addListener(startAutocomplete, 'place_changed', function () {
        var startPlace = startAutocomplete.getPlace();
        document.getElementById('startLat').value = startPlace.geometry.location.lat();
        document.getElementById('startLng').value = startPlace.geometry.location.lng();
    });

    // Record lat and lng when a location is entered into the end address box
    google.maps.event.addListener(endAutocomplete, 'place_changed', function () {
        var endPlace = endAutocomplete.getPlace();
        document.getElementById('endLat').value = endPlace.geometry.location.lat();
        document.getElementById('endLng').value = endPlace.geometry.location.lng();
    });
}

// Bias the autocomplete object to the user's geographical location,
// as supplied by the browser's 'navigator.geolocation' object.
function geolocate() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        var circle = new google.maps.Circle({
            center: geolocation,
            radius: position.coords.accuracy
        });
        autocomplete.setBounds(circle.getBounds());
        });
    }
}

google.maps.event.addDomListener(window, 'load', initialize); // Initialize map and forms on load

function processAddress(start, end) {
    if (document.getElementById('startAddress').value == "" || document.getElementById('startAddress').value == "") {
        alert("Please enter a valid start and end address!");
        return;
    }
    var startLat = Number(document.getElementById('startLat').value);
    var startLng = Number(document.getElementById('startLng').value);
    var endLat = Number(document.getElementById('endLat').value);
    var endLng = Number(document.getElementById('endLng').value);
    var startCoords = new google.maps.LatLng(startLat, startLng);
    var endCoords = new google.maps.LatLng(endLat, endLng);

    // Delete any markers that might exist on the map
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }

    // Draw marker at start
    var startMarker = new google.maps.Marker({
        position: startCoords,
        map: map,
        title: 'Start',
        label: 'A'
    });

    // Draw marker at end
    var endMarker = new google.maps.Marker({
        position: endCoords,
        map: map,
        title: 'End',
        label: 'B'
    });

    // Zoom map to fit all markers
    markers = [startMarker, endMarker];
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }
    map.fitBounds(bounds);

    // Distance Matrix API call
    var service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
    {
        origins: [startCoords],
        destinations: [endCoords],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidTolls: true,
    }, callback);

    function callback(response, status) {
        if (status == 'OK') {
            var origins = response.originAddresses;
            var destinations = response.destinationAddresses;

            for (var i = 0; i < origins.length; i++) {
                var results = response.rows[i].elements;
                for (var j = 0; j < results.length; j++) {
                    var element = results[j];
                    var distance = element.distance.text;
                    var distanceMeters = element.distance.value; // API only returns value in meters
                    var duration = element.duration.text;

                    var distanceMiles = metersToMiles(distanceMeters);
                    var cost = calculateCost(distanceMiles, startLat, startLng);

                    // Print to web page
                    $('#outputDiv').html("<p>The distance from " + document.getElementById('startAddress').value + 
                        ", to " + document.getElementById('endAddress').value + ", is " + distance + 
                        ".</p> <p>The cost of this trip is $" + cost + ".</p>");
                }
            }
        }
    }
}

// Convert M meters to miles
function metersToMiles(m) {
    // 1 mile = 1609.34 meters
    return m / 1609.34;
}

// Calculate the cost of driving DISTANCE based on the car's miles per gallon and current gas prices
// Originally built for my friend's 2001 Suzuki Esteem sedan 4 cyl, 1.6 L, Automatic 4-spd, which gets 26 miles per gallon
function calculateCost(distance, lat, lng) {
    var mpg = 26; // Next step would to let user select make/model of car and find MPG of that car
    var gas_price;

/*  // The data from this API is 4 years old, inaccurate
    // API from http://www.mygasfeed.com/keys/api
    // Latitude: given
    // Longitude: given
    // Distance: given
    // Fuel type: regular
    // Sort by: distance
    // API key: rfej9napna (developer) 
    var gas_priceAPI = "http://devapi.mygasfeed.com/stations/radius/" + lat + "/" + lng + "/" + distance + "/reg/distance/rfej9napna.json?";
    $.ajax({
        url: gas_priceAPI
    }).done(function (html) {
        html = JSON.parse(html);
        gas_price = html['stations'][0]['reg_price'];
        console.log(gas_price);
    })
 */   

    gas_price = 2.45; 
    // This was the average gas price in Los Angeles at the time of development (July 2016)
    // Will pull from API once we can find a working/current gas price API

    var cost = (distance / mpg) * gas_price;
    return Math.round(100*cost)/100; // Round to nearest hundredth
}

// jQuery
$(document).ready(function(){
    $('#submitAddress').click(function(){
        var start = document.getElementById('startAddress').value;
        var end = document.getElementById('endAddress').value;
        processAddress(start, end);
    });
});