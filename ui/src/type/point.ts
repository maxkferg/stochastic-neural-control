export interface PointI {
    x: Number
    y: Number
    z: Number
    r: Number
    g: Number
    b: Number
    t: Number
    robotId: String
    buildingId: String
}

export class Point implements PointI {
    x: Number
    y: Number
    z: Number
    r: Number
    g: Number
    b: Number
    t: Number
    robotId: String
    buildingId: String
    constructor(pointData: PointI) {
        this.x = pointData.x;
        this.y = pointData.y;
        this.z = pointData.z;
        this.r = pointData.r;
        this.g = pointData.g;
        this.b = pointData.b;
        this.t = pointData.t;
        this.robotId = pointData.robotId;
        this.buildingId = pointData.buildingId;
    }
}