onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    const title = record.getString('title') || 'Novo Material Exclusivo'
    const type = record.getString('type') || 'document'
    const description = record.getString('description') || ''

    let users = []
    try {
      users = $app.findRecordsByFilter('users', "status != 'suspended'", 'name', 100, 0)
    } catch (findErr) {
      console.warn('Erro ao buscar usuários para notificação de novo material:', findErr)
      return
    }

    const typeLabels = {
      photo: 'Fotos Oficiais',
      video: 'Gravação em Vídeo',
      document: 'Apresentação / Documento',
    }
    const typeLabel = typeLabels[type] || 'Material'

    const subject = `📚 Novo Material Disponível: ${title} | Edvanced Business Club`
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
            .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; background: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
            .material-title { font-size: 18px; font-weight: 800; color: #06242E; margin: 8px 0 16px 0; }
            .detail-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 16px 0; }
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
              <span class="badge">Novo Material do Acervo</span>
              <p style="font-size: 14px; line-height: 1.6;">Olá, <strong>${userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.6;">Um novo conteúdo exclusivo acaba de ser disponibilizado na biblioteca executiva do Club:</p>
              
              <div class="material-title">${title}</div>
              
              <div class="detail-card">
                <div style="font-size: 13px; color: #334155; margin-bottom: 6px;"><strong>📁 Tipo:</strong> ${typeLabel}</div>
                ${description ? `<div style="font-size: 13px; color: #475569; line-height: 1.5;">${description}</div>` : ''}
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Faça login na plataforma VIP para baixar os arquivos, acessar os slides ou assistir aos vídeos em alta definição.</p>
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
        console.log(`[E-mail Enviado] Notificação de novo material enviada para ${email}`)
      } catch (sendErr) {
        console.warn(
          `[E-mail Log] Falha ou simulação de envio de novo material para ${email}:`,
          sendErr,
        )
      }
    }
  } catch (globalErr) {
    console.error('Erro no hook on_material_created:', globalErr)
  }
}, 'materials')
