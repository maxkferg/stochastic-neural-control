var Validator = require('jsonschema').Validator;
var v = new Validator();

var poseSchema = {
  "type": "object",
  "properties": {
    "robot": {
      "type": "object",
      "required": true,
      "properties": {
        "id": {
          "type": "string",
          "required": true
        }
      }
    },
    "twist": {
      "type": "object",
    },
    "header": {
      "type": "object",
    },
    "pose": {
      "type": "object",
      "properties": {
        "pose": {
          "type": "object",
          "properties": {
            "position": {
              "type": "object",
              "properties": {
                "x": {"type": "number"},
                "y": {"type": "number"},
                "z": {"type": "number"},
              }
            },
            "orientation": {
              "type": "object",
              "properties": {
                "x": {"type": "number"},
                "y": {"type": "number"},
                "z": {"type": "number"},
                "w": {"type": "number"},
              }
            }
          }
        }
      }
    }
  }
}


var mapSchema = {
  "type": "object",
  "properties": {
    "mesh_id": {
      "type": "string",
      "required": true,
    },
    "internal_polygons": {
      "type": "array"
    },
    "external_polygons": {
      "type": "array"
    },
    "visual_polygons": {
      "type": "array"
    }
  }
}


class KafkaValidator {

  /**
   * validatePose
   * Validate a pose object
   */
  validatePose(msg) {
    return v.validate(msg, poseSchema)
  }

  /**
   * validateGeometry
   * Validate a map geometry message
   */
  validateMapGeometry(msg){
    return v.validate(msg, mapSchema)
  }
}



module.exports = new KafkaValidator;