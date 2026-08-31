onRecordAfterCreateSuccess((e) => {
  try {
    const record = e.record
    if (!record) return

    // Se o usuário criado ainda não estiver marcado como verificado, atualiza diretamente
    if (!record.verified()) {
      $app
        .db()
        .newQuery('UPDATE users SET verified = 1 WHERE id = {:id}')
        .bind({ id: record.id })
        .execute()
    }
  } catch (err) {
    console.warn('Erro ao auto-verificar usuário após criação em onRecordAfterCreateSuccess:', err)
  }
}, 'users')
