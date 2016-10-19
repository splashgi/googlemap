// JavaScript Document
jQuery(function() {

  var map = new window.google.maps.Map(document.getElementById("dvMap"));

  // new up complex objects before passing them around
  var directionsDisplay = new window.google.maps.DirectionsRenderer({
    suppressMarkers: true
  });
  var directionsService = new window.google.maps.DirectionsService();

  Tour_startUp(route);

  window.tour.loadMap(map, directionsDisplay);
  window.tour.fitBounds(map);

  if (route.length > 1)
    window.tour.calcRoute(directionsService, directionsDisplay);
});

function Tour_startUp(stops) {
  if (!window.tour) window.tour = {
    updateStops: function(newStops) {
      stops = newStops;
    },
    // map: google map object
    // directionsDisplay: google directionsDisplay object (comes in empty)
    loadMap: function(map, directionsDisplay) {
      var myOptions = {
        zoom: 13,
        center: new window.google.maps.LatLng(1.31507,103.7069313), // default to singapore
        mapTypeId: window.google.maps.MapTypeId.ROADMAP
      };
      map.setOptions(myOptions);
      directionsDisplay.setMap(map);
    },
    fitBounds: function(map) {
      var bounds = new window.google.maps.LatLngBounds();

      // extend bounds for each record
      jQuery.each(stops, function(key, val) {
        var latlng = val;//val.split(",");
		//console.log(latlng.geometry.lat);
        var myLatlng = new window.google.maps.LatLng(latlng.geometry.lat, latlng.geometry.lng);
        bounds.extend(myLatlng);
      });
      map.fitBounds(bounds);
    },
    calcRoute: function(directionsService, directionsDisplay) {
      var batches = [];
      var itemsPerBatch = 10; // google API max = 10 - 1 start, 1 stop, and 8 waypoints
      var itemsCounter = 0;
      var wayptsExist = stops.length > 0;

      while (wayptsExist) {
        var subBatch = [];
        var subitemsCounter = 0;

        for (var j = itemsCounter; j < stops.length; j++) {
          subitemsCounter++;
          var latlng = stops[j];
          subBatch.push({
            location: new window.google.maps.LatLng(latlng.geometry.lat, latlng.geometry.lng),
            stopover: true
          });
          if (subitemsCounter == itemsPerBatch)
            break;
        }

        itemsCounter += subitemsCounter;
        batches.push(subBatch);
        wayptsExist = itemsCounter < stops.length;
        // If it runs again there are still points. Minus 1 before continuing to
        // start up with end of previous tour leg
        itemsCounter--;
      }

      // now we should have a 2 dimensional array with a list of a list of waypoints
      var combinedResults;
      var unsortedResults = [{}]; // to hold the counter and the results themselves as they come back, to later sort
      var directionsResultsReturned = 0;

      for (var k = 0; k < batches.length; k++) {
        var lastIndex = batches[k].length - 1;
        var start = batches[k][0].location;
        var end = batches[k][lastIndex].location;

        // trim first and last entry from array
        var waypts = [];
        waypts = batches[k];
        waypts.splice(0, 1);
        waypts.splice(waypts.length - 1, 1);

        var request = {
          origin: start,
          destination: end,
          waypoints: waypts,
          travelMode: window.google.maps.TravelMode.WALKING
        };
        (function(kk) {
          directionsService.route(request, function(result, status) {
            if (status == window.google.maps.DirectionsStatus.OK) {

              var unsortedResult = {
                order: kk,
                result: result
              };
              unsortedResults.push(unsortedResult);

              directionsResultsReturned++;

              if (directionsResultsReturned == batches.length) // we've received all the results. put to map
              {
                // sort the returned values into their correct order
                unsortedResults.sort(function(a, b) {
                  return parseFloat(a.order) - parseFloat(b.order);
                });
                var count = 0;
                for (var key in unsortedResults) {
                  if (unsortedResults[key].result != null) {
                    if (unsortedResults.hasOwnProperty(key)) {
                      if (count == 0) // first results. new up the combinedResults object
                        combinedResults = unsortedResults[key].result;
                      else {
                        // only building up legs, overview_path, and bounds in my consolidated object. This is not a complete
                        // directionResults object, but enough to draw a path on the map, which is all I need
                        combinedResults.routes[0].legs = combinedResults.routes[0].legs.concat(unsortedResults[key].result.routes[0].legs);
                        combinedResults.routes[0].overview_path = combinedResults.routes[0].overview_path.concat(unsortedResults[key].result.routes[0].overview_path);

                        combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getNorthEast());
                        combinedResults.routes[0].bounds = combinedResults.routes[0].bounds.extend(unsortedResults[key].result.routes[0].bounds.getSouthWest());
                      }
                      count++;
                    }
                  }
                }
                directionsDisplay.setDirections(combinedResults);
                var legs = combinedResults.routes[0].legs;
				var totaldis = 0;
				var legend = document.getElementById("legend");
            legend.innerHTML = "<tr class='rowheader'><td><b>Stop</b></td><td><b>Arrival Time</b></td><td><b>Finish Time</b></td><td><b>Postal Code</b></td><td><b>Address</b></td><td><b>Next Address Distance</b></td></tr>";
			
                // alert(legs.length);
                for (var i = 0; i < legs.length; i++) {
                 
				  createMarker(directionsDisplay.getMap(), legs[i].start_location, i, "Arrival Time " + stops[i].properties.arrival_time + "<br>" + legs[i].start_address, i);
				   
				 
				   legend.innerHTML += "<tr><td>"+i+"</td><td><b>"+stops[i].properties.arrival_time+"</b></td><td><b>"+stops[i].properties.finish_time+"</b></td><td><b>"+stops[i].properties.location_name+"</b></td><td><b>"+legs[i].start_address+"</b></td><td><b>"+legs[i].distance.text+"</b></td></tr>";
				    //dis = legs[i].distance.text.split(" ");
				    //totaldis +=parseInt(dis[0]);  
					
                }
              }
            }
          });
        })(k);
      }
    }
  };
}
var infowindow = new google.maps.InfoWindow({
  size: new google.maps.Size(150, 50)
});




