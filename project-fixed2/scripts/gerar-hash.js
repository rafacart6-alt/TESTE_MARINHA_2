// scripts/gerar-hash.js
// Uso: node scripts/gerar-hash.js <senha>
// Exemplo: node scripts/gerar-hash.js minhasenha123

const bcrypt = require('bcryptjs');

const senha = process.argv[2];

if (!senha) {
  console.error('\n  ❌  Informe a senha como argumento.');
  console.error('  Uso: node scripts/gerar-hash.js <sua_senha>\n');
  process.exit(1);
}

if (senha.length < 8) {
  console.error('\n  ❌  A senha deve ter ao menos 8 caracteres.\n');
  process.exit(1);
}

(async () => {
  const hash = await bcrypt.hash(senha, 12);
  console.log('\n  ✅  Hash gerado com sucesso!\n');
  console.log('  Cole no Vercel → Settings → Environment Variables:\n');
  console.log(`  HASH_<NOME_USUARIO>=${hash}\n`);
  console.log('  ─────────────────────────────────────────────────────');
  console.log(`  Hash: ${hash}\n`);
})();
