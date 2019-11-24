import { SET_POINT_CLOUD_SETTING_STRATEGY, SET_POINT_CLOUD_LIMIT, TOGGLE_POINT_CLOUD_SUB, SHOW_GEOMETRIES} from '../actions/pointCloudSetting';

export default function pointCloudSetting(state = {}, action) {
    switch (action.type) {
      case SET_POINT_CLOUD_SETTING_STRATEGY:
        return {
          ...state, 
          strategy: action.payload.strategy
        }
      case SET_POINT_CLOUD_LIMIT: 
        return {
          ...state,
          limit: action.payload.limit
        }
      case TOGGLE_POINT_CLOUD_SUB: 
        return {
          ...state, 
          subscribePointCloud: action.payload.subscribePointCloud
        }
      case SHOW_GEOMETRIES: 
        return {
          ...state,
          showGeometries: action.payload.showGeometries
        }
      default:
        return state
    }
  }

