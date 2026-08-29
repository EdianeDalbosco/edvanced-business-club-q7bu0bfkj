migrate(
  (app) => {
    const collection = new Collection({
      name: 'testimonials',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'author_name', type: 'text', required: true },
        { name: 'author_role', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'content', type: 'text', required: true },
        {
          name: 'avatar',
          type: 'file',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        },
        { name: 'avatar_url', type: 'url' },
        { name: 'rating', type: 'number', min: 1, max: 5 },
        { name: 'order', type: 'number' },
        { name: 'featured', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_testimonials_order ON testimonials (featured, `order`, created DESC)',
      ],
    })
    app.save(collection)

    // Seed initial executive testimonials
    const seeded = [
      {
        author_name: 'Dr. Marcelo Siqueira',
        author_role: 'Presidente do Conselho & Co-Founder',
        company: 'Siqueira Capital & Participações',
        content:
          'O Edvanced Business Club elevou o nível dos nossos debates de governança corporativa e sucessão familiar. As conexões geradas nos encontros foram decisivas para fecharmos duas grandes rodadas estratégicas.',
        avatar_url: 'https://img.usecurling.com/ppl/medium?gender=male&seed=44',
        rating: 5,
        order: 1,
        featured: true,
      },
      {
        author_name: 'Helena Drummond',
        author_role: 'CEO',
        company: 'Drummond Logística & Supply',
        content:
          'Um ecossistema seleto, sério e de altíssimo valor prático. Participar dos encontros presenciais e acompanhar os conteúdos exclusivos tem sido indispensável para a governança do nosso grupo.',
        avatar_url: 'https://img.usecurling.com/ppl/medium?gender=female&seed=18',
        rating: 5,
        order: 2,
        featured: true,
      },
      {
        author_name: 'Rodrigo Mendonça',
        author_role: 'Sócio-Diretor',
        company: 'Nexus Investimentos & M&A',
        content:
          'A curadoria dos temas e o nível dos membros fazem do Club um ambiente incomparável para geração de valor, parcerias B2B e troca franca de experiências entre tomadores de decisão.',
        avatar_url: 'https://img.usecurling.com/ppl/medium?gender=male&seed=82',
        rating: 5,
        order: 3,
        featured: true,
      },
      {
        author_name: 'Beatriz Nogueira',
        author_role: 'Diretora de Expansão & Relações com Investidores',
        company: 'Vanguard Tech & Health',
        content:
          'A privacidade, elegância e o compromisso ético dos membros são os grandes diferenciais. É o melhor fórum executivo que participo no Brasil.',
        avatar_url: 'https://img.usecurling.com/ppl/medium?gender=female&seed=91',
        rating: 5,
        order: 4,
        featured: true,
      },
    ]

    const col = app.findCollectionByNameOrId('testimonials')
    for (const item of seeded) {
      const record = new Record(col)
      record.set('author_name', item.author_name)
      record.set('author_role', item.author_role)
      record.set('company', item.company)
      record.set('content', item.content)
      record.set('avatar_url', item.avatar_url)
      record.set('rating', item.rating)
      record.set('order', item.order)
      record.set('featured', item.featured)
      app.save(record)
    }
  },
  (app) => {
    try {
      const collection = app.findCollectionByNameOrId('testimonials')
      app.delete(collection)
    } catch (_) {}
  },
)
