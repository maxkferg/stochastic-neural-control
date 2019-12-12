const mongoose = require('mongoose');
const ObjectId = mongoose.Schema.Types.ObjectId;
const pointService = require('../../services/PointService');
/**
 * Point Schema
 * Defines current point in a building
 *
 */
const MAX_POINTS_GROUP_ROBOT = 100000
const pointPositionSchema = {
    x: { type: Number, required: true, default: null },
    y: { type: Number, required: true, default: null },
    z: { type: Number, required: true, default: null },
}

const pointAttributeSchema = {
    r: { type: Number, required: true, default: null },
    g: { type: Number, required: true, default: null },
    b: { type: Number, required: true, default: null },
}

const robotSchema = {
    id: {
        type: ObjectId, required: true
    }
}

const pointItemSchema = {
    position: { 
        type: pointPositionSchema, require: true
    },
    attribute: {
        type: pointAttributeSchema, require: true
    }
}

const pointsGroup = {
    points: { 
        type: pointItemSchema, require: true
    }
}   

const timeSchema = { 
    secs: {
        type: Date
    },
    nsecs: {
        type: Date
    }
}

exports.schema = {
    robot: { type: robotSchema, require: true },
    pointsGroup: { type: pointsGroup, require: true},
    time: { type: timeSchema}
};

exports.indexes = [
    {"robot.id":  1},
];

exports.hooks = {
    type: 'pre',
    query: 'insertMany',
    callback: async (doc, next) => {
        try {
            const currentPointsGroup = await pointService.countPointsGroupOfRobot(doc.robot.id)
            if (currentPointsGroup + doc.length > 10) {
                await pointService.removePointsGroupOfRobot(doc.robot.id);
            }
            next()
        } catch {
            console.log('ERROR when save points')
        }
    }
}


