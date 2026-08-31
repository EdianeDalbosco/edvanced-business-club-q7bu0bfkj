migrate(
  (app) => {
    // Add video_file (file field) to edvanced_cast collection
    const castCol = app.findCollectionByNameOrId('edvanced_cast')
    if (!castCol.fields.getByName('video_file')) {
      castCol.fields.add(
        new FileField({
          name: 'video_file',
          maxSelect: 1,
          maxSize: 209715200, // 200MB
          mimeTypes: [
            'video/mp4',
            'video/webm',
            'video/quicktime',
            'video/x-msvideo',
            'video/mpeg',
          ],
          required: false,
        }),
      )
      // Make video_url optional so admin can upload file OR enter url
      const videoUrlField = castCol.fields.getByName('video_url')
      if (videoUrlField) {
        videoUrlField.required = false
      }
      app.save(castCol)
    }
  },
  (app) => {
    try {
      const castCol = app.findCollectionByNameOrId('edvanced_cast')
      const field = castCol.fields.getByName('video_file')
      if (field) {
        castCol.fields.removeByName('video_file')
        app.save(castCol)
      }
    } catch (_) {}
  },
)
