export interface PointI {
    position: PointPositionI
    attribute: PointAttributeI
    t: Number
    robotId: String
    buildingId: String
}


interface PointPositionI { 
    x: Number 
    y: Number 
    z: Number
}


interface PointAttributeI { 
    r: Number 
    b: Number 
    g: Number
}


export class Point implements PointI {
    position: PointPositionI
    attribute: PointAttributeI
    t: Number
    robotId: String
    buildingId: String
    constructor(pointData: PointI) {
        const { position, attribute } = pointData;
        this.position = position;
        this.attribute = attribute;
        this.t = pointData.t;
        this.robotId = pointData.robotId;
        this.buildingId = pointData.buildingId;
    }
}