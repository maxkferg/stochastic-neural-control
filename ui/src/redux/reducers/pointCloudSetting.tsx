import { SET_POINT_CLOUD_SETTING_STRATEGY, SET_POINT_CLOUD_LIMIT, TOGGLE_POINT_CLOUD_SUB } from '../actions/pointCloudSetting';

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
      default:
        return state
    }
  }

