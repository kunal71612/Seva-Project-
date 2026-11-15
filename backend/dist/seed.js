"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = __importDefault(require("node:crypto"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function hashPassword(password) {
    const salt = node_crypto_1.default.randomBytes(16).toString('hex');
    const derivedKey = node_crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return `scrypt:${salt}:${derivedKey}`;
}
function verifyPassword(password, storedHash) {
    if (storedHash.startsWith('scrypt:')) {
        const [, salt, originalKey] = storedHash.split(':');
        const derivedKey = node_crypto_1.default.scryptSync(password, salt, 64).toString('hex');
        return node_crypto_1.default.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(originalKey, 'hex'));
    }
    // Fallback for legacy sha256 hashes during development/migration
    const legacyHash = node_crypto_1.default.createHash('sha256').update(password).digest('hex');
    return legacyHash === storedHash;
}
const sha256 = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
async function seed() {
    console.log('Seeding OneMind database with demo data...');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@onemind.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    // 1. Upsert Admin User
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            passwordHash: hashPassword(adminPassword),
        },
        create: {
            name: 'System Administrator',
            email: adminEmail,
            passwordHash: hashPassword(adminPassword),
            role: 'ADMIN',
        },
    });
    console.log(`Admin user seeded: ${admin.email}`);
    // 2. Upsert Demo Examination
    let exam = await prisma.examination.findFirst({
        where: { title: 'Seva Aptitude Demo' },
    });
    if (!exam) {
        exam = await prisma.examination.create({
            data: {
                title: 'Seva Aptitude Demo',
                description: 'Demonstration entrance assessment for offline continuity and local response resilience.',
                durationMinutes: 25,
                status: 'ACTIVE',
                questions: {
                    create: [
                        {
                            order: 1,
                            text: 'Which number comes next in the sequence: 2, 6, 12, 20, ?',
                            options: {
                                create: [
                                    { order: 1, text: '28', isCorrect: false },
                                    { order: 2, text: '30', isCorrect: true },
                                    { order: 3, text: '32', isCorrect: false },
                                    { order: 4, text: '36', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 2,
                            text: 'In an offline examination center, when the primary internet uplink disconnects, what should the client do?',
                            options: {
                                create: [
                                    { order: 1, text: 'Immediately terminate the session and discard answers', isCorrect: false },
                                    { order: 2, text: 'Queue responses locally and continue the examination seamlessly', isCorrect: true },
                                    { order: 3, text: 'Freeze the user screen until central cloud responds', isCorrect: false },
                                    { order: 4, text: 'Display an unrecoverable fatal error message', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 3,
                            text: 'If Standby Node B experiences a hardware failure, why must response acknowledgements be safely paused?',
                            options: {
                                create: [
                                    { order: 1, text: 'To prevent un-replicated data loss during subsequent single-point failures', isCorrect: true },
                                    { order: 2, text: 'Because Node A cannot write to SQLite without Node B', isCorrect: false },
                                    { order: 3, text: 'To delete candidate submissions automatically', isCorrect: false },
                                    { order: 4, text: 'Because candidate timers cannot tick without standby servers', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 4,
                            text: 'A candidate completes 3 tasks in 4 hours. At the same pace, how long will 6 tasks take?',
                            options: {
                                create: [
                                    { order: 1, text: '6 hours', isCorrect: false },
                                    { order: 2, text: '7 hours', isCorrect: false },
                                    { order: 3, text: '8 hours', isCorrect: true },
                                    { order: 4, text: '9 hours', isCorrect: false },
                                ],
                            },
                        },
                        {
                            order: 5,
                            text: 'Which cryptographic algorithm is used in OneMind to construct verifiable hash chains for audit trails?',
                            options: {
                                create: [
                                    { order: 1, text: 'MD5', isCorrect: false },
                                    { order: 2, text: 'SHA-256', isCorrect: true },
                                    { order: 3, text: 'DES', isCorrect: false },
                                    { order: 4, text: 'RC4', isCorrect: false },
                                ],
                            },
                        },
                    ],
                },
            },
            include: { questions: { include: { options: true } } },
        });
        console.log(`Demo examination seeded: ${exam.title} (${exam.id})`);
    }
    // 3. Upsert Demo Candidates
    const demoCandidates = [
        { registrationId: 'CAND-101', name: 'Aisha Rahman', email: 'cand101@demo.local' },
        { registrationId: 'CAND-102', name: 'Mehul Nair', email: 'cand102@demo.local' },
        { registrationId: 'CAND-103', name: 'Priya Sharma', email: 'cand103@demo.local' },
    ];
    for (const demoCand of demoCandidates) {
        const user = await prisma.user.upsert({
            where: { email: demoCand.email },
            update: {
                passwordHash: hashPassword('Candidate@123'),
            },
            create: {
                name: demoCand.name,
                email: demoCand.email,
                passwordHash: hashPassword('Candidate@123'),
                role: 'CANDIDATE',
            },
        });
        const candidate = await prisma.candidate.upsert({
            where: { registrationId: demoCand.registrationId },
            update: { userId: user.id },
            create: {
                userId: user.id,
                registrationId: demoCand.registrationId,
            },
        });
        await prisma.examAssignment.upsert({
            where: { examId_candidateId: { examId: exam.id, candidateId: candidate.id } },
            update: {},
            create: {
                examId: exam.id,
                candidateId: candidate.id,
                status: 'ASSIGNED',
            },
        });
        console.log(`Candidate seeded: ${candidate.registrationId} (${demoCand.name})`);
    }
    // 4. Initialize Node Health
    const nodes = [
        { nodeName: 'Cloud', status: 'ONLINE', message: 'Central cloud uplink connected.' },
        { nodeName: 'Node A', status: 'ONLINE', message: 'Primary local examination node active.' },
        { nodeName: 'Node B', status: 'ONLINE', message: 'Standby replication node healthy.' },
        { nodeName: 'Node C', status: 'ONLINE', message: 'Quorum witness node synchronized.' },
    ];
    for (const node of nodes) {
        await prisma.nodeHealth.upsert({
            where: { nodeName: node.nodeName },
            update: { status: node.status, message: node.message },
            create: { nodeName: node.nodeName, status: node.status, message: node.message },
        });
    }
    // 5. Initial Genesis Audit Event
    const existingAudit = await prisma.auditEvent.findFirst();
    if (!existingAudit) {
        const eventId = node_crypto_1.default.randomUUID();
        const type = 'SYSTEM_INITIALIZED';
        const details = 'OneMind examination continuity platform seeded and initialized for Seva Innovation Challenge 2026.';
        const previousHash = 'GENESIS';
        const currentHash = sha256(`${eventId}|${type}|${details}|${previousHash}|system|none`);
        await prisma.auditEvent.create({
            data: {
                eventId,
                type,
                details,
                previousHash,
                currentHash,
            },
        });
        console.log('Genesis audit event created.');
    }
    console.log('Seeding completed successfully!');
}
seed()
    .catch((err) => {
    console.error('Seed error:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
