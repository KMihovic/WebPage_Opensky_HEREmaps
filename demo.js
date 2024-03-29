// Initialize communication with the platform
var platform = new H.service.Platform({
  apikey: 'whatewerIPutHereItWorks???'
});
var defaultLayers = platform.createDefaultLayers();

// Initialize a map - this map is centered over Europe
var map = new H.Map(document.getElementById('map'),
  defaultLayers.vector.normal.map,{
  zoom: 10,
  center: {lat:45.328081, lng:14.4},
});

var minZoom = 9;
var maxZoom = 14;
// Add an event listener to detect when the map view has changed
map.addEventListener('mapviewchange', function() {
  var zoomLevel = map.getZoom();

  // Check if the zoom level is greater than the maximum
  if (zoomLevel > maxZoom) {
      // Set the zoom level to the maximum
      map.setZoom(maxZoom);
  }
  // Check if the zoom level is less than the minimum
  if (zoomLevel < minZoom) {
      // Set the zoom level to the minimum
      map.setZoom(minZoom);
  }
});

// Make the map interactive
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Create a marker icon from an image URL:
var iconGround = new H.map.Icon("https://cdn0.iconfinder.com/data/icons/coronavirus-protection/64/airplane_coronavirus_covid19_travel_prohibit_ban0-512.png", { size: { w: 35, h: 35 }});
var iconAir = new H.map.Icon("https://cdn2.iconfinder.com/data/icons/business-development-6/24/Aircraft_transport_plane_transportation_airplane_travel-512.png", { size: { w: 35, h: 35 }});



// SAVING LAST POSITION & ZOOM TO LOCALSTORAGE---------------------------------
//Activated every time map position or zoom changes
map.addEventListener('mapviewchangeend', function() {
  //get center and zoom
  var position = map.getCenter();
  var zoom = map.getZoom();
  //store the position and zoom values in localStorage
  localStorage.setItem('mapPosition', JSON.stringify(position));
  localStorage.setItem('mapZoom', zoom);
  });
//retrieve the last saved position and zoom when the page loads
var savedPosition = JSON.parse(localStorage.getItem('mapPosition'));
var savedZoom = localStorage.getItem('mapZoom');

if (savedPosition && savedZoom) {
  map.setCenter(savedPosition);
  map.setZoom(savedZoom);
}



// ADDING DATA FROM OPENSKY PLATFORM ------------------------------------------
// Retrieve flight data for Croatia
function fetchFlightData() {
  // Get the current bounding box of the map
  const boundingBox = map.getViewModel().getLookAtData().bounds.getBoundingBox();
  // Get the boundaries of the bounding box
  const south = boundingBox.getBottom();
  const west = boundingBox.getLeft();
  const north = boundingBox.getTop();
  const east = boundingBox.getRight();

  fetch(`https://opensky-network.org/api/states/all?lamin=${south}&lomin=${west}&lamax=${north}&lomax=${east}`)
    .then(response => response.json())
    .then(data => {
      // Parse flight data
      const flights = data.states;
      
      for (i = 0; i < flights.length; i++) {
        const flight = flights[i];
        // Extract flight information
        const flightId = flight[0];
        const origin_country = flight[2];
        const longitude = flight[5];
        const latitude = flight[6];
        const baro_altitude = flight[7];
        const on_ground = flight[8];
        const velocity = flight[9];
        const true_track = flight[10];
        const geo_altitude = flight[13];

        function addMarkerToGroup(group, coordinate, html) {
          // Sets icon by flight[8] - on_ground true or false
          const icon = flight[8] ? iconGround : iconAir;
          const marker = new H.map.Marker({lat: flight[6], lng: flight[5]}, (coordinate, {icon: icon}));
          
          marker.setData(html);
          group.addObject(marker);
        }

        function addInfoBubble(map) {
          var group = new H.map.Group();
      
          map.addObject(group);
          // add 'tap' event listener, that opens info bubble, to the group
          group.addEventListener('tap', function (evt) {
            // event target is the marker itself, group is a parent event target
            // for all objects that it contains
            var bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
              // read custom data
              content: evt.target.getData()
            });
            // show info bubble
            ui.addBubble(bubble);
          }, false);
        
          addMarkerToGroup(group, {lat:latitude, lng:longitude},
            '<b>Flight ID:</b>' + flightId +
            '<br><b>Country:</b>' + origin_country +
            '<br><b>Barometric_Altitude</b>:' + baro_altitude + 'm' + 
            '<br><b>On_Ground:</b>' + on_ground +
            '<br><b>Velocity:</b>' + velocity + 'm/s' + 
            '<br><b>True_Track:</b>' + true_track + '°' + 
            '<br><b>Geo_Altitude:</b>' + geo_altitude + 'm');
        }
        addInfoBubble(map);
      }});
    }
// Fetch flight data for the first time
fetchFlightData();



