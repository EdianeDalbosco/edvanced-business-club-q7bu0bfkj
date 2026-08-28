migrate(
  (app) => {
    const castCol = app.findCollectionByNameOrId('edvanced_cast')
    const meetingsCol = app.findCollectionByNameOrId('meetings')

    // Seed initial podcast episodes if none exist
    try {
      const existing = app.findRecordsByFilter('edvanced_cast', '', '-created', 1, 0)
      if (existing.length === 0) {
        // Ep 1
        const ep1 = new Record(castCol)
        ep1.set(
          'title',
          'EdvancedCast #01 — Estratégias de Crescimento e Governança para Empresas de Alto Impacto',
        )
        ep1.set(
          'description',
          'Neste episódio inaugural do EdvancedCast, Ediane Dalbosco recebe convidados especiais para debater governança corporativa, escala exponencial e liderança estratégica no mercado atual.',
        )
        ep1.set('video_url', 'https://www.youtube.com/watch?v=ysz5S6PUM-U')
        ep1.set(
          'thumbnail_url',
          'https://img.usecurling.com/p/800/450?q=business%20podcast%20studio&color=teal',
        )
        ep1.set('episode_number', 1)
        ep1.set('duration', '48 min')
        ep1.set('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        app.save(ep1)

        // Ep 2
        const ep2 = new Record(castCol)
        ep2.set(
          'title',
          'EdvancedCast #02 — Fusões, Aquisições e Captação de Investimentos para Negócios',
        )
        ep2.set(
          'description',
          'Uma conversa aprofundada sobre como preparar a sua empresa para rodadas de M&A, valuation assertivo e atração de investidores estratégicos de venture capital e private equity.',
        )
        ep2.set('video_url', 'https://www.youtube.com/watch?v=jNQXAC9IVRw')
        ep2.set(
          'thumbnail_url',
          'https://img.usecurling.com/p/800/450?q=executive%20interview%20podcast&color=dark',
        )
        ep2.set('episode_number', 2)
        ep2.set('duration', '56 min')
        ep2.set('published_at', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString())
        app.save(ep2)
      }
    } catch (_) {}

    // Update meetings with registration_url if empty
    try {
      const meetings = app.findRecordsByFilter('meetings', '', '-created', 10, 0)
      for (const m of meetings) {
        if (!m.getString('registration_url')) {
          m.set('registration_url', 'https://edvanced.com.br/inscricoes')
          app.save(m)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // down logic
  },
)
