onRecordAfterUpdateSuccess((e) => {
  try {
    const record = e.record
    const original = record.original()

    const newStatus = record.getString('status')
    const oldStatus = original ? original.getString('status') : ''

    // Only notify when status actually changes to approved or rejected
    if (newStatus !== oldStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
      const memberId = record.getString('member')
      if (!memberId) return

      let memberRecord
      try {
        memberRecord = $app.findRecordById('users', memberId)
      } catch (err) {
        console.warn('Erro ao buscar membro para envio de email da divulgação:', err)
        return
      }

      const recipientEmail = memberRecord.email()
      const memberName = memberRecord.getString('name') || 'Membro'
      const title = record.getString('title') || 'Divulgação'
      const adminFeedback = record.getString('admin_feedback') || ''

      const isApproved = newStatus === 'approved'
      const subject = isApproved
        ? '✅ Sua divulgação foi aprovada no Edvanced Business Club!'
        : '⚠️ Atualização sobre sua divulgação no Edvanced Business Club'

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
            .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
            .badge-approved { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
            .badge-rejected { background: #ffe4e6; color: #be123c; border: 1px solid #fda4af; }
            .title-box { font-size: 16px; font-weight: bold; color: #06242E; margin-bottom: 16px; padding: 12px; background: #f8fafc; border-left: 4px solid #D4AF37; border-radius: 4px; }
            .feedback-box { background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 14px; margin: 16px 0; color: #9f1239; font-size: 13px; line-height: 1.5; }
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
              <span class="badge ${isApproved ? 'badge-approved' : 'badge-rejected'}">
                ${isApproved ? 'Divulgação Aprovada' : 'Ajustes Necessários'}
              </span>
              <p style="font-size: 14px; line-height: 1.6;">Olá, <strong>${memberName}</strong>,</p>
              ${
                isApproved
                  ? `<p style="font-size: 14px; line-height: 1.6;">Temos o prazer de informar que sua solicitação de divulgação <strong>"${title}"</strong> foi aprovada pela diretoria e já está visível para todo o ecossistema de membros no mural e no calendário VIP do Club.</p>`
                  : `<p style="font-size: 14px; line-height: 1.6;">Sua solicitação de divulgação <strong>"${title}"</strong> foi revisada pela moderação e requer ajustes antes de ser publicada para os membros.</p>`
              }
              <div class="title-box">
                ${title}
              </div>
              ${
                !isApproved && adminFeedback
                  ? `
                <div class="feedback-box">
                  <strong>Feedback da Moderação:</strong><br/>
                  ${adminFeedback}
                </div>
                <p style="font-size: 13px; color: #64748b;">Você pode ajustar as informações da sua divulgação na plataforma e submeter novamente para avaliação.</p>
              `
                  : ''
              }
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
          from: {
            address: $app.settings().meta.senderAddress || 'no-reply@edvanced.com.br',
            name: $app.settings().meta.senderName || 'Edvanced Business Club',
          },
          to: [{ address: recipientEmail, name: memberName }],
          subject: subject,
          html: htmlBody,
        })

        $app.newMailClient().send(message)
        console.log(
          `[E-mail Enviado] Notificação de status de divulgação enviada para ${recipientEmail}`,
        )
      } catch (sendErr) {
        console.warn(
          `[E-mail Log] Tentativa de envio para ${recipientEmail} registrada (SMTP pode não estar ativo):`,
          sendErr,
        )
      }
    }
  } catch (globalErr) {
    console.error('Erro no hook on_disclosure_status_change:', globalErr)
  }
}, 'disclosures')
