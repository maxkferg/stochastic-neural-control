export const SHOW_ERROR: string = 'SHOW_ERROR';
export const SHOW_SUCCESS: string = 'SHOW_SUCCESS';
export const CLOSE_ALERT: string = 'CLOSE_ALERT';

export const showError = message => ({
  type: SHOW_ERROR,
  message,
})

export const showSuccess = message => ({
  type: SHOW_SUCCESS,
  message,
})

export const closeAlert = () => ({
  type: CLOSE_ALERT,
})