function createMarker(map, latlng, label, html) {
  // alert("createMarker("+latlng+","+label+","+html+","+color+")");
  //console.log(label);
  var contentString = '<b>' + label + '</b><br>' + html;
  var marker = new google.maps.Marker({
    position: latlng,
    map: map,
    icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld='+label+'|FF0000|000000',
  });
  
  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
  });
  return marker;
}


function Call2function() {

   

    var mapOptions = {
      center: new google.maps.LatLng(1.31507,103.7069313),
      zoom: 12,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("dvMap"), mapOptions);
    var infoWindow = new google.maps.InfoWindow();
    var lat_lng = new Array();
    var latlngbounds = new google.maps.LatLngBounds();
    document.getElementById('info').innerHTML = "total points: " + route.length + "<br>";
    for (i = 0; i < route.length; i++) {
      var data = route[i];
     
      var myLatlng = new google.maps.LatLng(laaty[0], laaty[1]);
      lat_lng.push(myLatlng);
      var marker = new google.maps.Marker({
        position: myLatlng,
        map: map,
        title: 'location'
      });
      latlngbounds.extend(marker.position);
    }
    map.setCenter(latlngbounds.getCenter());
    map.fitBounds(latlngbounds);

    //***********ROUTING****************//

    //Intialize the Path Array
    var path = new google.maps.MVCArray();

    //Intialize the Direction Service
    var service = new google.maps.DirectionsService();

    //Set the Path Stroke Color
    var poly = new google.maps.Polyline({
      map: map,
      strokeColor: '#4986E7'
    });

    //Loop and Draw Path Route between the Points on MAP
    for (var i = 0; i < lat_lng.length; i++) {
      if ((i + 1) < lat_lng.length) {
        var src = lat_lng[i];
        var des = lat_lng[i + 1];
        // path.push(src);
        poly.setPath(path);
        service.route({
          origin: src,
          destination: des,
          travelMode: google.maps.DirectionsTravelMode.DRIVING
        }, function(result, status) {
          if (status == google.maps.DirectionsStatus.OK) {
            for (var i = 0, len = result.routes[0].overview_path.length; i < len; i++) {
              path.push(result.routes[0].overview_path[i]);
            }
          } else {
            document.getElementById('info').innerHTML += status + "<br>";
          }
        });
      }
    }
  }
   //google.maps.event.addDomListener(window, 'load', Call2function);
