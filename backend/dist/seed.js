"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_crypto_1 = __importDefault(require("node:crypto"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const sha256 = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
async function seed() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@onemind.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: 'System Administrator',
            email: adminEmail,
            passwordHash: sha256(adminPassword),
            role: 'ADMIN',
        },
    });
    let exam = await prisma.examination.findFirst({
        where: { title: 'Seva Aptitude Demo' },
    });
    if (!exam) {
        exam = await prisma.examination.create({
            data: {
                title: 'Seva Aptitude Demo',
                description: 'A sample aptitude and reasoning assessment for offline continuity demonstration.',
                durationMinutes: 25,
                status: 'ACTIVE',
                questions: {
                    create: [
                        {
                            order: 1,
                            text: 'Which number comes next in the sequence: 2, 6, 12, 20, ?',
                            options: {
                                create: [
                                    { order: 1, text: '28', isCorrect: true },
                                    { order: 2, text: '30', isCorrect: false },
                                    { order: 3, text: '32', isCorrect: false },
                                    { order: 4, text: '36', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 2,
                            text: 'If all roses are flowers and some flowers fade quickly, which statement is logically valid?',
                            options: {
                                create: [
                                    { order: 1, text: 'All roses fade quickly.', isCorrect: false },
                                    { order: 2, text: 'Some roses fade quickly.', isCorrect: false },
                                    { order: 3, text: 'Some flowers are roses.', isCorrect: true },
                                    { order: 4, text: 'No flowers are roses.', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 3,
                            text: 'A candidate completes 3 tasks in 4 hours. At the same pace, how long will 5 tasks take?',
                            options: {
                                create: [
                                    { order: 1, text: '6 hours 40 minutes', isCorrect: true },
                                    { order: 2, text: '7 hours', isCorrect: false },
                                    { order: 3, text: '5 hours 30 minutes', isCorrect: false },
                                    { order: 4, text: '8 hours', isCorrect: false },
                                ],
                            },
                        },
                    ],
                },
            },
            include: { questions: { include: { options: true } } },
        });
    }
    for (const registrationId of ['CAND-101', 'CAND-102']) {
        const userEmail = `${registrationId.toLowerCase()}@demo.local`;
        const user = await prisma.user.upsert({
            where: { email: userEmail },
            update: {},
            create: {
                name: registrationId === 'CAND-101' ? 'Aisha Rahman' : 'Mehul Nair',
                email: userEmail,
                passwordHash: sha256('Candidate@123'),
                role: 'CANDIDATE',
            },
        });
        const candidate = await prisma.candidate.upsert({
            where: { registrationId },
            update: { userId: user.id },
            create: { userId: user.id, registrationId },
        });
        await prisma.examAssignment.upsert({
            where: { examId_candidateId: { examId: exam.id, candidateId: candidate.id } },
            update: {},
            create: { examId: exam.id, candidateId: candidate.id, status: 'ASSIGNED' },
        });
    }
    const nodes = [
        { nodeName: 'Cloud', status: 'ONLINE', message: 'Cloud connectivity available.' },
        { nodeName: 'Node A', status: 'ONLINE', message: 'Primary server healthy.' },
        { nodeName: 'Node B', status: 'ONLINE', message: 'Standby server healthy.' },
        { nodeName: 'Node C', status: 'ONLINE', message: 'Witness node validated.' },
    ];
    for (const item of nodes) {
        await prisma.nodeHealth.upsert({
            where: { nodeName: item.nodeName },
            update: { status: item.status, message: item.message },
            create: { nodeName: item.nodeName, status: item.status, message: item.message },
        });
    }
    console.log('Seed data loaded successfully.');
}
seed().finally(async () => {
    await prisma.$disconnect();
});
