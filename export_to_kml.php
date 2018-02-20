<?php

$fileName = 'LineOfSight.kml';

if($_POST){CreateNewXML();}

function CreateNewXML(){
$xml = new DOMDocument('1.0', 'UTF-8');

// kml declaration
$xml_kml = $xml->createElement("kml");
$xml_kml->setAttribute("xmlns","http://www.opengis.net/kml/2.2");


//body
$folder = $xml->createElement("Document");
$folder_name = $xml->createElement("name");
$folder_name->appendChild($xml->createTextNode('Line Of Sight'));
$folder_description = $xml->createElement("description");
$folder_description->appendChild($xml->createTextNode('gilvitzi.host-ed.me/Websites/UAV_LOS/index.php'));

$folder->appendChild($folder_name);
$folder->appendChild($folder_description);


$first_point = '';
//iterate all POST parameters
foreach($_POST as $name => $value) {
    

    $prefix = explode("_", $name);
    $prefix = $prefix[0];
    //echo 'prefix: '.$prefix.'<br/><br/>';
    if ($prefix=="alt"){
        if ($first_point !=''){
        $str = $xml->createTextNode($first_point);
        //echo '//print CLOSING POINT: '.$first_point;
        $coords->appendChild($str);
        }
        $first_point = '';

        $alt = $value;
        $placemark = $xml->createElement("Placemark");
        $placemark_name = $xml->createElement("name");
        $placemark_name->appendChild($xml->createTextNode($alt.' ft.'));
        $placemark->appendChild($placemark_name);
        $folder->appendChild($placemark);

       $polygon = $xml->createElement("Polygon");
       $placemark->appendChild($polygon);
       /*
       //"Look At" Object:
       $look_at = $xml->createElement("LookAt");

       $lk_at_lon = $xml->createElement("longitude");
       $lk_at_lat = $xml->createElement("latitude");
       $lk_at_alt = $xml->createElement("altitude");

       $lk_at_hdg = $xml->createElement("heading");
       $str = $xml->createTextNode('0');
       $lk_at_hdg->appendChild($str);

       $lk_at_tilt = $xml->createElement("tilt");
       $str = $xml->createTextNode('0');
       $lk_at_tilt->appendChild($str);

       $lk_at_range = $xml->createElement("range");

       $lk_at_alt_mode = $xml->createElement("gx:altitudeMode");
       $str = $xml->createTextNode('relativeToSeaFloor');
       $lk_at_alt_mode->appendChild($str);

       $look_at->appendChild($lk_at_lon);
       $look_at->appendChild($lk_at_lat);
       $look_at->appendChild($lk_at_alt);
       $look_at->appendChild($lk_at_hdg);
       $look_at->appendChild($lk_at_tilt);
       $look_at->appendChild($lk_at_range);
       $look_at->appendChild($lk_at_alt_mode);

       $placemark->appendChild($look_at);
       */


      
       //polygon new styleUrl
       $styleUrl = $xml->createElement('styleUrl');
       $str = $xml->createTextNode('#alt'.$alt);
       $styleUrl->appendChild($str);
       $placemark->appendChild($styleUrl);
       
       $outBound = $xml->createElement('outerBoundaryIs');
       $LinearRing = $xml->createElement('LinearRing');
       $coords = $xml->createElement('coordinates');

       $LinearRing->appendChild($coords);
       $outBound->appendChild($LinearRing);
       $polygon->appendChild($outBound);
       
       
         
    }elseif($prefix=="color"){
        /*
        //Create StyleMap Object
        $StyleMap = $xml->createElement('StyleMap');
        $StyleMap->setAttribute('id','p'.$alt);
        $folder->appendChild($StyleMap);//append to folder

        //Normal
        $Pair = $xml->createElement('Pair');
        $StyleMap->appendChild($Pair);

        $key = $xml->createElement('key');
        $str = $xml->createTextNode('normal');
        $key->appendChild($str);
        $Pair->appendChild($key);

        $styleUrl = $xml->createElement('styleUrl');
        $str = $xml->createTextNode('#'.$alt);
        $styleUrl->appendChild($str);
        $Pair->appendChild($styleUrl);

        //Highlight
        $Pair = $xml->createElement('Pair');
        $StyleMap->appendChild($Pair);

        $key = $xml->createElement('key');
        $str = $xml->createTextNode('highlight');
        $key->appendChild($str);
        $Pair->appendChild($key);

        $styleUrl = $xml->createElement('styleUrl');
        $str = $xml->createTextNode('#'.$alt);
        $styleUrl->appendChild($str);
        $Pair->appendChild($styleUrl);

        */

        //Style for Line and Poly
        $color_str = explode("#", $value);
        $color_str = $color_str[1];
        //echo '<br/>$color_str: '.$color_str;

        $Style = $xml->createElement('Style');
        $Style->setAttribute('id','alt'.$alt);
        $folder->appendChild($Style); //append to folder

        //LineStyle
        $LineStyle = $xml->createElement('LineStyle');
        $Style->appendChild($LineStyle);

        $color = $xml->createElement('color');
        $str = $xml->createTextNode('ff'.$color_str);
        $color->appendChild($str);
        $LineStyle->appendChild($color);

        $width = $xml->createElement('width');
        $str = $xml->createTextNode('2');
        $width->appendChild($str);
        $LineStyle->appendChild($width);

        //PolyStyle
        $PolyStyle = $xml->createElement('PolyStyle');
        $Style->appendChild($PolyStyle);

        $color = $xml->createElement('color');
        $str = $xml->createTextNode('00'.$color_str);
        $color->appendChild($str);
        $PolyStyle->appendChild($color);


         /*
       
         <StyleMap id="msn_ylw-pushpin">
		<Pair>
			<key>normal</key>
			<styleUrl>#sn_ylw-pushpin</styleUrl>
		</Pair>
		<Pair>
			<key>highlight</key>
			<styleUrl>#sh_ylw-pushpin</styleUrl>
		</Pair>
	</StyleMap>
	<Style id="sn_ylw-pushpin">
		<LineStyle>
			<color>ff0000ff</color>
			<width>2</width>
		</LineStyle>
		<PolyStyle>
			<color>7f0000ff</color>
		</PolyStyle>
	</Style>
	<Style id="sh_ylw-pushpin">
		<IconStyle>
			<scale>1.2</scale>
		</IconStyle>
		<LineStyle>
			<color>ff0000ff</color>
			<width>2</width>
		</LineStyle>
		<PolyStyle>
			<color>7f0000ff</color>
		</PolyStyle>
	</Style>
    */
    /*
        $style = $xml->createElement('Style');

        $lineStyle = $xml->createElement('LineStyle');

        $PolyStyle = $xml->createElement('PolyStyle');

        $color = $xml->createElement('color');
        $str = $xml->createTextNode($value);
        $color->appendChild($str);
               

        $fill = $xml->createElement('fill');
        $str = $xml->createTextNode('0');
        $fill->appendChild($str);

        $outline = $xml->createElement('outline');
        $str = $xml->createTextNode('0');
        $outline->appendChild($str);


        $PolyStyle->appendChild($color);
        $PolyStyle->appendChild($fill);
        $PolyStyle->appendChild($outline);
        $style->appendChild($PolyStyle);
        $polygon->appendChild($style);*/
       //<Style>
       // <LineStyle>
       //  </LineStyle>
      //  <PolyStyle>
      //    <color>7d0000ff</color>
      //    <fill>1</fill>
     //     <outline>1</outline>
     //   </PolyStyle>
    //  </Style>
    }elseif($prefix=="coords"){
        //echo "<br/>COORDS FOUND!<br/>";
        $str = $xml->createTextNode($value.','.$alt.' ');
        $coords->appendChild($str);
        if ($first_point==''){$first_point = $value.','.$alt.' ';}
    }elseif($prefix=="station"){
        
        //echo "station position: ".$value;
        
        $placemark = $xml->createElement('Placemark');
        $nm = $xml->createElement('name');
        $str_nm = $xml->createTextNode("Antenna");
        $nm->appendChild($str_nm);
        $point = $xml->createElement('Point');
        $coordinates = $xml->createElement('coordinates');
        $str_coord = $xml->createTextNode($value);
        
        
        $coordinates->appendChild($str_coord);
        $point->appendChild($coordinates);
        $placemark->appendChild($nm);
        $placemark->appendChild($point);
        $folder->appendChild($placemark);
        
    }elseif($prefix=="max"){
        //echo 'Max range: '. $value;
    }
    //print "<br>$name : $value<br><br/><br/>";
    
}


$xml_kml->appendChild($folder);
$xml->appendChild($xml_kml);
$xml->formatOutput = true;
$xml->save("LineOfSight.xml");
$xml->save("LineOfSight.kml");

$fileName = 'LineOfSight.kml';
echo '<link rel=StyleSheet href="style.css" type="text/css" media=screen>';
echo '<br/><br/><br/><center><div id="file_dwnld_div"><h3>Your File Is Ready For Download:</h3><br/> <h2><a href="download.php"> '.$fileName.'</a></h2></center></div>';


}



?>
