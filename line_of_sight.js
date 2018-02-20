
var pieChart;
var Radial; //the visible line of the radial inspection - the heading for which areaChart shows data
var plot_hdg_timeout; //holeds the time out command if failed
var min_terrain_elevation = 0; //all elevation below this value would turn to 0.
var no_of_samples_Graph = 100; //number of samples for the investigation Graph

var starttime = new Date(); //survey start time

var hdg_interval = 10; //10 //heading interval between each calculation (90 => 4 headings to calculate)
var no_of_samples = 500; //sample resolution - no of sample for each heading

var total_dist = 300000; //meters
var dist_interval = 10000; //The distance Interval for each request (in Meters)
var timeout_normal = 100; //the normal time (in miliseconds) between 2 requests
var timeout_value = 1000; //the time (in miliseconds) for long_timeout
var timeout_interval = 100; //the spacing time (in miliseconds) between 2 long_timeouts

var total_index_marker = 0; //Counter - Counts The total number of elevation values

var earthR = 6378137; // Earth Radius (kilometers)  (Updated 26/2/2015 Gil - from 6371 to 6378137)
var METER_2_FEET = 3.2808399; //

var alt_min = 1000; //Minimum altitude for LOS calculations
var alt_max = 10000; //Maximum altitude for LOS calculations
var alt_step = 1000; //LOS calculations Altitude Steps

//altitude colors Array
var altColors = ["#E01B6A", "#C95AE8", "#A15AE8", "#5746F2", "#4697F2","#46CAF2","#46F2C7","#46F297","#46F25A","#C7F246","#F2F246","#F2C746","#FF8A14","#FF3700","#FF0000"];

var station_height; //Holds the Station elevation parameter (until formed into a Point Object
var elevation_matrix = []; //holdes all the elevation request from google
var no_los_points = []; //holdes the computed End of Line of sight Points (for each Altitude & HDG)

var los_polygons = {};  // holdes the polygone objects within the map
var station_marker; //holdes the marker for the station / Antenna position on the map

/* Point Class */
function Point(LatLng,elevation){
   this.lat = LatLng.lat();
   this.lng = LatLng.lng();
   this.elevation = elevation;
   this.slope = 0;
   this.distance = 0;
}

Point.prototype.LatLng = function() {
	return (new google.maps.LatLng(this.lat, this.lng));
}
Point.prototype.toStringRaw = function(){
	return 'Lat: '+this.lat+'\nLng: '+this.lng+'\nElev: '+this.elevation+'\nSlope: '+this.slope;
}
Point.prototype.toString = function() {
	var lat = Math.round(this.lat * 1000) / 1000;
	var lng = Math.round(this.lng * 1000) / 1000;
	var elev = Math.round(this.elevation);
	var slope = Math.round(this.slope * 1000) / 1000;
	var dist = Math.round(this.distance / 1000)
	return 'Lat: ' + lat + '<br/>Lng: ' + lng + '<br/>Elev: ' + elev + '<br/>Slope: ' + slope + '<br/>dist: ' + dist;
}
Point.prototype.toDMS = function() {
	return deg_to_dms(this.lat, "lat") + "  " + deg_to_dms(this.lng, "lng");
}
function deg_to_dms (deg,lat_or_lng) {
   var d = Math.floor (deg);
   var minfloat = (deg-d)*60;
   var m = Math.floor(minfloat);
   var secfloat = (minfloat-m)*60;
   var s = Math.round(secfloat);
   // After rounding, the seconds might become 60. These two
   // if-tests are not necessary if no rounding is done.
   if (s==60) {
	 m++;
	 s=0;
   }
   if (m==60) {
	 d++;
	 m=0;
   }

   var prefix
   if (lat_or_lng=="lat"){
	   prefix = (d < 0 )?"S":"N";
   }else if (lat_or_lng=="lng"){
	   prefix = (d < 0 )?"E":"W";
   }
   d = Math.abs(d);

   return (prefix + " " + d + "\u00B0" + m + "'" + s);
}



