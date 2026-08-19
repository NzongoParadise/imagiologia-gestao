import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("admin123", 10);
  const admin = await prisma.utilizador.upsert({
    where: { email: "admin@imagiologia.pt" },
    update: {},
    create: {
      nome: "Administrador",
      email: "admin@imagiologia.pt",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✓ Admin user created: ${admin.email} (password: admin123)`);

  // Create technician user
  const tecPassword = await hash("tecnico123", 10);
  const tecnico = await prisma.utilizador.upsert({
    where: { email: "tecnico@imagiologia.pt" },
    update: {},
    create: {
      nome: "Técnico Principal",
      email: "tecnico@imagiologia.pt",
      password: tecPassword,
      role: "TECNICO",
    },
  });
console.log(`✓ Technician user created: ${tecnico.email} (password: tecnico123)`);

  // Create doctor (Médico) user
  const medicoPassword = await hash("medico123", 10);
  const medico = await prisma.utilizador.upsert({
    where: { email: "medico@imagiologia.pt" },
    update: {},
    create: {
      nome: "Dr. Francisco Antunes",
      email: "medico@imagiologia.pt",
      password: medicoPassword,
      role: "MEDICO",
    },
  });
  console.log(`✓ Doctor user created: ${medico.email} (password: medico123)`);

  // Create exam types
  const examTypes = [
    { nome: "Ressonância Magnética Crânio", modalidade: "Ressonância Magnética", duracaoMin: 45, preco: 250 },
    { nome: "Ressonância Magnética Coluna", modalidade: "Ressonância Magnética", duracaoMin: 40, preco: 230 },
    { nome: "TC Crânio", modalidade: "Tomografia Computorizada", duracaoMin: 20, preco: 180 },
    { nome: "TC Abdómen", modalidade: "Tomografia Computorizada", duracaoMin: 25, preco: 200 },
    { nome: "Raio-X Tórax", modalidade: "Raio-X", duracaoMin: 10, preco: 40 },
    { nome: "Raio-X Membros", modalidade: "Raio-X", duracaoMin: 10, preco: 35 },
    { nome: "Ecografia Abdominal", modalidade: "Ecografia", duracaoMin: 30, preco: 120 },
    { nome: "Ecografia Mamária", modalidade: "Ecografia", duracaoMin: 25, preco: 110 },
    { nome: "Mamografia Digital", modalidade: "Mamografia", duracaoMin: 20, preco: 90 },
    { nome: "Densitometria Óssea", modalidade: "Densitometria Óssea", duracaoMin: 15, preco: 70 },
  ];

  for (const examType of examTypes) {
    await prisma.tipoExame.upsert({
      where: { nome: examType.nome },
      update: {},
      create: examType,
    });
  }
  console.log(`✓ ${examTypes.length} exam types created`);

  // Create technicians
  const technicians = [
    { nome: "Carlos Silva", email: "carlos@imagiologia.pt", telefone: "912345678", especialidade: "Ressonância Magnética" },
    { nome: "Ana Martins", email: "ana@imagiologia.pt", telefone: "923456789", especialidade: "Tomografia Computorizada" },
    { nome: "Rui Santos", email: "rui@imagiologia.pt", telefone: "934567890", especialidade: "Raio-X" },
  ];

  for (const tech of technicians) {
    const existing = await prisma.tecnico.findFirst({ where: { email: tech.email } });
    if (!existing) {
      await prisma.tecnico.create({ data: tech });
    }
  }
  console.log(`✓ ${technicians.length} technicians created`);

  // Create origins
  const origins = [
    { nome: "Consulta Externa", descricao: "Utentes referenciados por consulta externa" },
    { nome: "Urgência", descricao: "Utentes do serviço de urgência" },
    { nome: "Internamento", descricao: "Utentes internados" },
    { nome: "Medicina Geral e Familiar", descricao: "Referenciados pelos MGF" },
    { nome: "Particular", descricao: "Utentes particulares" },
  ];

  for (const origin of origins) {
    await prisma.procedencia.upsert({
      where: { nome: origin.nome },
      update: {},
      create: origin,
    });
  }
  console.log(`✓ ${origins.length} origins created`);

  // Create sample patients with numeroProcesso
  const patients = [
    { numeroProcesso: "P-0001", nome: "Maria João Oliveira", dataNascimento: new Date("1985-03-15"), sexo: "Feminino", telefone: "961234567", email: "maria@email.com", nif: "123456789", endereco: "Rua A, nº 123", documento: "BI-123456" },
    { numeroProcesso: "P-0002", nome: "António Silva", dataNascimento: new Date("1972-08-22"), sexo: "Masculino", telefone: "962345678", email: "antonio@email.com", nif: "987654321", endereco: "Rua B, nº 456" },
    { numeroProcesso: "P-0003", nome: "Sofia Rodrigues", dataNascimento: new Date("1990-11-02"), sexo: "Feminino", telefone: "963456789", nif: "456789123" },
    { numeroProcesso: "P-0004", nome: "João Ferreira", dataNascimento: new Date("1965-05-10"), sexo: "Masculino", telefone: "964567890", nif: "321654987" },
    { numeroProcesso: "P-0005", nome: "Carla Mendes", dataNascimento: new Date("1995-07-30"), sexo: "Feminino", telefone: "965678901", email: "carla@email.com" },
  ];

  for (const patient of patients) {
    await prisma.paciente.upsert({
      where: { numeroProcesso: patient.numeroProcesso },
      update: {},
      create: patient,
    });
  }
  console.log(`✓ ${patients.length} patients created`);

  // Create sample exams
  const examTypesList = await prisma.tipoExame.findMany();
  const tecnicosList = await prisma.tecnico.findMany();
  const procedenciasList = await prisma.procedencia.findMany();
  const pacientesList = await prisma.paciente.findMany();

  const estados = ["Pendente", "Em andamento", "Realizado", "Entregue"];

  for (let i = 0; i < 10; i++) {
    const randomPatient = pacientesList[Math.floor(Math.random() * pacientesList.length)];
    const randomExamType = examTypesList[Math.floor(Math.random() * examTypesList.length)];
    const randomTecnico = tecnicosList[Math.floor(Math.random() * tecnicosList.length)];
    const randomProcedencia = procedenciasList[Math.floor(Math.random() * procedenciasList.length)];
    const randomEstado = estados[Math.floor(Math.random() * estados.length)];

    const examDate = new Date();
    examDate.setDate(examDate.getDate() - Math.floor(Math.random() * 30));
    const codigo = `EXM-${String(i + 1).padStart(4, "0")}`;

await prisma.exame.upsert({
      where: { codigo },
      update: {},
      create: {
        codigo,
        pacienteId: randomPatient.id,
        tipoExameId: randomExamType.id,
        tecnicoId: randomTecnico.id,
        procedenciaId: randomProcedencia.id,
        medicoSolicitante: `Dr. ${["Francisco", "Isabel", "Miguel", "Patrícia"][Math.floor(Math.random() * 4)]}`,
        observacao: `Exame de rotina - ${randomExamType.nome}`,
        estado: randomEstado,
        dataExame: examDate,
        realizadoPorId: admin.id,
      },
    });
  }
  console.log(`✓ 10 sample exams created`);

// Create specialties (consultas)
  const especialidades = [
    { nome: "Medicina Geral", descricao: "Consulta de medicina geral e familiar" },
    { nome: "Pediatria", descricao: "Consulta de pediatria" },
    { nome: "Cardiologia", descricao: "Consulta de cardiologia" },
    { nome: "Ginecologia", descricao: "Consulta de ginecologia e obstetrícia" },
    { nome: "Ortopedia", descricao: "Consulta de ortopedia e traumatologia" },
    { nome: "Dermatologia", descricao: "Consulta de dermatologia" },
    { nome: "Oftalmologia", descricao: "Consulta de oftalmologia" },
    { nome: "Otorrinolaringologia", descricao: "Consulta de ORL" },
    { nome: "Medicina Interna", descricao: "Consulta de medicina interna" },
    { nome: "Neurologia", descricao: "Consulta de neurologia" },
  ];

  for (const esp of especialidades) {
    await prisma.especialidade.upsert({
      where: { nome: esp.nome },
      update: {},
      create: esp,
    });
  }
  console.log(`✓ ${especialidades.length} specialties created`);

  // Create consultorios
  const espList = await prisma.especialidade.findMany();
  const espMap = new Map(espList.map((e) => [e.nome, e.id]));

  const consultoriosPadrao = [
    { numero: "Cons-01", nome: "Consultório de Medicina Geral", especialidadeId: espMap.get("Medicina Geral") || null, bloco: "Bloco A", andar: "Piso 1", capacidade: 1 },
    { numero: "Cons-02", nome: "Consultório de Pediatria", especialidadeId: espMap.get("Pediatria") || null, bloco: "Bloco A", andar: "Piso 1", capacidade: 1 },
    { numero: "Cons-03", nome: "Consultório de Cardiologia", especialidadeId: espMap.get("Cardiologia") || null, bloco: "Bloco B", andar: "Piso 2", capacidade: 1 },
    { numero: "Cons-04", nome: "Consultório de Ginecologia", especialidadeId: espMap.get("Ginecologia") || null, bloco: "Bloco B", andar: "Piso 2", capacidade: 1 },
    { numero: "Cons-05", nome: "Consultório de Ortopedia", especialidadeId: espMap.get("Ortopedia") || null, bloco: "Bloco C", andar: "Piso 1", capacidade: 1 },
    { numero: "Cons-06", nome: "Consultório de Dermatologia", especialidadeId: espMap.get("Dermatologia") || null, bloco: "Bloco B", andar: "Piso 1", capacidade: 1 },
    { numero: "Cons-07", nome: "Consultório de Oftalmologia", especialidadeId: espMap.get("Oftalmologia") || null, bloco: "Bloco C", andar: "Piso 2", capacidade: 1 },
    { numero: "Cons-08", nome: "Consultório Multidisciplinar", especialidadeId: null, bloco: "Bloco Central", andar: "Piso 1", capacidade: 1 },
  ];

  for (const c of consultoriosPadrao) {
    await prisma.consultorio.upsert({
      where: { numero: c.numero },
      update: {
        nome: c.nome,
        especialidadeId: c.especialidadeId,
        bloco: c.bloco,
        andar: c.andar,
        capacidade: c.capacidade,
      },
      create: {
        ...c,
        criadoPorId: admin.id,
      },
    });
  }
  console.log(`✓ ${consultoriosPadrao.length} consultorios created`);

  // Create urgency banks (BUM | BUP | BUCO)
  const bancosUrgencia = [
    { nome: "Banco de Urgência Médica", tipo: "BUM", descricao: "Urgências clínicas médicas" },
    { nome: "Banco de Urgência Pediátrica", tipo: "BUP", descricao: "Urgências pediátricas" },
    { nome: "Banco de Urgência Cirúrgica e Ortopédica", tipo: "BUCO", descricao: "Urgências cirúrgicas e ortopédicas" },
  ];

  for (const bu of bancosUrgencia) {
    await prisma.bancoUrgencia.upsert({
      where: { nome: bu.nome },
      update: {},
      create: bu,
    });
  }
  console.log(`✓ ${bancosUrgencia.length} urgency banks created`);

  // Create risk classifications (triagem Manchester)
  const classificacoes = [
    { nome: "Vermelho", cor: "vermelho", nivel: 5, descricao: "Emergência — risco de vida imediato", tempoMaximo: 0 },
    { nome: "Laranja", cor: "laranja", nivel: 4, descricao: "Muito urgente — situação grave", tempoMaximo: 10 },
    { nome: "Amarelo", cor: "amarelo", nivel: 3, descricao: "Urgente — situação moderada", tempoMaximo: 60 },
    { nome: "Verde", cor: "verde", nivel: 2, descricao: "Pouco urgente — situação ligeira", tempoMaximo: 120 },
    { nome: "Azul", cor: "azul", nivel: 1, descricao: "Não urgente — problema menor", tempoMaximo: 240 },
  ];

  for (const cl of classificacoes) {
    await prisma.classificacaoRisco.upsert({
      where: { nome: cl.nome },
      update: {},
      create: cl,
    });
  }
  console.log(`✓ ${classificacoes.length} risk classifications created`);

  // Create default configurations
  const defaultConfiguracoes: Record<string, string> = {
    hospital_nome: "Hospital Geral do Uíge",
    unidade_nome: "Unidade de Imagiologia",
    idioma: "Português",
    notificacao_email: "true",
    notificacao_sms: "false",
    notif_exame_criado: "true",
    notif_exame_realizado: "true",
    seguranca_session_timeout: "60",
    seguranca_max_attempts: "5",
    seguranca_two_factor: "false",
    aparencia_tema: "system",
    aparencia_compacto: "false",
  };

  for (const [chave, valor] of Object.entries(defaultConfiguracoes)) {
    await prisma.configuracao.upsert({
      where: { chave },
      update: {},
      create: { chave, valor },
    });
  }
  console.log(`✓ ${Object.keys(defaultConfiguracoes).length} default configurations created`);

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n📋 Login credentials:");
console.log("   Admin:  admin@imagiologia.pt / admin123");
  console.log("   Técnico: tecnico@imagiologia.pt / tecnico123");
  console.log("   Médico:  medico@imagiologia.pt / medico123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

