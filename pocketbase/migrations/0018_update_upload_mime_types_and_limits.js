migrate(
  (app) => {
    // 1. Update disclosures collection media field to allow images, videos and PDFs up to 100MB
    const disclosuresCol = app.findCollectionByNameOrId('disclosures')
    const mediaField = disclosuresCol.fields.getByName('media')
    if (mediaField) {
      mediaField.maxSize = 104857600 // 100MB
      mediaField.mimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'application/pdf',
      ]
      app.save(disclosuresCol)
    }

    // 2. Update materials collection file field to allow up to 100MB and support images, videos and PDFs
    const materialsCol = app.findCollectionByNameOrId('materials')
    const fileField = materialsCol.fields.getByName('file')
    if (fileField) {
      fileField.maxSize = 104857600 // 100MB
      fileField.mimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'application/pdf',
      ]
      app.save(materialsCol)
    }

    // 3. Update edvanced_cast cover_image to allow up to 50MB and images
    const castCol = app.findCollectionByNameOrId('edvanced_cast')
    const coverField = castCol.fields.getByName('cover_image')
    if (coverField) {
      coverField.maxSize = 52428800 // 50MB
      coverField.mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      app.save(castCol)
    }
  },
  (app) => {
    // Revert logic if needed
  },
)