// AUTOREFRESH EVERY 5 SECONDS-------------------------------------------------
setInterval(function() {
  // remove all existing flight markers from the map
  map.removeObjects(map.getObjects());
  // call the addFlightsToMap function again to add the updated flight data to the map
  fetchFlightData();
}, 5000);



// ADD REFRESH BUTTON----------------------------------------------------------
const refreshButton = document.getElementById('refreshButton');
refreshButton.addEventListener('click', () => {
 // remove all existing flight markers from the map
 map.removeObjects(map.getObjects());
 // call the addFlightsToMap function again to add the updated flight data to the map
 fetchFlightData();
});



// ADDING & REMOVING 20 RANDOM AIRPLANES --------------------------------------
// Function to generate random number
function randomLat() {
  return Math.random() * (2.5) + 44;
}
function randomLng() {
  return Math.random() * (9.5) + 9.5;
}

var plane = 0;
function adddMarker() {
  if (plane == 0) {
    // Create a group that can hold map objects
    group = new H.map.Group();

    for (i = 0; i < 20; i++) {
    // Add the group to the map object (created earlier):
    map.addObject(group);

    // Create a marker:
    marker = new H.map.Marker({lat:randomLat(), lng:randomLng()}, { icon: pngIcon });

    // Add the marker to the group (which causes 
    // it to be displayed on the map)
    group.addObject(marker);

    plane = 1;
}}
}
function removeMarker() {
  map.removeObject(group);
  if (plane == 1) {
    plane = 0;
}}



// RADAR FUNCTIONS ------------------------------------------------------------
function adddRadar() {
  group = new H.map.Group(); // Create a group that can hold map objects (KM)
  map.addObject(group); 
  circle = new H.map.Circle(
    // The central point of the circle
    {lat: 45.327980, lng: 14.476690},
    // The radius of the circle in meters
    130000,
    {
      style: {
        strokeColor: 'rgb(0,255,0)', // Color of the perimeter
        lineWidth: 2,
        fillColor: 'rgba(0, 0, 0, 0.8)'  // Color of the circle
      }});  
  group.addObject(circle);

  map.addObject(group); 
  circle = new H.map.Circle(
    // The central point of the circle
    {lat: 45.327980, lng: 14.476690},
    // The radius of the circle in meters
    90000,
    {
      style: {
        strokeColor: 'rgb(0,255,0)', // Color of the perimeter
        lineWidth: 2,
        fillColor: 'rgba(0, 0, 0, 0)'  // Color of the circle
      }});  
  group.addObject(circle);

  map.addObject(group); 
  circle = new H.map.Circle(
    // The central point of the circle
    {lat: 45.327980, lng: 14.476690},
    // The radius of the circle in meters
    50000,
    {
      style: {
        strokeColor: 'rgb(0,255,0)', // Color of the perimeter
        lineWidth: 2,
        fillColor: 'rgba(0, 0, 0, 0)'  // Color of the circle
      }});  
  group.addObject(circle);

  map.addObject(group); 
  dot = new H.map.Circle(
    // The central point of the circle
    {lat: 45.347980, lng: 14.475},
    // The radius of the circle in meters
    3000,
    {
      style: {
        strokeColor: 'rgb(0,255,0)', // Color of the perimeter
        lineWidth: 2,
        fillColor: 'rgb(0,255,0)'  // Color of the circle
      }});
  group.addObject(dot);
}

function removeRadar() {
  map.removeObject(group);
}

function rotateDomMarker() {
  //"div" because = Anchor parameters only works for "H.map.Icon". Use CSS styles to center an "H.map.DomIcon".
  var domIconElement = document.createElement('div'), 
  counter = 0;

  // set the anchor using margin css property depending on the content's (svg element below) size
  // to make sure that the icon's center represents the marker's geo positon
  domIconElement.style.margin = '0px 0 0 0px';

  // add content to the element
  domIconElement.innerHTML = `<svg height="430" width="430">
  <line x1="0" y1="0" x2="210" y2="210" style="stroke: rgb(0,255,0);stroke-width:5" />
  </svg>`;

  // create dom marker and add it to the map
  marker = map.addObject(new H.map.DomMarker({lat:46.165, lng:13.3}, {
    icon: new H.map.DomIcon(domIconElement, {
      onAttach: function(clonedElement, domIcon, domMarker) {
        var clonedContent = clonedElement.getElementsByTagName('svg')[0];

        // set last used value for rotation when dom icon is attached (back in map's viewport)
        //(KM) clonedContent.style.transform = 'rotate(' + counter + 'deg)';

        // set interval to rotate icon's content by XX degrees every X second.
        interval = setInterval(function() {
          clonedContent.style.transform = 'rotate(' + (counter += 10) + 'deg)';
        }, 50)
      },
    })
  }));
  setTimeout(removeRadar, 4800);
  setTimeout(removeRotLine, 5000);
  setTimeout(adddMarker, 5500);
}

function removeRotLine() {
  map.removeObject(marker);
}
