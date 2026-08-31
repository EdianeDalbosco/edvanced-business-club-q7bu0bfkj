migrate(
  (app) => {
    // 1. Update disclosures collection media field to allow images, videos, PDFs and Excel spreadsheets up to 100MB
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
        'video/x-msvideo',
        'video/mpeg',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      app.save(disclosuresCol)
    }

    // 2. Update materials collection file field to allow up to 100MB and support images, videos, PDFs and Excel spreadsheets
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
        'video/x-msvideo',
        'video/mpeg',
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      app.save(materialsCol)
    }
  },
  (app) => {
    // Revert logic if needed
  },
)
