<?php
    include 'export_to_kml.php';
    include 'settings.php';
?>

<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <link rel=StyleSheet href="style.css" type="text/css" media=screen>
    <!--[if gte IE 9]>
      <style type="text/css">
        .gradient {
           filter: none;
        }
      </style>
    <![endif]-->
    <script type="text/javascript" src="https://maps.googleapis.com/maps/api/js?key=<?php echo $settings->develop->google_api->api_key; ?>&sensor=false"></script>
    
    <link href="google_map_default.css" rel="stylesheet">
    <script src="https://www.google.com/jsapi"></script>
    <script src="line_of_sight.js"></script>
    <script src="https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false"></script>
    <script type="text/javascript">
        //Mobile Compatibility
        if(/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            //add Mobile StyleSheet
            var fileref = document.createElement('link');
            fileref.setAttribute("rel", "StyleSheet");
            fileref.setAttribute("href", "style_mobile.css");
            fileref.setAttribute("type", "text/css");
            fileref.setAttribute("media", "screen");
            //append to doc
            document.getElementsByTagName("head")[0].appendChild(fileref);
            //rel=StyleSheet href="style.css" type="text/css" media=screen
        }
    </script>
    <script type="text/javascript">

    </script>
    <script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.2/jquery.min.js"></script>
    <!--  CHART SCRIPT  -->
    <title>UAV Line of Sight</title>
  </head>
  <body style="margin:0px; padding:0px;" onload="initialize();">
    <?php include_once("analyticstracking.php") ?>
    <script src="http://code.highcharts.com/highcharts.js"></script>
    <script src="http://code.highcharts.com/modules/exporting.js"></script>
    <div id="header" class="gradient">&nbsp
        <h2 id="site_title" style="text-align: center;">Line Of Sight</h2>
    </div>
        
    <div id="progress_message" class="gradient" style="display: none;">
        <div id="progress_bar" class="progress_bar">100%</div>
        <img id="loader_image" alt="Loading..." src="ajax-loader.gif" /> 
    </div>
      
    <div id="elev_matrix_tbl"></div>
    <div id="no_los_table"></div>
    
    <div id="charts_panel">
        <div id="elevation_chart" style="display:none;height:200px;"></div>
        <div id="div_compass" style="display:none;height: 200px;width: 200px;padding:0 0 0 0 ;">
            <div id="div_pieChart"></div>
            <div id="hdg_display" class="hdg_display"></div>
        </div>
    </div>
    <!--    MAP CANVAS  -->
    <div id="map-canvas">
    <!-- Displays Until Map Loads Up -->
        <div id="overlaymessage" class="messagechargement" style="display:block;height:100%;width:100%;">
            <img alt="Loading..." src="ajax-loader.gif" height="100px" width="100px" style="display:block;margin-left:auto;margin-right:auto;margin-top: 25%;">
        </div> 

    </div>

    <!-- Map Controls -->
    <div id="legend" style="display: none;"></div>
    <div id="control_panel"  style="display: none;" class="gradient">Click on the Map to Select the Antenna Location</div>
    <div id="control_form"  style="display: none;" class="gradient">
    <div id="googleAdsense_map_banner">
    <script type="text/javascript"><!--
        google_ad_client = "ca-pub-5309694254788217";
        /* Line_Of_Sight_map_banner */
        google_ad_slot = "8403940500";
        google_ad_width = 234;
        google_ad_height = 60;
        //-->
        </script>
        <script type="text/javascript"
        src="http://pagead2.googlesyndication.com/pagead/show_ads.js">
        </script>
    </div>
       <!--  -->
      <form name="controls" id="controls" style="float: right;">
        <label>Options</label>
    <br/><br/>
        <label for="txt_max_dist">Max. Range (km)</label>
        <input name="txt_max_dist" style="width: 50px;" type="text" value="300" onchange="javascript:total_dist = parseInt(this.value)*1000; "/>
    <br/></br>
        <label for="min_altitude">Altitudes:</label>
          <br/>
        <select name="min_altitude" id="min_altitude" onchange ="alt_min = parseInt(this.value);">
            <option value=0>0 ft.</option>
            <option value=1000 selected>1 kft.</option>
            <option value=2000>2 kft.</option>
            <option value=3000>3 kft.</option>
            <option value=4000>4 kft.</option>
            <option value=5000>5 kft.</option>
            <option value=6000>6 kft.</option>
            <option value=7000>7 kft.</option>
            <option value=8000>8 kft.</option>
            <option value=9000>9 kft.</option>
            <option value=10000>10 kft.</option>
            <option value=11000>11 kft.</option>
            <option value=12000>12 kft.</option>
            <option value=13000>13 kft.</option>
            <option value=14000>14 kft.</option>
            <option value=15000>15 kft.</option>
            <option value=16000>16 kft.</option>
            <option value=17000>17 kft.</option>
            <option value=18000>18 kft.</option>
            <option value=19000>19 kft.</option>
            <option value=20000>20 kft.</option>
            <option value=21000>21 kft.</option>
            <option value=22000>22 kft.</option>
            <option value=23000>23 kft.</option>
            <option value=24000>24 kft.</option>
            <option value=25000>25 kft.</option>
            <option value=26000>26 kft.</option>
            <option value=27000>27 kft.</option>
            <option value=28000>28 kft.</option>
            <option value=29000>29 kft.</option>
            <option value=30000>30 kft.</option>
        </select>
         
        <label for="max_altitude">-</label>
        <select name="max_altitude" id="max_altitude" onchange ="alt_max = parseInt(this.value);">
            <option value=0>0 ft.</option>
            <option value=1000>1 kft.</option>
            <option value=2000>2 kft.</option>
            <option value=3000>3 kft.</option>
            <option value=4000>4 kft.</option>
            <option value=5000>5 kft.</option>
            <option value=6000>6 kft.</option>
            <option value=7000>7 kft.</option>
            <option value=8000>8 kft.</option>
            <option value=9000>9 kft.</option>
            <option value=10000 selected>10 kft.</option>
            <option value=11000>11 kft.</option>
            <option value=12000>12 kft.</option>
            <option value=13000>13 kft.</option>
            <option value=14000>14 kft.</option>
            <option value=15000>15 kft.</option>
            <option value=16000>16 kft.</option>
            <option value=17000>17 kft.</option>
            <option value=18000>18 kft.</option>
            <option value=19000>19 kft.</option>
            <option value=20000>20 kft.</option>
            <option value=21000>21 kft.</option>
            <option value=22000>22 kft.</option>
            <option value=23000>23 kft.</option>
            <option value=24000>24 kft.</option>
            <option value=25000>25 kft.</option>
            <option value=26000>26 kft.</option>
            <option value=27000>27 kft.</option>
            <option value=28000>28 kft.</option>
            <option value=29000>29 kft.</option>
            <option value=30000>30 kft.</option>
        </select>
        <br/><br/>
        <label for="altitude_steps">Altitude Steps</label>
        <select name="altitude_steps" id="altitude_steps" onchange ="alt_step = parseInt(this.value);">
            <option value=100>100 ft.</option>
            <option value=500>500 ft.</option>
            <option value=1000 selected>1000 ft.</option>
            <option value=2000>2000 ft.</option>
        </select>
        <br/><br/>
        <label for="resolution" title="Sample Resolution">Res.</label>
        <select name="resolution" id="resolution" onchange ="hdg_interval = parseInt(this.value);" title="Sample Resolution (Estimated Time of Caculation)">
            <option value=10 selected>Low (~5 min.)</option>
            <option value=5>High (~15 min.)</option>
            <option value=1>Super (~45 min.)</option>
        </select>
            <br/><br/>
        <div id='calc_button' class='calc_button' onclick='calculate_los();'>Calculate LOS</div>
    </form>
    </div>

      <!-- DEVELOPER FORM -->
        <form name="form1" style="display: none; float:right; right: 0px;margin-top:350px;background-color:#e4e4e4;position: fixed;top: -300px;">
        <input type=button value="Print Data Table" onclick="javascript:print_elev_matrix();" />
            <br /><br /><br />
        <input type=button value="Export To Kml" onclick="javascript:ExportToKML();" />
            <br /><br />
        <input type=button value="Draw Elevation Samples" onclick="javascript:DrawElevationPoints();" />
            <br /><br />
        <input type=button value="Plot Graph" onclick="javascript:plotElevation(0);" />
            <br/></br>
        <label for="txt_no_of_samples">number Of Samples (Per Heading)</label>           
        <input name="txt_no_of_samples" type="text" value="100" onchange="javascript:no_of_samples = parseInt(this.value); "/>
            <br/>
        <label for="txt_heading_interval">Heading Interval</label>
        <input name="txt_heading_interval" type="text" value="10" onchange="javascript:hdg_interval = parseInt(this.value); "/>
          <br/>
        </form>
    <script>
       google.load("visualization", "1", { packages: ["corechart"] });
    </script>
        <div id="Export_Button" onclick = "javascript:ExportToKML();" style="position:absolute;top:10px;left:20px;display: none;z-index: 200;width: 150px;" class="calc_button">Export To Google Earth</div>
        <div id="log"></div>
  </body>
</html>













