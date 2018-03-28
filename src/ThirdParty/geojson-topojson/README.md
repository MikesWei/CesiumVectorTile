# geojson-topojson

**Note**: FYI, there's a far nicer geojson -> topojson converter at [distillery](http://shancarter.github.io/distillery/) (although it doesn't do topojson -> geojson).

A simple (perhaps dumb) web interface to quickly convert between GeoJSON and TopoJSON. Basically, a web interface for Mike Bostock's [topojson](https://github.com/mbostock/topojson) library.

## Use

Available online at [jeffpaine.github.io/geojson-topojson/](http://jeffpaine.github.io/geojson-topojson/).

## Why

So folks can just use a simple web interface to quickly convert some data without having to install anything. Perhaps as a first step to trying out TopoJSON.

Users looking to convert lots of data programmatically should use the [topojson](https://github.com/mbostock/topojson) library locally ([directions](http://gis.stackexchange.com/questions/45138/convert-geojson-to-topojson)).

## Limitations

 * Don't convert back and forth between formats multiple times as -> TopoJSON will lose precision via quantization and -> GeoJSON drops topology
