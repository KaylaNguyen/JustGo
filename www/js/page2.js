window.onload  = getMap;
var map = null;
var directionsDisplay = null;
var geocoder = null;
var infowindow;
// variables holding origin and destination latitude and longitude
var orig;
var dest;

function getDataPackage(){
	var query = window.location.search;
	if (query.substring(0, 1) == '?') {
		query = query.substring(1);
	}
	var data = query.split(',');
	for (i = 0; i < data.length; i++) {
		data[i] = unescape(data[i]);
	}
	return data;
}

function setSourceValue(){
	var data = getDataPackage();
	$("#source").val(data[0]);
	return data[0];
}

function setDestinationValue(){
	var data = getDataPackage();
	$("#destination").val(data[1]);
	return data[1];
}

function getMap(){
	// Create a map object and specify the DOM element for display.
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 42.2579438, lng: -72.5785799},
		scrollwheel: false,
		zoom: 12
	});
	// initialize directionsDisplay
	directionsDisplay = new google.maps.DirectionsRenderer({
		map: map
	});
	// initialize geocoder
	geocoder = new google.maps.Geocoder();
	//google.maps.event.addDomListener(window, 'load', initialize);
	searchAddr(geocoder, map);
	// wait for search address to finish, then create direction
	setTimeout(createDirection, 2000);
}

function searchAddr(geocoder, resultsMap) {
	// find latitude and longitude of origin location
	var from = setSourceValue();
	geocoder.geocode({'address': from}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			resultsMap.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
				map: resultsMap,
				position: results[0].geometry.location
			});
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
		// set orig to be LatLng type
		orig = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
	});
	//console.log(orig);

	// find latitude and longitude of origin location
	var from = setDestinationValue();
	geocoder.geocode({'address': from}, function(results, status) {
		if (status === google.maps.GeocoderStatus.OK) {
			resultsMap.setCenter(results[0].geometry.location);
			var marker = new google.maps.Marker({
				map: resultsMap,
				position: results[0].geometry.location
			});
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
		// set dest to be LatLng type
		dest = new google.maps.LatLng(results[0].geometry.location.lat(), results[0].geometry.location.lng());
	});
	//console.log(dest);
}

function createDirection() {
	// Set destination, origin and travel mode.
	var request = {
		origin: orig,
		destination: dest,
		travelMode: google.maps.TravelMode.DRIVING
	};

	// Pass the directions request to the directions service.
	var directionsService = new google.maps.DirectionsService();
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			// Display the route on the map.
			directionsDisplay.setDirections(response);
		}
	});
}


//new google.maps.DirectionsWaypoint

// find places of interest around destination
// types of place to search
// does not include shopping places except shopping mall
function findPOI() {
    // recenter and zoom on map
    map.setCenter(dest);
    map.setZoom(16);

    // initialize info window
    infowindow = new google.maps.InfoWindow();

    // create new service for search
    var service = new google.maps.places.PlacesService(map);
    service.nearbySearch({
        location: dest,
        radius: 2000,
        types: ['aquarium',
            'art_gallery',
            'library',
            'bowling_alley',
            'cafe',
            'campground',
            'casino',
            'movie_theater',
            'museum',
            'park',
            'painter',
            'rv_park',
            'shopping_mall',
            'spa',
            'stadium',
            'zoo']
    }, callback);
}

// function called when search
function callback(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            createMarker(results[i]);
        }
        console.log(results);
    }
}

// create marker for place
function createMarker(place) {
    //var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    // when clicked on marker, show name of place
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(place.name);
        infowindow.open(map, this);
    });
}

// Run the initialize function when the window has finished loading.
//google.maps.event.addDomListener(window, 'load', initialize);