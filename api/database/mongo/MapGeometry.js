const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;


/**
 * MapGeometry Schema
 * Defines the current 2D geometry of the building. 
 * Each 2D geometry object must be associated with a 3D geometry object
 * 
 * Setting isDeleted flag is preferred over deleting the object
 * as the history of each object is tracked in influxdb
 *
 */

exports.schema = {
    name: {type: String, required: true},
    mesh_id: {type: ObjectId, required: true},
    building_id: {type: ObjectId, required: true},
    isDeleted: {type: Boolean, required: true, default: false},
    isTraversable: {type: Boolean, required: true, default: false},
    internalPolygons: { type:[[[Number]]]},
    externalPolygons: { type:[[[Number]]]},
    visualPolygons: { type:[[[Number]]]},
    updatedAt: { type: Date, required: true, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
};


exports.indexes = [
    {name: 1},
    {mesh_id: 1},
    {building_id: 1},
];