//print string as Time (HH:MM:SS)
String.prototype.toHHMMSS = function () {
	sec_numb    = parseInt(this);
	var hours   = Math.floor(sec_numb / 3600);
	var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
	var seconds = sec_numb - (hours * 3600) - (minutes * 60);

	if (hours   < 10) {hours   = "0"+hours;}
	if (minutes < 10) {minutes = "0"+minutes;}
	if (seconds < 10) {seconds = "0"+seconds;}
	var time    = hours+':'+minutes+':'+seconds;
	return time;
}
//calculate destination point - given HDG and Distance
function destinationPoint(startPoint,brngDeg,distance){
	var newPt = google.maps.geometry.spherical.computeOffset(startPoint.LatLng(), distance, brngDeg);
	return (newPt);
}



/* Calculates the Slope (Degrees) between two Points
*Pt1, Pt2 -> as Point(Lat,Lng,Elevation)
*
*/
function slopeBetweenTwoPoints(pt1,pt2){
	
	var dist = distance(pt1.LatLng(), pt2.LatLng()); //1000*distance(kilometers) = meters
	pt2.distance = dist;
	//console.log('dist:' + dist + '\n\npt1:\n' +pt1.LatLng()+'\n\npt2:\n'+pt2.LatLng());
	var elev = pt2.elevation - pt1.elevation;
	var slope_rad = Math.atan2(elev, dist);
	var slope_deg = slope_rad*180/Math.PI;

	return slope_deg;
}

/* Calculates the Slope (Degrees) between two Points
* with reference to Earth Curvature
*Pt1, Pt2 -> as Point(Lat,Lng,Elevation)
*
*/
function slopeUsingEarthCurvature(pt1,pt2){
	/*
	* B => pt1 <-> earth center
	* A => pt2 <-> earth center
	* D => pt1 <-> pt2
	*
	*
	* delta => the angle opposite to D 
	* alpha => the angle opposite to A
	* beta  => the angle opposite to B (not used here)
	*
	* all lengths in meters
	* all angles in degrees
	*/
	var ArcDist = distance(pt1.LatLng(), pt2.LatLng()); //Arc Distance between 2 Points (meters)
	var delta = ArcDist / (earthR*1000); //calc the angle of earth between the points - in radians
	var B = earthR + pt1.elevation; //the Triangle Side between Earth center and the 1st Pt.
	var A = earthR + pt2.elevation;//the Triangle Side between Earth center and the 2nd Pt.

	//calculate Linear Distance between the 2 points:
	var D = Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2) - (2 * A * B * Math.cos(delta)));
	//ERROR: distance calculates wrong (check radians/degrees and formula)
	// formula found at: http://www.mathsisfun.com/algebra/trig-cosine-law.html
	// and http://www.mathsisfun.com/algebra/trig-solving-triangles.html

	//calculate the angle between point1
	var alpha = Math.asin(D / (Math.sin(delta) * A));
	
	//convert to degrees
	var slope_deg = alpha*180/Math.PI;

	return slope_deg;
}

/* compute the distance between 2 points
*input - 2 LatLng Objects
*Output - meters
*/
function distance(pt1, pt2){
	return google.maps.geometry.spherical.computeDistanceBetween(pt1, pt2);
}

function meter2feet(m){
	return m * METER_2_FEET;
}

function feet2meter(m){
	return m / METER_2_FEET;
}

function PlaceStation(event){
	//check if currently calculating:
	if (progress.total_progress==0){
		if(station_marker) {
			//if the already is a station marker dispose it
			station_marker.setMap(null);
		}
		station_loc = event.latLng;
		station_height = getStationElevation(event.latLng);
	}
}

