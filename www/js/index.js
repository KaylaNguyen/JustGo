/**
 * Take-Me-With-You is a web application that plans a one-day trip for travelers using Google Map.
 */

/**
 * Global variables
 */
// google map
var map;
// variables holding origin and destination latitude and longitude
var orig;
var dest;
// variable holding a list of places to visit
var listOfDest;

// info window for marker
var infowindow;


/**
 * Called when the program is loaded
 * Adds search boxes to map
 * The search box will return a list containing places and predicted search terms.
 */
function initSearch() {
    // initialize map
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 42.2579438, lng: -72.5785799},
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    // Create the origin search box and link it to the UI element.
    var origin = document.getElementById('origin-input');
    var oriSearchBox = new google.maps.places.SearchBox(origin);
    // push the oriSearchBox to the map
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(origin);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        oriSearchBox.setBounds(map.getBounds());
    });

    // an array of marker on map
    var markers = [];

    // Listen for the event fired when the user selects a prediction
    // retrieve more details for that place.
    oriSearchBox.addListener('places_changed', function () {
        var oriplaces = oriSearchBox.getPlaces();

        if (oriplaces.length == 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function (marker) {
            marker.setMap(null);
        });
        markers = [];

        // For each place, get name and location.
        var bounds = new google.maps.LatLngBounds();
        oriplaces.forEach(function (place) {
            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            // set orig to be LatLng type
            orig = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
            console.log(orig);
        });
        // adjust map view
        map.fitBounds(bounds);
        map.setZoom(12);
    });

    // Create the destination search box and link it to the UI element.
    var destination = document.getElementById('destination-input');
    var destiSearchBox = new google.maps.places.SearchBox(destination);
    // push the box to the map
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(destination);

    // Bias the SearchBox results towards current map's viewport.
    map.addListener('bounds_changed', function () {
        destiSearchBox.setBounds(map.getBounds());
    });

    // Listen for the event fired when the user selects a prediction
    // retrieve more details for that place.
    destiSearchBox.addListener('places_changed', function () {
        var destiplaces = destiSearchBox.getPlaces();

        if (destiplaces.length == 0) {
            return;
        }

        // For each place, get name and location.
        var bounds = new google.maps.LatLngBounds();
        destiplaces.forEach(function (place) {
            // Create a marker for each place.
            markers.push(new google.maps.Marker({
                map: map,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
            // set dest to be LatLng type
            dest = new google.maps.LatLng(place.geometry.location.lat(), place.geometry.location.lng());
            console.log(dest);

        });

        // adjust map view
        map.setZoom(7);

        // wait for search address to finish, then create direction
        if (orig != null && dest != null) {
            createDirection();
            // wait 2 seconds for direction to be formed, then call findPOIN
            setTimeout(findPOI, 1000);
            setTimeout(computeDistance, 2000);
        }
    });
}

// create driving direction between origin and destination
function createDirection() {
    // initialize directionsDisplay
    var directionsDisplay = new google.maps.DirectionsRenderer({
        map: map
    });
    // initialize geocoder
    // var geocoder = new google.maps.Geocoder();
    // Set destination, origin and travel mode.
    var request = {
        origin: orig,
        destination: dest,
        travelMode: google.maps.TravelMode.DRIVING
    };

    // Pass the directions request to the directions service.
    var directionsService = new google.maps.DirectionsService();
    directionsService.route(request, function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            // Display the route on the map.
            directionsDisplay.setDirections(response);
        }
    });
}

// find places of interest around destination
// types of place to search
// does not include shopping places except shopping mall
function findPOI() {
    // recenter and zoom on map
    map.setCenter(dest);
    map.setZoom(14);

    //listOfDest = {};
    listOfDest = new Array();

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
            // push location to listOfDest
            //listOfDest[i] = results[i].geometry.location;
            listOfDest.push(results[i].geometry.location);
            //console.log(results);
        }
        //console.log(results);
        //console.log(listOfDest);
    }
}

// create marker for place
function createMarker(place) {
    //var placeLoc = place.geometry.location;
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location
    });

    // when clicked on marker, show name and rating of place
    google.maps.event.addListener(marker, 'click', function () {
        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + '\nRating: ' + place.rating);
        infowindow.open(map, this);
    });
}

// compute distance between places
// using nearest neighbor algorithm to get the place order
function computeDistance() {
    // 1st set current node is the origin
    currentNode = orig;
    // array to store the place order
    orderArray = [];
    // hashmap to store place with the distance from currentNode
    var hmap = {};
    // keep a counter to count the number of places in the list
    var listLength = 0;
    for (item in listOfDest){
        listLength++;
    }
    console.log(listLength);
    // while there's still place in the list
    for(i = listLength; i > 0; i--) {
        console.log("Got to while");
        // find all distance from currentNode to all places in the list
        var service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix(
            {
                origins: [currentNode],
                destinations: listOfDest,
                travelMode: google.maps.TravelMode.DRIVING,
                unitSystem: google.maps.UnitSystem.IMPERIAL,
                avoidHighways: false,
                avoidTolls: false
            }, callback);


        function callback(response, status) {
            if (status == google.maps.DistanceMatrixStatus.OK) {
                var origins = response.originAddresses;
                var destinations = response.destinationAddresses;

                for (var i = 0; i < origins.length; i++) {
                    var results = response.rows[i].elements;
                    for (var j = 0; j < results.length; j++) {
                        var element = results[j];
                        var distance = element.distance.text;
                        var duration = element.duration.text;
                        var from = origins[i];
                        var to = destinations[j];
                        //console.log(response);
                        //console.log(results);
                        console.log("From: " + from + " ––> " + to);
                        console.log("Distance: " + distance);
                        //console.log("Duration: " + duration);
                        // store the place name and distance and duration to hmap
                        hmap[to] = {distance: distance, duration: duration, number: j};
                    }
                }
            }
        }

        // wait 2 seconds then find distance
        setTimeout(findShortestDistance, 1000);
        function findShortestDistance() {
            // put all distance value from hmap in an array
            var distanceArray = [];
            for (var x in hmap) {
                distanceArray.push(hmap[x]['distance']);
                console.log(hmap[x]['distance'])
            }
            // sort the array
            distanceArray.sort();
            // get the shortest distance
            shortestDistance = distanceArray[0];
            console.log(shortestDistance);
            // loop through hmap to find the place that has the smallest distance
            for (var y in hmap) {
                if (hmap[y]['distance'] == shortestDistance) {
                    console.log('hmap at y is ');
                    console.log(hmap[y]);
                    // add the place to the orderArray
                    orderArray.push(currentNode);
                    // remove that place from listOfDest
                    index = hmap[y]['number'];
                    // currentNode is now that place
                    currentNode = listOfDest[index];
                    console.log('current node is now ');
                    console.log(currentNode);
                    //delete listOfDest[index];
                    listOfDest[index] = null;
                    console.log('list of Dest is ');
                    console.log(listOfDest);
                    console.log('list length is ' + listLength);
                    listLength--;
                    console.log('list length is ' + listLength);
                    // make a new listOfDest without null object
                    var tempList = new Array();
                    for (z in listOfDest){
                        if (listOfDest[z] != null){
                            tempList.push(listOfDest[z]);
                        }
                    }
                    listOfDest = tempList;
                    console.log("listOfDest is now ");
                    console.log(listOfDest);
                    break;
                }
            }
        }

        setInterval(1000);
    }
}