migrate(
  (app) => {
    // Cria o membro de teste Jessica Fabri da Silva se ainda não existir
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'contatoedvanced@gmail.com')
      return // já existe
    } catch (_) {}

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const record = new Record(users)
    record.setEmail('contatoedvanced@gmail.com')
    record.setPassword('Edvanced2026@')
    record.setVerified(true)
    record.set('name', 'Jessica Fabri da Silva')
    record.set('company', 'Edvanced Consultoria & Desenvolvimento')
    record.set('phone', '(65) 98131-7616')
    record.set('instagram', 'jessica.fabriii')
    record.set('role', 'member')
    record.set('status', 'active')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'contatoedvanced@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)
