<?php
header('Content-disposition: attachment; filename=LineOfSight.kml');
header('Content-type: application/vnd.google-earth.kml+xml');

readfile('LineOfSight.kml');
?>