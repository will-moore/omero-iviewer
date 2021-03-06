goog.provide('ome.ol3.geom.Line');

goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');

/**
 * @classdesc
 * An abstraction to add arrow info and if we are a polyline
 *
 * @constructor
 * @extends {ol.geom.LineString}
 *
 * @param {Array.<Array.<number>>} coordinates a coordinates array of x,y tuples
 * @param {boolean} draw_start_arrow flag if we need to draw an arrow at the head
 * @param {boolean} draw_end_arrow flag if we need to draw an arrow at the tail
 */
ome.ol3.geom.Line = function(
    coordinates, draw_start_arrow, draw_end_arrow) {
    if (!ome.ol3.utils.Misc.isArray(coordinates) || coordinates.length < 2)
        console.error("Line needs a minimum of 2 points!");

    /**
	 * flag whether we have a start arrow
	 *
	 * @type {Array}
	 * @private
	 */
	this.has_start_arrow_ =
        typeof draw_start_arrow === 'boolean' && draw_start_arrow;

    /**
	 * flag whether we have an end arrow
	 *
	 * @type {Array}
	 * @private
	 */
	this.has_end_arrow_ =
        typeof draw_end_arrow === 'boolean' && draw_end_arrow;

 	// call super
	goog.base(this, coordinates);
}
goog.inherits(ome.ol3.geom.Line, ol.geom.LineString);


/**
 * Make a complete copy of the geometry.
 * @return {boolean} true if we have more than 2 points, otherwise false
 * @api stable
 */
ome.ol3.geom.Line.prototype.isPolyline = function() {
    var coords = this.getCoordinates();
    if (coords.length > 2) return true;

    return false;
};

/**
 * Generated the arrow geometry (triangle) for a given direction, base width
 * and height
 *
 * @param {boolean} head true will create a head arrow, false a tail one
 * @param {number} width the base with of the arrow
 * @param {number} height the height/length of the arrow
 * @return {ol.geom.Polygon} the arrowhead triangle
 * @api stable
 */
ome.ol3.geom.Line.prototype.getArrowGeometry = function(head, width, height) {
    // check params , using reasonable defaults
    if (typeof head !== 'boolean') head = true;
    if (typeof width !== 'number' || width <= 0) width = 10;
    if (typeof height !== 'number' || height <= 0) height = 2* width;

    // we need to half width
    width /= 2;

    // get coordinates
    var coords = this.getCoordinates();
    var coordsLength = coords.length;

    // grab last line segment
    var index = head ? coordsLength-1 : 1;
    var line = [coords[index][0] - coords[index-1][0],
                coords[index][1] - coords[index-1][1]];
    if (!head) index = 0;
    var tip = [coords[index][0],coords[index][1]];

    // get unit vector and perpendicular unit vector
    var magnitude =
        Math.sqrt(line[0]*line[0] + line[1]*line[1]);
    var unitLine = [line[0]/magnitude,line[1]/magnitude];
    var perpLine = [-unitLine[1], unitLine[0]];

    // calculate base points and tip
    var direction = head ? 1 : -1;
    var point1 = [tip[0] - direction*height*unitLine[0] - width*perpLine[0],
                  tip[1] - direction*height*unitLine[1] - width*perpLine[1]];
    var point2 = [tip[0] - direction*height*unitLine[0] + width*perpLine[0],
                  tip[1] - direction*height*unitLine[1] + width*perpLine[1]];
    //var direction = head ? 1 : -1;
    //tip = [tip[0] + direction*height*unitLine[0],
    //       tip[1] + direction*height*unitLine[1]];

    return new ol.geom.Polygon([[tip, point1, point2]]);
};


/**
 * Make a complete copy of the geometry.
 * @return {ome.ol3.geom.Line} Clone.
 * @api stable
 */
ome.ol3.geom.Line.prototype.clone = function() {
  return new ome.ol3.geom.Line(
      this.getCoordinates().slice(),
        this.has_start_arrow_, this.has_end_arrow_);
};
