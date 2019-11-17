import { SET_POINT_CLOUD_SETTING_STRATEGY, SET_POINT_CLOUD_LIMIT } from '../actions/pointCloudSetting';

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
      default:
        return state
    }
  }

