onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const title = record.getString('title') || 'Novo Episódio'
    const epNumber = record.getInt('episode_number') || null
    const duration = record.getString('duration') || ''
    const description = record.getString('description') || ''

    let users = []
    try {
      users = $app.findRecordsByFilter('users', "status != 'suspended'", 'name', 100, 0)
    } catch (findErr) {
      console.warn('Erro ao buscar usuários para notificação de novo podcast:', findErr)
      return
    }

    const epPrefix = epNumber ? `Episódio #${epNumber}: ` : ''
    const subject = `🎙️ Novo EdvancedCast no ar: ${epPrefix}${title}`
    const mailClient = $app.newMailClient()
    const senderAddress = $app.settings().meta.senderAddress || 'no-reply@edvanced.com.br'
    const senderName = $app.settings().meta.senderName || 'Edvanced Business Club'

    for (let i = 0; i < users.length; i++) {
      const user = users[i]
      const email = user.email()
      if (!email) continue
      const userName = user.getString('name') || 'Membro'

      const htmlBody = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0f172a; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
            .header { background: #06242E; padding: 28px 24px; text-align: center; border-bottom: 3px solid #D4AF37; }
            .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; }
            .header p { color: #D4AF37; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 2px; }
            .content { padding: 32px 24px; }
            .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }
            .cast-title { font-size: 18px; font-weight: 800; color: #06242E; margin: 8px 0 16px 0; }
            .detail-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
            .footer { background: #03151B; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EDVANCED BUSINESS CLUB</h1>
              <p>EdvancedCast &bull; Videocast Oficial</p>
            </div>
            <div class="content">
              <span class="badge">🎙️ Novo Episódio Liberado</span>
              <p style="font-size: 14px; line-height: 1.6;">Olá, <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6;">Um novo episódio do videocast oficial do Edvanced Business Club já está disponível para você assistir!</p>
              
              <div class="cast-title">${epPrefix}${title}</div>
              
              <div class="detail-card">
                ${duration ? `<div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>⏱ Duração:</strong> ${duration}</div>` : ''}
                ${description ? `<div style="font-size: 13px; color: #475569; line-height: 1.5;">${description}</div>` : ''}
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Acesse a aba <strong>EdvancedCast</strong> no portal público para assistir ao episódio completo pelo player oficial.</p>
            </div>
            <div class="footer">
              <p style="margin: 0;">&copy; Edvanced Business Club &bull; Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `

      try {
        const message = new MailerMessage({
          from: { address: senderAddress, name: senderName },
          to: [{ address: email, name: userName }],
          subject: subject,
          html: htmlBody,
        })
        mailClient.send(message)
        console.log(`[E-mail Enviado] Notificação de novo podcast enviada para ${email}`)
      } catch (sendErr) {
        console.warn(
          `[E-mail Log] Falha ou simulação de envio de novo podcast para ${email}:`,
          sendErr,
        )
      }
    }
  } catch (globalErr) {
    console.error('Erro no hook on_podcast_created:', globalErr)
  }
}, 'edvanced_cast')
