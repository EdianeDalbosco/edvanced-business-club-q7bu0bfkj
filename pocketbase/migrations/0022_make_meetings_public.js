migrate(
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')
    meetings.listRule = ''
    meetings.viewRule = ''
    app.save(meetings)
  },
  (app) => {
    const meetings = app.findCollectionByNameOrId('meetings')
    meetings.listRule = "@request.auth.id != ''"
    meetings.viewRule = "@request.auth.id != ''"
    app.save(meetings)
  },
)
