import { combineReducers } from 'redux'
import currentUser from './currentUser';
import alert from './alert'

export default () => combineReducers({
  currentUser,
  alert
})

