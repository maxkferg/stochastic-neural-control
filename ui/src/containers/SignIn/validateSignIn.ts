interface SignInValidation {
  valid: boolean
  firstNameMessage?: string
  lastNameMessage?: string
  emailMessage?: string
  passwordMessage?: string
}

function validateSignIn({ email, password }): SignInValidation {
  const validation = { valid: true }
  const emailRegex = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/

  if (!email) {
    validation.valid = false
    validation['emailMessage'] = 'Email is required'
  }
  if (email && !emailRegex.test(email)) {
    validation.valid = false
    validation['emailMessage'] = 'Invalid email'
  }
  if (!password) {
    validation.valid = false
    validation['passwordMessage'] = 'Password is required'
  }
  return validation
}

export default validateSignIn