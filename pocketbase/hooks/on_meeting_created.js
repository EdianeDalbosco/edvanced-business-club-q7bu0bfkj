onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const title = record.getString('title') || 'Novo Encontro'
    const eventName = record.getString('event_name') || ''
    const location = record.getString('location') || ''
    const dateStr = record.getString('start_date') || record.getString('date') || ''
    const pricing = record.getString('pricing') || 'gratuito'
    const formatType = record.getString('type') || 'presencial'

    // Obter todos os membros ativos para notificar
    let users = []
    try {
      users = $app.findRecordsByFilter('users', "status != 'suspended'", 'name', 100, 0)
    } catch (findErr) {
      console.warn('Erro ao buscar usuários para notificação de novo evento:', findErr)
      return
    }

    const subject = `📅 Novo Evento Confirmado: ${title} | Edvanced Business Club`
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
            .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .event-title { font-size: 18px; font-weight: 800; color: #06242E; margin: 8px 0 16px 0; }
            .detail-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
            .detail-item { font-size: 13px; color: #334155; margin-bottom: 8px; }
            .footer { background: #03151B; padding: 20px 24px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>EDVANCED BUSINESS CLUB</h1>
              <p>Ecossistema de Alta Governança</p>
            </div>
            <div class="content">
              <span class="badge">Novo Evento Agendado</span>
              <p style="font-size: 14px; line-height: 1.6;">Olá, <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6;">Um novo evento oficial foi adicionado ao calendário do Edvanced Business Club. Confira as informações e garanta sua participação:</p>
              
              <div class="event-title">${title}</div>
              ${eventName ? `<p style="font-size: 12px; font-weight: bold; color: #8C6D07; margin-top: -10px; margin-bottom: 12px;">Série: ${eventName}</p>` : ''}
              
              <div class="detail-card">
                ${dateStr ? `<div class="detail-item"><strong>🗓 Data:</strong> ${dateStr}</div>` : ''}
                ${location ? `<div class="detail-item"><strong>📍 Local:</strong> ${location}</div>` : ''}
                <div class="detail-item"><strong>🏷 Formato:</strong> ${formatType}</div>
                <div class="detail-item" style="margin-bottom: 0;"><strong>💳 Inscrição:</strong> ${pricing === 'pago' ? 'Pago' : 'Inclusa / Gratuita'}</div>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Acesse a plataforma de membros ou o portal público para conferir o cronograma completo e links de inscrição.</p>
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
        console.log(`[E-mail Enviado] Notificação de novo evento enviada para ${email}`)
      } catch (sendErr) {
        console.warn(
          `[E-mail Log] Falha ou simulação de envio de novo evento para ${email}:`,
          sendErr,
        )
      }
    }
  } catch (globalErr) {
    console.error('Erro no hook on_meeting_created:', globalErr)
  }
}, 'meetings')
