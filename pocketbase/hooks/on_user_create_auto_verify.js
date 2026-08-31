onRecordCreateRequest((e) => {
  // If the user being created has no verified value or if an admin creates them,
  // ensure the new record is marked as verified so they can log in directly.
  try {
    if (e.record) {
      e.record.setVerified(true)
    }
  } catch (err) {
    console.warn('Could not auto-verify record in onRecordCreateRequest:', err)
  }

  e.next()
}, 'users')
