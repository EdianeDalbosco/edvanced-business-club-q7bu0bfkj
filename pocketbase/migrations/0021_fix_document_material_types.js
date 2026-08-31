/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    // Update the sample material "Slides do Encontro" if it was erroneously set to photo
    try {
      const record = app.findRecordById('materials', 'bmonskh0al7j992')
      if (record) {
        if (record.get('type') === 'photo') {
          record.set('type', 'document')
          app.save(record)
        }
      }
    } catch (err) {
      // Record might not exist in this environment or already corrected
    }

    // Also fix any other materials with PDF or presentation names that were set to 'photo'
    try {
      const records = app.findRecordsByFilter(
        'materials',
        "type = 'photo' && (title ~ 'slide' || title ~ 'Slide' || title ~ 'PDF' || title ~ 'pdf' || title ~ 'apresenta' || title ~ 'Apresenta' || file ~ '.pdf' || file ~ '.pptx' || file ~ '.ppt' || file ~ '.xlsx' || file ~ '.docx')",
        '-created',
        100,
        0,
      )
      for (const rec of records) {
        rec.set('type', 'document')
        app.save(rec)
      }
    } catch (err) {
      // ignore
    }
  },
  (app) => {
    // rollback
  },
)
