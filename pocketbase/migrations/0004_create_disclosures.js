migrate(
  (app) => {
    const disclosures = new Collection({
      name: 'disclosures',
      type: 'base',
      // Members can list/view approved ones OR their own; admins can list/view all
      listRule:
        "@request.auth.id != '' && (status = 'approved' || member = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (status = 'approved' || member = @request.auth.id || @request.auth.role = 'admin')",
      // Any authenticated user can create their own disclosure as pending
      createRule: "@request.auth.id != '' && member = @request.auth.id",
      // Member can update their own if pending, or admin can update status and feedback
      updateRule:
        "@request.auth.id != '' && (member = @request.auth.id || @request.auth.role = 'admin')",
      // Member can delete their own if pending, or admin can delete
      deleteRule:
        "@request.auth.id != '' && (member = @request.auth.id || @request.auth.role = 'admin')",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'content', type: 'text', required: true },
        {
          name: 'media',
          type: 'file',
          maxSelect: 1,
          maxSize: 20971520,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'],
          required: false,
        },
        {
          name: 'status',
          type: 'select',
          values: ['pending', 'approved', 'rejected'],
          maxSelect: 1,
          required: true,
        },
        {
          name: 'member',
          type: 'relation',
          collectionId: '_pb_users_auth_',
          required: true,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'admin_feedback', type: 'text', required: false },
        { name: 'event_date', type: 'date', required: false },
        { name: 'event_location', type: 'text', required: false },
        { name: 'contact_link', type: 'url', required: false },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_disclosures_status ON disclosures (status)',
        'CREATE INDEX idx_disclosures_member ON disclosures (member)',
      ],
    })
    app.save(disclosures)
  },
  (app) => {
    const disclosures = app.findCollectionByNameOrId('disclosures')
    app.delete(disclosures)
  },
)
