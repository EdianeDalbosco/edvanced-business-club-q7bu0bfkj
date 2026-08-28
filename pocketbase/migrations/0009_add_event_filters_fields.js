migrate(
  (app) => {
    // 1. Atualizar coleção meetings com pricing (pago/gratuito) e garantir format (presencial/online/hibrido)
    const meetings = app.findCollectionByNameOrId('meetings')

    if (!meetings.fields.getByName('pricing')) {
      meetings.fields.add(
        new SelectField({
          name: 'pricing',
          required: false,
          values: ['gratuito', 'pago'],
          maxSelect: 1,
        }),
      )
    }

    app.save(meetings)

    // 2. Atualizar coleção disclosures com format (presencial/online/hibrido) e pricing (gratuito/pago)
    const disclosures = app.findCollectionByNameOrId('disclosures')

    if (!disclosures.fields.getByName('format')) {
      disclosures.fields.add(
        new SelectField({
          name: 'format',
          required: false,
          values: ['presencial', 'online', 'hibrido'],
          maxSelect: 1,
        }),
      )
    }

    if (!disclosures.fields.getByName('pricing')) {
      disclosures.fields.add(
        new SelectField({
          name: 'pricing',
          required: false,
          values: ['gratuito', 'pago'],
          maxSelect: 1,
        }),
      )
    }

    app.save(disclosures)
  },
  (app) => {
    try {
      const meetings = app.findCollectionByNameOrId('meetings')
      const pricingField = meetings.fields.getByName('pricing')
      if (pricingField) {
        meetings.fields.removeByName('pricing')
        app.save(meetings)
      }
    } catch (_) {}

    try {
      const disclosures = app.findCollectionByNameOrId('disclosures')
      let changed = false
      if (disclosures.fields.getByName('format')) {
        disclosures.fields.removeByName('format')
        changed = true
      }
      if (disclosures.fields.getByName('pricing')) {
        disclosures.fields.removeByName('pricing')
        changed = true
      }
      if (changed) {
        app.save(disclosures)
      }
    } catch (_) {}
  },
)
