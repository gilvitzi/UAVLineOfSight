<?php
    
define('ABSPATH', dirname(__FILE__).'/');

$settings = simplexml_load_file('settings.xml');

/* echo '<h1>API KEY: '. $settings->develop->google_api->api_key;*/ 
?>