migrate(
  (app) => {
    // 1. Tornar o campo photo_url do tipo text (ou remover validação url rígida) para aceitar caminhos locais e URLs completas
    const spacesPhotosCollection = app.findCollectionByNameOrId('club_spaces_photos')
    const photoUrlField = spacesPhotosCollection.fields.getByName('photo_url')
    if (photoUrlField) {
      spacesPhotosCollection.fields.removeByName('photo_url')
      spacesPhotosCollection.fields.add(new TextField({ name: 'photo_url' }))
      app.save(spacesPhotosCollection)
    }

    // 2. Cadastrar / atualizar as 2 fotos dos espaços com seus títulos, legendas e caminhos
    try {
      const existing = app.findFirstRecordByData(
        'club_spaces_photos',
        'title',
        'Sala de Reunião Edvanced',
      )
      existing.set('title', 'Sala de Reunião Edvanced')
      existing.set(
        'caption',
        'Espaço executivo sofisticado com mesa de mármore para 8 lugares, tela de alta resolução para apresentações, iluminação em LED planejada e ambiente climatizado ideal para fechamento de negócios e reuniões estratégicas.',
      )
      existing.set('space_type', 'Sala de Reunião')
      existing.set('order', 1)
      existing.set('active', true)
      existing.set('photo_url', '/images/sala-de-reuniao.jpeg')
      app.save(existing)
    } catch (_) {
      const record = new Record(spacesPhotosCollection)
      record.set('title', 'Sala de Reunião Edvanced')
      record.set(
        'caption',
        'Espaço executivo sofisticado com mesa de mármore para 8 lugares, tela de alta resolução para apresentações, iluminação em LED planejada e ambiente climatizado ideal para fechamento de negócios e reuniões estratégicas.',
      )
      record.set('space_type', 'Sala de Reunião')
      record.set('order', 1)
      record.set('active', true)
      record.set('photo_url', '/images/sala-de-reuniao.jpeg')
      app.save(record)
    }

    try {
      const existing = app.findFirstRecordByData(
        'club_spaces_photos',
        'title',
        'Sala Compartilhada (Coworking VIP)',
      )
      existing.set('title', 'Sala Compartilhada (Coworking VIP)')
      existing.set(
        'caption',
        'Ambiente compartilhado de alto padrão equipado com estações de trabalho ergonômicas, armários planejados, climatização e infraestrutura completa para focar na produtividade e networking diário.',
      )
      existing.set('space_type', 'Sala Compartilhada')
      existing.set('order', 2)
      existing.set('active', true)
      existing.set('photo_url', '/images/sala-compartilhada.jpeg')
      app.save(existing)
    } catch (_) {
      const record = new Record(spacesPhotosCollection)
      record.set('title', 'Sala Compartilhada (Coworking VIP)')
      record.set(
        'caption',
        'Ambiente compartilhado de alto padrão equipado com estações de trabalho ergonômicas, armários planejados, climatização e infraestrutura completa para focar na produtividade e networking diário.',
      )
      record.set('space_type', 'Sala Compartilhada')
      record.set('order', 2)
      record.set('active', true)
      record.set('photo_url', '/images/sala-compartilhada.jpeg')
      app.save(record)
    }
  },
  (app) => {
    try {
      const r1 = app.findFirstRecordByData(
        'club_spaces_photos',
        'title',
        'Sala de Reunião Edvanced',
      )
      app.delete(r1)
    } catch (_) {}
    try {
      const r2 = app.findFirstRecordByData(
        'club_spaces_photos',
        'title',
        'Sala Compartilhada (Coworking VIP)',
      )
      app.delete(r2)
    } catch (_) {}
  },
)
