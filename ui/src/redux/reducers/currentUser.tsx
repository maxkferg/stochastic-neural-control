import { SET_CURRENT_USER } from '../actions/currentUser';
export default function currentUser(state = {}, action) {
    switch (action.type) {
      case SET_CURRENT_USER:
        return {...state, ...action.payload}
      default:
        return state
    }
  }

