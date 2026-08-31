migrate(
  (app) => {
    // 1. Criar coleção club_benefits
    const benefitsCollection = new Collection({
      name: 'club_benefits',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'icon_name', type: 'text' },
        { name: 'category', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_club_benefits_order ON club_benefits (order)',
        'CREATE INDEX idx_club_benefits_active ON club_benefits (active)',
      ],
    })
    app.save(benefitsCollection)

    // 2. Criar coleção club_spaces_photos
    const spacesPhotosCollection = new Collection({
      name: 'club_spaces_photos',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'caption', type: 'text' },
        {
          name: 'photo',
          type: 'file',
          maxSelect: 1,
          maxSize: 10485760,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
        },
        { name: 'photo_url', type: 'url' },
        { name: 'space_type', type: 'text' },
        { name: 'order', type: 'number' },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_club_spaces_order ON club_spaces_photos (order)',
        'CREATE INDEX idx_club_spaces_active ON club_spaces_photos (active)',
      ],
    })
    app.save(spacesPhotosCollection)

    // 3. Seed inicial dos benefícios padrão baseados na proposta exclusiva e no material do PDF
    const defaultBenefits = [
      {
        title: '1 Encontro Presencial por Mês',
        description:
          'Conteúdo estratégico de alta governança, especialistas convidados de renome nacional, networking altamente qualificado, troca de experiências reais e conexões que geram novos negócios.',
        icon_name: 'Users',
        category: 'Encontros',
        order: 1,
        active: true,
      },
      {
        title: '1 Encontro Online por Mês',
        description:
          'Aprofundamento prático e aplicável em Gestão, Liderança, Marketing, Vendas, Processos, Produtividade e Finanças para acelerar a execução do seu negócio.',
        icon_name: 'Video',
        category: 'Encontros',
        order: 2,
        active: true,
      },
      {
        title: 'Acesso à Sala de Reunião Edvanced',
        description:
          '1 hora mensal inclusa de utilização da Sala de Reunião em ambiente empresarial moderno e climatizado para reuniões estratégicas com clientes, investidores e parceiros.',
        icon_name: 'Building2',
        category: 'Estrutura',
        order: 3,
        active: true,
      },
      {
        title: 'Sala Compartilhada (Coworking VIP)',
        description:
          '5 horas mensais inclusas de utilização da Sala Compartilhada. Ambiente profissional de alto padrão para focar na produtividade e conexões de negócios sem custos fixos de estrutura própria.',
        icon_name: 'Briefcase',
        category: 'Estrutura',
        order: 4,
        active: true,
      },
      {
        title: 'Participação no Ecossistema Edvanced',
        description:
          'Acesso prioritário a eventos exclusivos, parcerias estratégicas, networking contínuo com fundadores e tomadores de decisão e oportunidades reais de M&A e negócios.',
        icon_name: 'Sparkles',
        category: 'Ecossistema',
        order: 5,
        active: true,
      },
      {
        title: 'EdvancedCast & Acervo do Club',
        description:
          'Videocast exclusivo com grandes líderes de mercado, acervo de apresentações, fotos em alta resolução, gravações e materiais executivos das edições.',
        icon_name: 'Mic',
        category: 'Conteúdo',
        order: 6,
        active: true,
      },
    ]

    for (const b of defaultBenefits) {
      const record = new Record(benefitsCollection)
      record.set('title', b.title)
      record.set('description', b.description)
      record.set('icon_name', b.icon_name)
      record.set('category', b.category)
      record.set('order', b.order)
      record.set('active', b.active)
      app.save(record)
    }
  },
  (app) => {
    try {
      const bCol = app.findCollectionByNameOrId('club_benefits')
      app.delete(bCol)
    } catch (_) {}
    try {
      const sCol = app.findCollectionByNameOrId('club_spaces_photos')
      app.delete(sCol)
    } catch (_) {}
  },
)
