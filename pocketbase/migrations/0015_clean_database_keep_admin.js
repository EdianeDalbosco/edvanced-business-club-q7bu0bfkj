migrate(
  (app) => {
    // 1. Delete materials (references meetings)
    try {
      const materialsCol = app.findCollectionByNameOrId('materials')
      app.truncateCollection(materialsCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM materials').execute()
    }

    // 2. Delete disclosures (references users)
    try {
      const disclosuresCol = app.findCollectionByNameOrId('disclosures')
      app.truncateCollection(disclosuresCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM disclosures').execute()
    }

    // 3. Delete meetings
    try {
      const meetingsCol = app.findCollectionByNameOrId('meetings')
      app.truncateCollection(meetingsCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM meetings').execute()
    }

    // 4. Delete edvanced_cast
    try {
      const edvancedCastCol = app.findCollectionByNameOrId('edvanced_cast')
      app.truncateCollection(edvancedCastCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM edvanced_cast').execute()
    }

    // 5. Delete testimonials
    try {
      const testimonialsCol = app.findCollectionByNameOrId('testimonials')
      app.truncateCollection(testimonialsCol)
    } catch (_) {
      app.db().newQuery('DELETE FROM testimonials').execute()
    }

    // 6. Delete all users EXCEPT the admin with email 'edianedalbosco@gmail.com'
    const adminEmail = 'edianedalbosco@gmail.com'
    const users = app.findRecordsByFilter('users', `email != '${adminEmail}'`, '', 0, 0)
    for (const u of users) {
      app.delete(u)
    }
  },
  (app) => {
    // down migration - data deletion cannot be reversed
  },
)
