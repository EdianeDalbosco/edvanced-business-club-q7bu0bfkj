migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const meetings = app.findCollectionByNameOrId('meetings')
    const materials = app.findCollectionByNameOrId('materials')
    const disclosures = app.findCollectionByNameOrId('disclosures')

    // 1. Admin user: edianedalbosco@gmail.com
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'edianedalbosco@gmail.com')
      adminUser.set('role', 'admin')
      adminUser.set('name', 'Ediane Dal Bosco')
      adminUser.set('company', 'Edvanced Business Club')
      adminUser.set(
        'bio',
        'Fundadora e Master Leader do Edvanced Business Club. Focada em conexões de alto valor, novos negócios e desenvolvimento de lideranças.',
      )
      app.save(adminUser)
    } catch (_) {
      adminUser = new Record(users)
      adminUser.setEmail('edianedalbosco@gmail.com')
      adminUser.setPassword('Skip@Pass')
      adminUser.setVerified(true)
      adminUser.set('name', 'Ediane Dal Bosco')
      adminUser.set('role', 'admin')
      adminUser.set('company', 'Edvanced Business Club')
      adminUser.set(
        'bio',
        'Fundadora e Master Leader do Edvanced Business Club. Focada em conexões de alto valor, novos negócios e desenvolvimento de lideranças.',
      )
      app.save(adminUser)
    }

    // 2. Sample Member 1: Ricardo Alcantara
    let member1
    try {
      member1 = app.findAuthRecordByEmail('_pb_users_auth_', 'ricardo@alcantarainvest.com.br')
    } catch (_) {
      member1 = new Record(users)
      member1.setEmail('ricardo@alcantarainvest.com.br')
      member1.setPassword('Skip@Pass')
      member1.setVerified(true)
      member1.set('name', 'Ricardo Alcântara')
      member1.set('role', 'member')
      member1.set('company', 'Alcântara Investimentos & M&A')
      member1.set('phone', '+55 (11) 98765-4321')
      member1.set(
        'bio',
        'Especialista em fusões, aquisições e estruturação de capital para scale-ups e empresas consolidadas.',
      )
      app.save(member1)
    }

    // 3. Sample Member 2: Camila Duarte
    let member2
    try {
      member2 = app.findAuthRecordByEmail('_pb_users_auth_', 'camila@novatechgroup.com.br')
    } catch (_) {
      member2 = new Record(users)
      member2.setEmail('camila@novatechgroup.com.br')
      member2.setPassword('Skip@Pass')
      member2.setVerified(true)
      member2.set('name', 'Camila Duarte')
      member2.set('role', 'member')
      member2.set('company', 'NovaTech Digital Group')
      member2.set('phone', '+55 (47) 99123-8877')
      member2.set(
        'bio',
        'CEO e estrategista de transformação digital, inteligência artificial e ecossistemas B2B.',
      )
      app.save(member2)
    }

    // 4. Sample Member 3: Marcio Silveira
    let member3
    try {
      member3 = app.findAuthRecordByEmail('_pb_users_auth_', 'marcio@silveiralog.com.br')
    } catch (_) {
      member3 = new Record(users)
      member3.setEmail('marcio@silveiralog.com.br')
      member3.setPassword('Skip@Pass')
      member3.setVerified(true)
      member3.set('name', 'Márcio Silveira')
      member3.set('role', 'member')
      member3.set('company', 'Silveira Log & Supply')
      member3.set('phone', '+55 (19) 99876-1122')
      member3.set(
        'bio',
        'Diretor Executivo em logística internacional, supply chain e comércio exterior.',
      )
      app.save(member3)
    }

    // 5. Seed Meetings (3 meetings: upcoming/recent, past presencial, past online)
    let m1, m2, m3

    try {
      m1 = app.findFirstRecordByData(
        'meetings',
        'title',
        'Edvanced Mastermind: Estratégias de Escala & M&A 2025',
      )
    } catch (_) {
      m1 = new Record(meetings)
      m1.set('title', 'Edvanced Mastermind: Estratégias de Escala & M&A 2025')
      m1.set('date', '2025-04-18 19:00:00.000Z')
      m1.set('location', 'Hotel Fasano Jardins - São Paulo / SP')
      m1.set('type', 'presencial')
      m1.set('speakers', 'Ediane Dal Bosco, Dr. Fernando Cintra, Ricardo Alcântara')
      m1.set(
        'description',
        '<p>Encontro exclusivo para conselheiros e empresários do Edvanced Business Club. Pauta central: valuation, estruturação de rodadas e governança ágil para 2025.</p><p><strong>Cronograma:</strong><br/>19:00 - Welcome Drink & Networking VIP<br/>19:45 - Keynote: Desafios de Governança no Brasil<br/>20:30 - Rodada de Negócios & Parcerias<br/>21:30 - Jantar Harmonizado</p>',
      )
      app.save(m1)
    }

    try {
      m2 = app.findFirstRecordByData(
        'meetings',
        'title',
        'Encontro Online: Liderança & Inteligência Artificial no B2B',
      )
    } catch (_) {
      m2 = new Record(meetings)
      m2.set('title', 'Encontro Online: Liderança & Inteligência Artificial no B2B')
      m2.set('date', '2025-03-27 20:00:00.000Z')
      m2.set('location', 'Transmissão Privada Zoom VIP')
      m2.set('type', 'online')
      m2.set('speakers', 'Camila Duarte, Rodrigo Sampaio (CTO convidado)')
      m2.set(
        'description',
        '<p>Sessão executiva transmitida ao vivo com gravação disponibilizada aos membros. Demonstração prática de workflows corporativos com IA e automação comercial para empresas de médio e grande porte.</p>',
      )
      app.save(m2)
    }

    try {
      m3 = app.findFirstRecordByData(
        'meetings',
        'title',
        'Gala Anual Edvanced & Rodada de Parcerias Estratégicas',
      )
    } catch (_) {
      m3 = new Record(meetings)
      m3.set('title', 'Gala Anual Edvanced & Rodada de Parcerias Estratégicas')
      m3.set('date', '2025-02-15 19:30:00.000Z')
      m3.set('location', 'Palácio Tangará - São Paulo / SP')
      m3.set('type', 'presencial')
      m3.set('speakers', 'Ediane Dal Bosco, Palestrantes Convidados Internacionais')
      m3.set(
        'description',
        '<p>Celebração de conquistas e celebração de mais de R$ 120M em negócios gerados internamente entre membros do Club no último ciclo.</p>',
      )
      app.save(m3)
    }

    // 6. Seed Materials (Photos, Videos, Documents)
    const seedMaterials = [
      // Materials for Gala Anual (m3)
      {
        title: 'Galeria Oficial - Fotos em Alta Resolução (Gala Tangará)',
        type: 'photo',
        url: 'https://img.usecurling.com/p/1200/800?q=luxury%20business%20gala&color=gold',
        description:
          'Fotos dos membros durante o coquetel de boas-vindas e premiação dos destaques.',
        meeting: m3.id,
      },
      {
        title: 'Coquetel & Networking VIP - Registros Fotográficos',
        type: 'photo',
        url: 'https://img.usecurling.com/p/1200/800?q=executive%20networking%20champagne',
        description: 'Momentos de conexão e fechamento de parcerias entre os líderes do club.',
        meeting: m3.id,
      },
      {
        title: 'Aftermovie Oficial - Gala Anual Edvanced Business Club',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description:
          'Vídeo completo com os melhores momentos, depoimentos de empresários e retrospectiva.',
        meeting: m3.id,
      },
      {
        title: 'Relatório de Resultados & Impacto Financeiro Edvanced 2024',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Apresentação executiva com dados de negócios gerados e roadmap para 2025.',
        meeting: m3.id,
      },

      // Materials for Online Meeting (m2)
      {
        title: 'Gravação na Íntegra - Painel: IA Generativa & Liderança',
        type: 'video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'Gravação completa em full HD da sessão online exclusiva com Camila Duarte.',
        meeting: m2.id,
      },
      {
        title: 'Guia Prático: Implementação de IA em Empresas B2B (Slides)',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Framework em PDF com passo a passo de governança, ferramentas e ROI em IA.',
        meeting: m2.id,
      },
      {
        title: 'Screenshots & Frameworks Apresentados na Masterclass',
        type: 'photo',
        url: 'https://img.usecurling.com/p/1200/800?q=dashboard%20artificial%20intelligence',
        description: 'Capturas dos fluxos e arquiteturas de integração apresentadas.',
        meeting: m2.id,
      },

      // Materials for Upcoming/Recent Mastermind (m1)
      {
        title: 'Apostila Executiva: Valuation & Due Diligence Estratégica',
        type: 'document',
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
        description: 'Material de apoio distribuído aos participantes do Mastermind.',
        meeting: m1.id,
      },
      {
        title: 'Fotos de Recepção e Welcome Coffee',
        type: 'photo',
        url: 'https://img.usecurling.com/p/1200/800?q=modern%20boardroom%20executives',
        description: 'Chegada dos conselheiros e diretores convidados no Fasano.',
        meeting: m1.id,
      },
    ]

    for (const mat of seedMaterials) {
      try {
        app.findFirstRecordByData('materials', 'title', mat.title)
      } catch (_) {
        const rec = new Record(materials)
        rec.set('title', mat.title)
        rec.set('type', mat.type)
        rec.set('url', mat.url)
        rec.set('description', mat.description)
        rec.set('meeting', mat.meeting)
        app.save(rec)
      }
    }

    // 7. Seed Disclosures (2 pending, 1 approved, 1 rejected for demo)
    // Approved disclosure (by Camila Duarte)
    try {
      app.findFirstRecordByData(
        'disclosures',
        'title',
        'Imersão de Inteligência Artificial aplicada ao B2B - Desconto Especial para Membros',
      )
    } catch (_) {
      const d1 = new Record(disclosures)
      d1.set(
        'title',
        'Imersão de Inteligência Artificial aplicada ao B2B - Desconto Especial para Membros',
      )
      d1.set(
        'content',
        'Convidamos todos os empresários do Edvanced Business Club para a Imersão Executiva NovaTech. 2 dias intensivos em Alphaville com simulações práticas de vendas e atendimento com IA. Condição exclusiva de 30% off para associados do Club!',
      )
      d1.set('status', 'approved')
      d1.set('member', member2.id)
      d1.set('event_date', '2025-05-10 09:00:00.000Z')
      d1.set('event_location', 'Centro Empresarial Alphaville - Barueri / SP')
      d1.set('contact_link', 'https://novatechgroup.com.br/imersao-edvanced')
      d1.set(
        'admin_feedback',
        'Divulgação aprovada pela diretoria. Conteúdo de alto valor para o grupo!',
      )
      app.save(d1)
    }

    // Pending disclosure 1 (by Ricardo Alcantara)
    try {
      app.findFirstRecordByData(
        'disclosures',
        'title',
        'Rodada Fechada de Co-investimento: Scale-up em Logística',
      )
    } catch (_) {
      const d2 = new Record(disclosures)
      d2.set('title', 'Rodada Fechada de Co-investimento: Scale-up em Logística')
      d2.set(
        'content',
        'Abertura de rodada bridge pré-série A para empresa do setor de supply chain com faturamento anual de R$ 18M. Apresentação exclusiva do teaser e tese de investimento para empresários interessados em diversificar portfólio.',
      )
      d2.set('status', 'pending')
      d2.set('member', member1.id)
      d2.set('event_date', '2025-04-25 18:00:00.000Z')
      d2.set('event_location', 'Itaim Bibi / Zoom Reservado')
      d2.set('contact_link', 'https://alcantarainvest.com.br/contato')
      app.save(d2)
    }

    // Pending disclosure 2 (by Marcio Silveira)
    try {
      app.findFirstRecordByData(
        'disclosures',
        'title',
        'Workshop: Otimização Tributária no Comércio Exterior & Logística',
      )
    } catch (_) {
      const d3 = new Record(disclosures)
      d3.set('title', 'Workshop: Otimização Tributária no Comércio Exterior & Logística')
      d3.set(
        'content',
        'Treinamento direcionado para CFOs e diretores operacionais. Como aproveitar benefícios fiscais em portos secos e reduzir custos logísticos em até 22% na cadeia de suprimentos.',
      )
      d3.set('status', 'pending')
      d3.set('member', member3.id)
      d3.set('event_date', '2025-05-05 14:00:00.000Z')
      d3.set('event_location', 'Campinas / SP & Online')
      d3.set('contact_link', 'https://silveiralog.com.br/workshop')
      app.save(d3)
    }

    // Rejected disclosure (to showcase the rejected state & feedback)
    try {
      app.findFirstRecordByData(
        'disclosures',
        'title',
        'Oferta de Software Genérico sem Contexto B2B',
      )
    } catch (_) {
      const d4 = new Record(disclosures)
      d4.set('title', 'Oferta de Software Genérico sem Contexto B2B')
      d4.set('content', 'Venda de licenças genéricas de antivírus e suporte básico de TI.')
      d4.set('status', 'rejected')
      d4.set('member', member1.id)
      d4.set(
        'admin_feedback',
        'Olá Ricardo, para mantermos a proposta de valor do Edvanced Business Club, as divulgações precisam ter foco em eventos executivos, parcerias estratégicas de negócios ou benefícios exclusivos aos membros. Por favor ajuste o escopo e envie novamente!',
      )
      app.save(d4)
    }
  },
  (app) => {
    // down migration
  },
)
