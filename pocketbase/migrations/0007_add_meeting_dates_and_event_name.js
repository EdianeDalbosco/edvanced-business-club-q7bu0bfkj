/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')

    // 1. Add event_name (text), start_date (date), end_date (date)
    if (!meetings.fields.getByName('event_name')) {
      meetings.fields.add(
        new TextField({
          name: 'event_name',
          required: false,
        }),
      )
    }

    if (!meetings.fields.getByName('start_date')) {
      meetings.fields.add(
        new DateField({
          name: 'start_date',
          required: false,
        }),
      )
    }

    if (!meetings.fields.getByName('end_date')) {
      meetings.fields.add(
        new DateField({
          name: 'end_date',
          required: false,
        }),
      )
    }

    app.save(meetings)

    // 2. Populate new fields for existing meetings
    const records = app.findRecordsByFilter('meetings', '', '-created', 100, 0)
    for (let i = 0; i < records.length; i++) {
      const rec = records[i]
      const dateVal = rec.getString('date')
      const title = rec.getString('title')

      let startIso = dateVal
      let endIso = ''

      if (dateVal) {
        try {
          const dStart = new Date(dateVal)
          // Default end date is 2 hours and 30 minutes after start (15 min aligned)
          const dEnd = new Date(dStart.getTime() + 2.5 * 60 * 60 * 1000)
          endIso = dEnd.toISOString().replace('T', ' ')
          startIso = dStart.toISOString().replace('T', ' ')
        } catch (_) {}
      }

      if (!rec.getString('start_date') && startIso) {
        rec.set('start_date', startIso)
      }
      if (!rec.getString('end_date') && endIso) {
        rec.set('end_date', endIso)
      }

      if (!rec.getString('event_name')) {
        if (title.toLowerCase().includes('mastermind')) {
          rec.set('event_name', 'Edvanced Executive Immersion 2025')
        } else if (
          title.toLowerCase().includes('online') ||
          title.toLowerCase().includes('ia') ||
          title.toLowerCase().includes('inteligência')
        ) {
          rec.set('event_name', 'Webinar VIP Series B2B')
        } else if (title.toLowerCase().includes('gala')) {
          rec.set('event_name', 'Edvanced Annual Awards & Gala')
        } else if (title.toLowerCase().includes('presencial')) {
          rec.set('event_name', 'Ciclo de Encontros Transformação')
        } else {
          rec.set('event_name', 'Edvanced Business Summit')
        }
      }

      app.save(rec)
    }
  },
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')

    const eventName = meetings.fields.getByName('event_name')
    if (eventName) meetings.fields.remove(eventName)

    const startDate = meetings.fields.getByName('start_date')
    if (startDate) meetings.fields.remove(startDate)

    const endDate = meetings.fields.getByName('end_date')
    if (endDate) meetings.fields.remove(endDate)

    app.save(meetings)
  },
)