function createStationMarker(location, elevation){
	//call back function will call this when the height is ready
	station = new Point(location,elevation);
	//Create Station Icon And center Map
	var image = 'antenna.png';
	station_marker = new google.maps.Marker({
		position: station.LatLng(),
		map: map,
		icon: image,
		title:'Station: \n\n' + 'Lat: ' + Math.round(station.LatLng().lat()) + '\nLon: ' + Math.round(station.LatLng().lng()) +'\nElevation: '+Math.round(meter2feet(station.elevation)) + ' ft.'
		});

	map.setCenter(station.LatLng());

	//Update Control Panel
	var cPanel = document.getElementById('control_panel');
	cPanel.innerHTML = "Antenna: " + station.toDMS() + "<br/>Elevation: " + Math.round(meter2feet(station.elevation)) + " ft.";
	//Display Control form (options and clac button)
	var cForm = document.getElementById('control_form');
	cForm.style.display = 'inline-block';

}
// calculates LOS Coverage
		// station_loc = station location (google LatLng Obj)
		function calculate_los() {
			var cForm = document.getElementById('control_form');
			cForm.style.display = 'none';
			progress.reset();
			//if no station height - callback for it!

				//get elevation matrix
				var hdg = 0;

				elevation_matrix = []; //an Array that holdes all of the points and elevations
				elevator = new google.maps.ElevationService();
				//for each heading
				for(hdg; hdg < 360; hdg += hdg_interval) {
					//get Elevations (CallBack)
					//getElevationsAlongHeading(station, hdg);

					//CHANGING CALLBACK FUNCTION TO RECURSIVE
					elevation_matrix[hdg] = [];
					GetElevsStep(hdg, station); // new recursive call-back function
				}
			
		}


		//retrive one elevation for one location
		function getStationElevation(location) {
  
			locations = [];
			locations.push(location);//  push the location into the array
			
			var positionalRequest = {
			'locations': locations
			}// Create a LocationElevationRequest object using the array's one value

			// Initiate the location request
			elevator.getElevationForLocations(positionalRequest, function(results, status) {
				if(status == google.maps.ElevationStatus.OK) {

					// Retrieve the first result
					if(results[0]) {
						createStationMarker(location, results[0].elevation);
					} else { console.log('No results found'); }
				} else { console.log('Elevation service failed due to: ' + status); }
			});
		 }

		
	function print_elev_matrix(){
		//console.log(elevation_matrix);
		var html_str = "";
		html_str += "<table border=1>";
		html_str += "<tr><th>HDG</ht></tr>";
		var pt = new Point(new google.maps.LatLng(0, 0), 0);
		for (var hdg in elevation_matrix){
			html_str += '<tr><th>' + hdg + '</th>';
			for(var j = 0; j < elevation_matrix[hdg].length;j++) {
				//console.log("\nHDG:" + hdg + "\npt: " + elevation_matrix[hdg][j]);
				var add_style = (j==0)?' style="color:blue;"':'';
				html_str += '<td'+add_style+'>' + elevation_matrix[hdg][j] + '</td>';
			}
			html_str += '</tr>';
		}
		html_str += "</table>";
		document.getElementById('elev_matrix_tbl').innerHTML = html_str;
	}


	/*
	* Computes the Points of no Line Of Sight 
	* for Each Hdg and For Each Altitude
	*/
	function computeNoLOSPoints(){
		no_los_points = [];
			for (hdg in elevation_matrix){
				no_los_points[hdg] = [];
				var alt = alt_min;
				var max_slope = 0;
				for (alt;alt<=alt_max;alt+=alt_step){
					no_los_points[hdg][alt] = 0;
					var j = 0;
					var found = false;
					while ((j < elevation_matrix[hdg].length)&&(!found)){
						pt = elevation_matrix[hdg][j];
						var t_slope = pt.slope; //terrain slope (degrees)
						if(t_slope > max_slope) { max_slope = t_slope; }
						a_pt_alt_m = alt / 3.23;  //airborne point = terrain point with the altitude. 
						var a_pt = new Point(pt.LatLng(), a_pt_alt_m);
						var a_slope = slopeBetweenTwoPoints(station, a_pt); //calculate slope from plane to station (degrees)
						if(a_slope <= max_slope) {
							//console.log('aircraft low');
							new_pt = new Point(pt.LatLng(), pt.elevation);
							no_los_points[hdg][alt] = new_pt;
							found = true;
						}
						j++;
					}
				if (!no_los_points[hdg][alt]) {
					no_los_points[hdg][alt] = new Point(pt.LatLng(), alt);
				}
			}
			var x = hdg;
			var y = alt;
		}
		//print_no_los_points();
		Draw_No_Los_Points();
		var cPanel = document.getElementById('control_panel');
		cPanel.innerHTML += "<div id='button_investigate' class='cpanel_button' onclick='plotElevation(0);'>Investigae Specific Headings</div>";
	}

	function print_no_los_points(){
		console.log('start_printing');
		var html_str = '';
		html_str += "<table border=1>";
		html_str += "<tr><th>HDG</ht>";
		var tmp = 0;

		for (var alt=alt_min;alt <= alt_max;alt += alt_step){
			//create Altitude Headers
			html_str += '<th>' + alt + '</th>';
		}

		html_str += "</tr>";

		for (var hdg=0;hdg<360;hdg +=hdg_interval){
			html_str += "<tr><td>"+hdg+"</td>";
			for(alt=alt_min;alt <= alt_max;alt += alt_step)
				//console.log("alt: " + alt + "\n\n" + "hdg: " + hdg + "\n\n" + "hdg[alt]: ");
				html_str += '<td>' + no_los_points[hdg][alt] + '</td>';
		}

		//console.log('ok3\n\n\n' + html_str);
		html_str += "</tr>";
		html_str += "</table>";
		//console.log(html_str);
		document.getElementById('no_los_table').innerHTML = html_str;
	}

	function DrawElevationPoints(){
		var image = 'dark-red-circle_tiny.png';
		var pt = new Point(new google.maps.LatLng(0, 0), 0);
		for (var hdg in elevation_matrix){
			for(var j = 1; j < elevation_matrix[hdg].length;j++) {
				var marker = new google.maps.Marker({
				  position: elevation_matrix[hdg][j].LatLng(),
				  map: map,
				  icon: image,
				  title:'Elevation: ' + Math.round(meter2feet(elevation_matrix[hdg][j].elevation)) + 'ft.'
				   });
			}
			
		}

		//Center The Map
		map.setCenter(station.LatLng());
	}

	function Draw_No_Los_Points(){
		var alt = 1000;
		var clr_ind = 0;
		for(alt = alt_min; alt <= alt_max; alt += alt_step) {
			var los_line_path = [];
			for(var hdg = 0; hdg < 360; hdg += hdg_interval) {
				los_line_path.push(no_los_points[hdg][alt].LatLng());
			}
			los_line_path.push(no_los_points[0][alt].LatLng());
			var los_line = new google.maps.Polygon({
				path: los_line_path,
				strokeColor: altColors[clr_ind%altColors.length],
				strokeOpacity: 1.0,
				strokeWeight: 2,
				fillColor: altColors[clr_ind%altColors.length],
				fillOpacity: 0.01
			});
			los_polygons[alt] = los_line;
			los_line.setMap(map);
			clr_ind ++;
		}
	 //center & zoom map
		map.setCenter(station.LatLng());
		var bounds = new google.maps.LatLngBounds(destinationPoint(station, 360, total_dist), destinationPoint(station, 180, total_dist));
		map.fitBounds(bounds);
		AddLegend();
	}
   
	// plots the elevation profile on a Visualization API ColumnChart.
	/* Draws the Chart! */
	function plotElevation(hdg) {
		var endPoint = destinationPoint(station, hdg, total_dist);

		var path = [station.LatLng(), endPoint];
		var pathRequest = {
			'path': path,
			'samples': no_of_samples_Graph
		};
		// Initiate the path request
		elevator.getElevationAlongPath(pathRequest, function(results, status) {

			if(status == google.maps.ElevationStatus.OK) {
				// Extract the elevation samples from the returned results
				// and store them in an array of LatLngs.
				var elevationPath = [];
				for(var i = 0; i < results.length; i++) {
					elevationPath.push(results[i]);
				}

				// Display a polyline of the elevation path.
				var pathOptions = {
					path: elevationPath,
					strokeColor: '#0000CC',
					strokeWeight: 2,
					opacity: 0.4,
					map: map
				}

				//polyline = new google.maps.Polyline(pathOptions);

				// Extract the data from which to populate the chart.
				var data = new google.visualization.DataTable();
				data.addColumn('number', 'Distance');
				data.addColumn('number', 'Terrain');
				data.addColumn({ type: 'string', role: 'tooltip' });
				var tooltip_str = '';
				for(i = 0; i < elevationPath.length; i++) {
					var tmp_elev = (elevationPath[i].elevation < min_terrain_elevation) ? min_terrain_elevation : elevationPath[i].elevation;
					tmp_elev = Math.round(meter2feet(tmp_elev)); // convert to Feet and round
					var point_dist = ((total_dist / no_of_samples_Graph) * i) / 1000;
					point_dist = Math.round(point_dist * 10) / 10; //round to 0.0
					tooltip_str = "Elevation: " + tmp_elev + " ft.\nDistance: " + point_dist + " km";
					data.addRow([point_dist, tmp_elev, tooltip_str]);
				}


				// Draw the chart using the data within its DIV.
				var ac = new google.visualization.AreaChart(document.getElementById('elevation_chart'));
				ac.draw(data, {
					title: 'Heading: ' + formatHDG(hdg) + '\u00B0 Terrain Elevation Chart',
					titleTextStyle: { color: 'black', fontName: 'Tahoma', fontSize: 14 },
					isStacked: true,
					width: 800,
					height: 200,
					pointSize: 0,
					backgroundColor: 'transparent',
					//tooltip: { isHtml: true },
					colors: ["#DE0000"],
					vAxis: { title: "Altitude (ft.)" },
					hAxis: {
						textPosition: "out",
						title: 'Distance (km)',
						viewWindowMode: 'maximized',
						gridlines: { color: '#1E4D6B', count: 10 }
					}
				});

				//Check for existing radial
				if(Radial) {
					Radial.setPath(path);
				} else {//if not found -> form a new one.
					Radial = new google.maps.Polyline({
						path: path,
						strokeColor: "#FF0000",
						strokeOpacity: 1.0,
						strokeWeight: 2
					});
				}

				drawVisualization();
				// Show Radial + Charts
				Radial.setMap(map);
				document.getElementById('div_compass').style.display = 'inline-block';
				document.getElementById('elevation_chart').style.display = 'inline-block';
			} else {
				//TRY AGAIN
				clearTimeout(plot_hdg_timeout);
				plot_hdg_timeout = setTimeout(function() { plotElevation(hdg); }, 1000);
			}
		});         //end of call-back function
		//Show Charts:

		

	}

		
	//google.setOnLoadCallback(drawVisualization);        
	//Plot Compass (PIE CHART)
	function drawVisualization() {
		 function formatHDGtoString(hdg) {
				var tmp = hdg;
				if(tmp == 0) { tmp = "360" }
				else if(tmp < 100) { tmp = "0" + tmp.toString() }
				return tmp.toString();
			}
			var hdg_step = 5;
			var hdg_arr = [];
			/*for(var i = 0; i <= 360; i += hdg_step) {
				hdg_arr.push([formatHDGtoString(i), hdg_step]);
			}*/

			// NEW DATA TABLE
			var dataTable = new google.visualization.DataTable();
				
				dataTable.addColumn('string', 'Label');
				dataTable.addColumn('number', 'Heading');
				dataTable.addColumn({type: 'string', role: 'tooltip'});

			var html_str;
			for(var i = 0; i < 360; i += hdg_step) {
				//html_str = '<div style="background-color:black;">';
				//html_str += formatHDGtoString(i) + '</div>';
				html_str = "";
				dataTable.addRows([[formatHDGtoString(i), hdg_step,html_str]]);
			}
			data = dataTable;
			//var data = google.visualization.arrayToDataTable(hdg_arr);
			var options = {
				title: 'Select Heading',
				titleTextStyle: { color: 'black', fontName: 'Tahoma', fontSize: 14 },
				chartArea: {'width': '100%', 'height': '90%','left':'0'},
				legend: 'none',
				height: 200,
				width: 300,
				backgroundColor: 'transparent',
				tooltip: {trigger:'none'},
				//tooltip: {isHtml: true},
				pieSliceText: 'none',
				pieSliceTextStyle: {color: "red", fontName: "arial", fontSize: "12"},
				is3D: false,
				colors: ['#DE0000','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F','#B34747','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F','#B34747','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F','#EB8F8F']
			};

			var chart = new google.visualization.PieChart(document.getElementById('div_pieChart'));
			google.visualization.events.addListener(chart, 'select', pie_hdg_selected);
			google.visualization.events.addListener(chart, 'onmouseover', pie_hdg_mouseover);
			google.visualization.events.addListener(chart, 'onmouseout', pie_hdg_mouseout);


			chart.draw(data, options);
			

			
			function pie_hdg_selected() {
				var selection = chart.getSelection();
				plotElevation(selection[0].row*hdg_step);
			}
		   
	}
	function pie_hdg_mouseover(e){
				//var selection = chart.getSelection();
				document.getElementById('hdg_display').innerHTML = formatHDG(e.row*5);
			}
	function pie_hdg_mouseout(e){
				//var selection = chart.getSelection();
				document.getElementById('hdg_display').innerHTML = '---';

			}
	function formatHDG(hdg){
		var tmp = hdg;
		if(tmp == 0) { tmp = 360; }
		else if(tmp < 100) {
			tmp = "0" + tmp;
		}
		return tmp;
	}

	function AddLegend(){
		var icons = [];// holdes the LOS coverage colors and their Altitudes
		var a = {};
		var clrInd = 0;
		for(alt in no_los_points[0]) {
			a = {};
			a.alt = alt;
			a.color = altColors[clrInd%altColors.length];
			clrInd++;
			icons.push(a);
		}
		var legend = document.getElementById('legend');
		legend.innerHTML = "";
		for (var key in icons) {
		  var type = icons[key];
		  var alt = type.alt + ' ft.  ';
		  var color = type.color;
		  var colorInd = document.createElement('div');
		  colorInd.style.backgroundColor = color;
		  colorInd.className = "legend_color_ind";
		  colorInd.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
		  colorInd.id = "legend_alt_" + type.alt;
		  colorInd.setAttribute("alt_color",color);
		  colorInd.setAttribute("onclick", "show_hide_los_polygons("+type.alt+","+colorInd.id+");");

		  var div = document.createElement('div');
		  div.style.backgroundColor = "white";
		  div.style.marginRight = "10px";
		  div.style.marginTop = "5px";
		  //div.width = "300px";
		  div.innerHTML = alt;
		  div.appendChild(colorInd);
		  legend.appendChild(div);
		}
	}


	function show_hide_los_polygons(alt, div){

		var poly = los_polygons[alt];

		if (poly.getMap()) {
			poly.setMap(null);
			div.style.backgroundColor = "";
		} else {
			poly.setMap(map);
			div.style.backgroundColor = div.getAttribute("alt_color");
		}
	}
		/// GET ELEVATION ALONG HEADING IN STEPS
		function GetElevesSteps(){
			//set Loading Indicator
			/*document.getElementById("overlaymessage").style.visibility='visible'; 
			document.getElementById("overlaymessage").style.display='block';*/
			//setLoading();
			//Start Recursive function
			GetElevsStep(0, station);

			//Remove Loading Indicator
			/*document.getElementById("overlaymessage").style.visibility='hidden'; 
			document.getElementById("overlaymessage").style.display='none';*/
		}

		function GetElevsStep(hdg,startPt){
			var accomulated_distance = distance(station.LatLng(), startPt.LatLng());
			dist_interval = getDistInterval(accomulated_distance);
			var endPoint = destinationPoint(startPt, hdg, dist_interval);
			var path = [startPt.LatLng(), endPoint];
			var pathRequest = {
				'path': path,
				'samples': no_of_samples
			};
			
			// Initiate the path request
			elevator.getElevationAlongPath(pathRequest, function(results, status) {
				if(status == google.maps.ElevationStatus.OK) {
					// Extract the elevation samples from the returned results
					// and store them in an array of LatLngs.
					for(var i = 1; i < results.length; i++) {
						//push results to elevation_matrix
						//sets waterbodies as 0 height
						var new_elev = (results[i].elevation < min_terrain_elevation) ? 0 : results[i].elevation;
						tmp_pt = new Point(results[i].location, new_elev); //create new Point
						tmp_pt.slope = slopeBetweenTwoPoints(station, tmp_pt); // calc Slope between Point and Station
						elevation_matrix[hdg].push(tmp_pt); //add to elevations object
					}

					//reference to Last Point
					var lastPt = elevation_matrix[hdg][elevation_matrix[hdg].length - 1].LatLng();
					//Count requests
					total_index_marker += i;
					write_log(': samples count: ' + total_index_marker + '<br/>');


					//drawLine(path); // Draw a Line on the map
					//update progress_bar
					var increment = (dist_interval / total_dist) * (hdg_interval / 360);
					progress.add(increment);
					//check if heading is finished
					var accomulated_distance = distance(station.LatLng(), lastPt);
					//accomulated_distance = Math.round(accomulated_distance / 10) * 10;
					if(accomulated_distance < total_dist) {
						setTimeout(function() {
							var pt = new Point(lastPt, 0);
							GetElevsStep(hdg, pt);
						}, timeout_normal);
						write_log(': Time-Out<br/>');
					} else {
						write_log(': HDG: ' + hdg + ' Finished<br/>');
						progress.finished_hdg();
						//var hdgPath = [];
						//hdgPath.push(station.LatLng());
						//hdgPath.push(elevationPath[elevationPath.length - 1]);
						//drawLine(path);

					}
				} else {
					//console.log('Elevation service failed due to: ' + status);
					if(timeout_value > 3000) { timeout_value = 1000; }
					setTimeout(function() {
						GetElevsStep(hdg, startPt);
					}, timeout_value + timeout_interval);
					timeout_value += timeout_interval;
					write_log(':Elevation service failed due to: ' + status + '<br/>');
					write_log(': Long Time-Out (' + timeout_value + ')<br/>');
				}
			});                 //end of call-back function
		}

		function drawLine(path){
			Radial = new google.maps.Polyline({
				path: path,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 2
			});
			Radial.setMap(map); 

		}

		function setLoading(){
			var div = document.createElement('div');
			div.id = "overlaymessage"; 
			div.style.display = "block";
			div.height = "100%";
			div.width = "100%";
			div.innerHTML = '<img alt="Loading..." src="ajax-loader.gif" height="100px" width="100px" style="display:block;margin-left:auto;margin-right:auto;margin-top: 25%;">';
			var canvas = document.getElementById('map-canvas');
			canvas.appendChild(div);
		}

		var log = [];
		function write_log(log_str){
			var d1=new Date();
			log.push(d1.toUTCString()+log_str);
			if (log.length>1000){
				clear_log();
			}
		}
		function clear_log(){
			log = [];
		}
		
		//Progress Bar Class
		var progress = new Progress();

		function Progress(){
			this.total_progress = 0;
			this.hdg_count = 0;
		}

		Progress.prototype.add = function(incremet) {
			this.total_progress += incremet;
			this.update();
		}

		Progress.prototype.finished_hdg = function() {
			this.hdg_count ++;
			if((this.hdg_count * hdg_interval) == 360) {
				this.terminate();
			}
		}

		Progress.prototype.reset = function() {
			this.total_progress = 0;
			this.hdg_count = 0;
		}

		Progress.prototype.getPrecent = function() {
			return this.total_progress*100;
		}

		Progress.prototype.update = function() {
			tmp = Math.round((this.total_progress * 100) + 1);
			if (tmp<99){
				document.getElementById('progress_bar').innerHTML = tmp + '%';
				document.getElementById('progress_message').style.display = 'inline';
			}else{
				document.getElementById('progress_bar').innerHTML = '99%';
			}
		}
		Progress.prototype.terminate = function() {
			document.getElementById('progress_message').style.display = 'none';
			computeNoLOSPoints();
			var endtime = new Date();
			var timediff = new Date(endtime - starttime);
			document.getElementById('Export_Button').style.display = 'block';
			write_log('elapsed Time:'+timediff);
		}

		function getDistInterval(current_dist){
			var interval = 0;
			if (current_dist < 10000){//0 - 10km:
				interval = 30 * no_of_samples;            //30m res
			}else if(current_dist < 20000){ // 10km - 20km:
				interval = 100 * no_of_samples;           //100m res
			}else if(current_dist < 50000){//20km - 50km:
				interval = 500 * no_of_samples;           //res 500m
			}else {                         //50km and above:
				interval = 1000 * no_of_samples;          //res 1km
			}

			if ((current_dist + interval) > total_dist - 10){
				interval = total_dist - current_dist + 10;
			}
			return interval;
		}


		//Mapped query Parameters
		//Using form GET Method
		//Works Only With "POST"
		function ExportToKML(){
			var alt = 1000;
			var clr_ind = 0;
			var exportForm = document.createElement('form');

			var alt_element;
			var hdg_element;
			var pt_element; //Point Element
			var lat;
			var lng;

			//Additional Info:
			var maxrange = document.createElement('input');
			maxrange.setAttribute('name', 'max_range');
			maxrange.setAttribute('value',total_dist);
			exportForm.appendChild(maxrange);

			var station_input = document.createElement('input');
			station_input.setAttribute('name', 'station_pos');
			station_input.setAttribute('value',station.LatLng().lng() +','+ station.LatLng().lat() + ',' + station.elevation);
			exportForm.appendChild(station_input);

			for(alt = alt_min; alt <= alt_max; alt += alt_step) {
				var alt_ind = (alt-alt_min)/alt_step;
				alt_element = document.createElement('input');
				alt_element.setAttribute('name', 'alt_'+alt_ind);
				alt_element.setAttribute('value', alt);
				exportForm.appendChild(alt_element);

				var clr_element = document.createElement('input');
				clr_element.setAttribute('name', 'color_' + clr_ind);
				clr_element.setAttribute('value', altColors[clr_ind%altColors.length]);
				exportForm.appendChild(clr_element);

				for(var hdg = 360-hdg_interval; hdg >= 0; hdg = hdg-hdg_interval) {

					var tmp_pt = no_los_points[hdg][alt].LatLng();
					/*
					//add latitude element
					lat = document.createElement('input');
					lat.setAttribute('name', 'lat_alt_' + alt_ind + '_hdg_' + hdg);
					lat.setAttribute('value',tmp_pt.lat());
					exportForm.appendChild(lat);
					//add longtitude element
					lng = document.createElement('input');
					lng.setAttribute('name', 'lng_alt_' + alt_ind + '_hdg_' + hdg);
					lng.setAttribute('value',tmp_pt.lng());
					exportForm.appendChild(lng);
					*/
					var tmp_coord_str = Math.round(tmp_pt.lng()*1000)/1000 + ',' + Math.round(tmp_pt.lat()*1000)/1000;
					coords = document.createElement('input');
					coords.setAttribute('name', 'coords_alt_' + alt_ind + '_hdg_' + hdg);
					coords.setAttribute('value',tmp_coord_str);
					exportForm.appendChild(coords);
				}
				clr_ind ++;
			}

			exportForm.method = "POST";
			exportForm.action = "export_to_kml.php";
			exportForm.target = "_blank";
			exportForm.submit();
			//Dispose Form
			//exportForm.parentNode.removeChild(exportForm);
		}