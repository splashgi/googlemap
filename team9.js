var Routific = require("routific");
 
// Load the demo data. https://routific.com/demo.json
var data = require('./part1.json');
var demoToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NDFiNzU2MWZkMmJlMzA4MDAyY2VlYmIiLCJpYXQiOjE0MTEwODU2NjV9.5jb_61ykdHA2RyhfVWFMowb2oSB9gWAY4mPKHk1iCiI";
 
var client = new Routific.Client({token: demoToken});
var vrp = new Routific.Vrp();
 
// Insert all visits from the demo.json
for (var visitID in data.visits) {
  vrp.addVisit(visitID, data.visits[visitID]);
}
 
// Insert all vehicles from the demo.json
for (var vehicleID in data.fleet) {
  vrp.addVehicle(vehicleID, data.fleet[vehicleID]);
}
 
// Process the route
client.route(vrp, function(error, solution) {
  if (error) throw eror
  console.log(JSON.stringify(solution, null, 2));
});