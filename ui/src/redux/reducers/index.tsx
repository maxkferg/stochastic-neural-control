import { combineReducers } from 'redux'
import currentUser from './currentUser';
import alert from './alert'
import pointCloudSetting from './pointCloudSetting';

export default () => combineReducers({
  currentUser,
  pointCloudSetting,
  alert
})

