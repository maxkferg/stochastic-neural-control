import { SHOW_ERROR, SHOW_SUCCESS, CLOSE_ALERT } from '../actions/showAlert';

const inititalState = ({
  open: false,
  type: 'success',
  message: null
})

export default function alert(state = inititalState, { type, message }) {
  switch (type) {
    case SHOW_ERROR:
      return { message, open: true, type: 'error' }
    case SHOW_SUCCESS:
      return { message, open: true, type: 'success' }
    case CLOSE_ALERT:
      return { ...state, open: false }
    default:
      return state
  }
}
