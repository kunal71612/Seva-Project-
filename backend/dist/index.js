"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const node_crypto_1 = __importDefault(require("node:crypto"));
const node_crypto_2 = require("node:crypto");
const client_1 = require("@prisma/client");
const nodeStates = ['ONLINE', 'OFFLINE', 'DEGRADED'];
dotenv_1.default.config({ path: node_path_1.default.resolve(__dirname, '../.env') });
const prisma = new client_1.PrismaClient();
const app = (0, express_1.default)();
const port = Number(process.env.PORT || 4000);
const systemState = {
    internetConnected: true,
    nodeA: 'ONLINE',
    nodeB: 'ONLINE',
    nodeC: 'ONLINE',
};
const sha256 = (value) => node_crypto_1.default.createHash('sha256').update(value).digest('hex');
async function writeAuditEvent({ type, details, candidateId, sessionId, examId, }) {
    const lastEvent = sessionId
        ? await prisma.auditEvent.findFirst({
            where: { sessionId },
            orderBy: { createdAt: 'desc' },
        })
        : null;
    const previousHash = lastEvent?.currentHash ?? 'GENESIS';
    const eventId = (0, node_crypto_2.randomUUID)();
    const currentHash = sha256(`${eventId}|${type}|${details}|${previousHash}|${candidateId ?? 'system'}|${sessionId ?? 'none'}`);
    await prisma.auditEvent.create({
        data: {
            eventId,
            type,
            details,
            candidateId: candidateId ?? null,
            sessionId: sessionId ?? null,
            examId: examId ?? null,
            previousHash,
            currentHash,
        },
    });
    return { eventId, previousHash, currentHash };
}
async function ensureNodeHealthRecords() {
    const nodes = [
        { nodeName: 'Cloud', status: 'ONLINE', message: 'Cloud connectivity available.' },
        { nodeName: 'Node A', status: 'ONLINE', message: 'Primary server healthy.' },
        { nodeName: 'Node B', status: 'ONLINE', message: 'Standby server healthy.' },
        { nodeName: 'Node C', status: 'ONLINE', message: 'Witness node validated.' },
    ];
    for (const node of nodes) {
        await prisma.nodeHealth.upsert({
            where: { nodeName: node.nodeName },
            update: {
                status: node.status,
                message: node.message,
            },
            create: {
                nodeName: node.nodeName,
                status: node.status,
                message: node.message,
            },
        });
    }
}
async function ensureDemoData() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@onemind.local';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const admin = await prisma.user.upsert({
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
    const candidateRegistrations = ['CAND-101', 'CAND-102'];
    for (const registrationId of candidateRegistrations) {
        let candidateUser = await prisma.user.findFirst({
            where: { email: `${registrationId.toLowerCase()}@demo.local` },
        });
        if (!candidateUser) {
            candidateUser = await prisma.user.create({
                data: {
                    name: registrationId === 'CAND-101' ? 'Aisha Rahman' : 'Mehul Nair',
                    email: `${registrationId.toLowerCase()}@demo.local`,
                    passwordHash: sha256('Candidate@123'),
                    role: 'CANDIDATE',
                },
            });
        }
        let candidate = await prisma.candidate.findUnique({
            where: { registrationId },
        });
        if (!candidate) {
            candidate = await prisma.candidate.create({
                data: {
                    userId: candidateUser.id,
                    registrationId,
                },
            });
        }
        await prisma.examAssignment.upsert({
            where: { examId_candidateId: { examId: exam.id, candidateId: candidate.id } },
            update: {},
            create: {
                examId: exam.id,
                candidateId: candidate.id,
                status: 'ASSIGNED',
            },
        });
        const existingSession = await prisma.examSession.findFirst({
            where: {
                examId: exam.id,
                candidateId: candidate.id,
            },
        });
        if (!existingSession) {
            const session = await prisma.examSession.create({
                data: {
                    examId: exam.id,
                    candidateId: candidate.id,
                    status: 'ACTIVE',
                    currentQuestionIndex: 0,
                },
            });
            await writeAuditEvent({
                type: 'CANDIDATE_LOGIN',
                details: `Candidate ${registrationId} started the assessment.`,
                candidateId: candidate.id,
                sessionId: session.id,
                examId: exam.id,
            });
        }
    }
    await ensureNodeHealthRecords();
    const existingAudit = await prisma.auditEvent.findFirst();
    if (!existingAudit) {
        await writeAuditEvent({
            type: 'EXAMINATION_CREATED',
            details: 'The Seva demo examination was initialized for the offline continuity scenario.',
            examId: exam.id,
        });
    }
    const adminIsActive = await prisma.nodeHealth.findUnique({ where: { nodeName: 'Node A' } });
    if (adminIsActive) {
        systemState.nodeA = adminIsActive.status;
        systemState.nodeB = (await prisma.nodeHealth.findUnique({ where: { nodeName: 'Node B' } }))?.status ?? 'ONLINE';
        systemState.nodeC = (await prisma.nodeHealth.findUnique({ where: { nodeName: 'Node C' } }))?.status ?? 'ONLINE';
    }
    return { admin, exam };
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
});
app.post('/api/auth/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await prisma.user.findUnique({
        where: { email },
    });
    if (!user || user.role !== 'ADMIN' || user.passwordHash !== sha256(password)) {
        return res.status(401).json({ message: 'Invalid administrator credentials.' });
    }
    await writeAuditEvent({
        type: 'ADMIN_LOGIN',
        details: `Admin ${user.email} logged into the control panel.`,
        examId: undefined,
    });
    return res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});
app.post('/api/auth/candidate/login', async (req, res) => {
    const { registrationId } = req.body;
    if (!registrationId) {
        return res.status(400).json({ message: 'Registration ID is required.' });
    }
    const candidate = await prisma.candidate.findUnique({
        where: { registrationId: registrationId.toUpperCase() },
        include: {
            user: true,
            examAssignments: { include: { exam: true } },
        },
    });
    if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found for the provided registration ID.' });
    }
    const examAssignment = candidate.examAssignments[0];
    if (!examAssignment) {
        return res.status(404).json({ message: 'No examination assignment exists for this candidate.' });
    }
    const exam = examAssignment.exam;
    const questions = await prisma.question.findMany({
        where: { examId: exam.id },
        include: { options: true },
        orderBy: { order: 'asc' },
    });
    let session = await prisma.examSession.findFirst({
        where: { candidateId: candidate.id, examId: exam.id, status: 'ACTIVE' },
    });
    if (!session) {
        session = await prisma.examSession.create({
            data: {
                examId: exam.id,
                candidateId: candidate.id,
                status: 'ACTIVE',
                currentQuestionIndex: 0,
            },
        });
    }
    await writeAuditEvent({
        type: 'CANDIDATE_LOGIN',
        details: `Candidate ${candidate.registrationId} started a session for ${exam.title}.`,
        candidateId: candidate.id,
        sessionId: session.id,
        examId: exam.id,
    });
    return res.json({
        success: true,
        candidate: { id: candidate.id, name: candidate.user.name, registrationId: candidate.registrationId },
        sessionId: session.id,
        exam: {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            durationMinutes: exam.durationMinutes,
            status: exam.status,
            questions: questions.map((question) => ({
                id: question.id,
                text: question.text,
                order: question.order,
                options: question.options.map((option) => ({
                    id: option.id,
                    text: option.text,
                    order: option.order,
                })),
            })),
        },
    });
});
app.get('/api/admin/dashboard', async (_req, res) => {
    const [exams, candidates, totalSubmissions, auditEvents] = await Promise.all([
        prisma.examination.findMany({
            include: { questions: { include: { options: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.candidate.findMany({ include: { user: true } }),
        prisma.examSubmission.count(),
        prisma.auditEvent.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
        }),
    ]);
    res.json({
        exams,
        candidates: candidates.map((candidate) => ({
            id: candidate.id,
            name: candidate.user.name,
            registrationId: candidate.registrationId,
            email: candidate.user.email,
        })),
        totalSubmissions,
        auditEvents,
        systemState,
    });
});
app.post('/api/admin/exams', async (req, res) => {
    const { title, description, durationMinutes, questions } = req.body;
    if (!title || !description || !durationMinutes || !questions || questions.length === 0) {
        return res.status(400).json({ message: 'Exam title, description, duration, and questions are required.' });
    }
    const exam = await prisma.examination.create({
        data: {
            title,
            description,
            durationMinutes,
            status: 'ACTIVE',
            questions: {
                create: questions.map((question, questionIndex) => ({
                    order: questionIndex + 1,
                    text: question.text,
                    options: {
                        create: question.options.map((option, optionIndex) => ({
                            order: optionIndex + 1,
                            text: option.text,
                            isCorrect: Boolean(option.isCorrect),
                        })),
                    },
                })),
            },
        },
        include: { questions: { include: { options: true } } },
    });
    await writeAuditEvent({
        type: 'EXAMINATION_CREATED',
        details: `Admin created an examination named ${title}.`,
        examId: exam.id,
    });
    res.json({ success: true, exam });
});
app.post('/api/admin/candidates', async (req, res) => {
    const { name, email, registrationId, examId } = req.body;
    if (!name || !email || !registrationId || !examId) {
        return res.status(400).json({ message: 'Candidate name, email, registration ID, and exam ID are required.' });
    }
    const user = await prisma.user.upsert({
        where: { email },
        update: { name },
        create: {
            name,
            email,
            passwordHash: sha256('Candidate@123'),
            role: 'CANDIDATE',
        },
    });
    const candidate = await prisma.candidate.upsert({
        where: { registrationId: registrationId.toUpperCase() },
        update: { userId: user.id },
        create: { userId: user.id, registrationId: registrationId.toUpperCase() },
    });
    await prisma.examAssignment.upsert({
        where: { examId_candidateId: { examId, candidateId: candidate.id } },
        update: { status: 'ASSIGNED' },
        create: { examId, candidateId: candidate.id, status: 'ASSIGNED' },
    });
    await writeAuditEvent({
        type: 'CANDIDATE_REGISTERED',
        details: `${name} (${registrationId}) was registered to the exam.`,
        candidateId: candidate.id,
        examId,
    });
    res.json({ success: true, candidate: { id: candidate.id, registrationId: candidate.registrationId, name, email } });
});
app.get('/api/system-status', async (_req, res) => {
    const nodeHealth = await prisma.nodeHealth.findMany();
    res.json({
        internetConnected: systemState.internetConnected,
        nodeA: systemState.nodeA,
        nodeB: systemState.nodeB,
        nodeC: systemState.nodeC,
        nodeHealth,
        pauseActive: systemState.nodeB === 'OFFLINE',
    });
});
app.put('/api/system-status', async (req, res) => {
    const { internetConnected, nodeA, nodeB, nodeC } = req.body;
    if (typeof internetConnected === 'boolean') {
        systemState.internetConnected = internetConnected;
    }
    if (nodeA)
        systemState.nodeA = nodeA;
    if (nodeB)
        systemState.nodeB = nodeB;
    if (nodeC)
        systemState.nodeC = nodeC;
    const healthRecords = [
        { nodeName: 'Cloud', status: systemState.internetConnected ? 'ONLINE' : 'OFFLINE', message: systemState.internetConnected ? 'Cloud connectivity restored.' : 'Cloud connectivity unavailable.' },
        { nodeName: 'Node A', status: systemState.nodeA, message: systemState.nodeA === 'OFFLINE' ? 'Node A is unavailable.' : 'Node A is operating normally.' },
        { nodeName: 'Node B', status: systemState.nodeB, message: systemState.nodeB === 'OFFLINE' ? 'Standby node is unavailable; new responses are paused.' : 'Standby node available.' },
        { nodeName: 'Node C', status: systemState.nodeC, message: systemState.nodeC === 'OFFLINE' ? 'Witness node missing; quorum is degraded.' : 'Witness node healthy.' },
    ];
    for (const record of healthRecords) {
        await prisma.nodeHealth.upsert({
            where: { nodeName: record.nodeName },
            update: { status: record.status, message: record.message },
            create: { nodeName: record.nodeName, status: record.status, message: record.message },
        });
    }
    if (systemState.nodeB === 'OFFLINE') {
        await writeAuditEvent({
            type: 'NODE_FAILURE',
            details: 'Node B failed. The system paused new responses until the standby node is restored.',
        });
    }
    if (systemState.internetConnected && systemState.nodeB !== 'OFFLINE') {
        await writeAuditEvent({
            type: 'INTERNET_RESTORED',
            details: 'Cloud connectivity was restored and synchronization resumed.',
        });
    }
    res.json({ success: true, systemState, pauseActive: systemState.nodeB === 'OFFLINE' });
});
app.get('/api/audit', async (_req, res) => {
    const events = await prisma.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
    });
    res.json(events);
});
app.get('/api/exams', async (_req, res) => {
    const exams = await prisma.examination.findMany({
        include: { questions: { include: { options: true } }, assignments: true },
        orderBy: { createdAt: 'desc' },
    });
    res.json(exams);
});
app.get('/api/candidate/exam/:sessionId', async (req, res) => {
    const session = await prisma.examSession.findUnique({
        where: { id: req.params.sessionId },
        include: { exam: { include: { questions: { include: { options: true } } } }, candidate: { include: { user: true } } },
    });
    if (!session) {
        return res.status(404).json({ message: 'Exam session not found.' });
    }
    const latestResponses = await prisma.currentResponse.findMany({
        where: { candidateId: session.candidateId, examId: session.examId },
    });
    res.json({
        session,
        exam: session.exam,
        candidate: session.candidate.user,
        responses: latestResponses,
    });
});
app.post('/api/candidate/exam/:sessionId/response', async (req, res) => {
    const { questionId, answer } = req.body;
    const session = await prisma.examSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) {
        return res.status(404).json({ message: 'Session not found.' });
    }
    if (systemState.nodeB === 'OFFLINE') {
        return res.status(409).json({
            success: false,
            status: 'PAUSED',
            message: 'Node B is offline and the examination is paused. No new response may be acknowledged until redundancy is restored.',
        });
    }
    if (!questionId || !answer) {
        return res.status(400).json({ message: 'Question ID and answer are required.' });
    }
    const currentResponse = await prisma.currentResponse.findUnique({
        where: {
            current_response_unique: {
                candidateId: session.candidateId,
                examId: session.examId,
                questionId,
            },
        },
    });
    const sequenceNumber = (currentResponse?.version ?? 0) + 1;
    const eventId = (0, node_crypto_2.randomUUID)();
    const previousAudit = await prisma.auditEvent.findFirst({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'desc' },
    });
    const previousHash = previousAudit?.currentHash ?? 'GENESIS';
    const currentHash = sha256(`${eventId}|${questionId}|${answer}|${sequenceNumber}|${previousHash}`);
    const status = systemState.internetConnected ? 'ACKNOWLEDGED' : 'PENDING_SYNC';
    await prisma.$transaction(async (tx) => {
        await tx.responseEvent.create({
            data: {
                eventId,
                examId: session.examId,
                candidateId: session.candidateId,
                sessionId: session.id,
                questionId,
                answer,
                sequenceNumber,
                version: sequenceNumber,
                status,
                previousHash,
                currentHash,
                source: 'browser',
            },
        });
        await tx.currentResponse.upsert({
            where: {
                current_response_unique: {
                    candidateId: session.candidateId,
                    examId: session.examId,
                    questionId,
                },
            },
            create: {
                examId: session.examId,
                candidateId: session.candidateId,
                sessionId: session.id,
                questionId,
                answer,
                version: sequenceNumber,
                status,
            },
            update: {
                answer,
                version: sequenceNumber,
                status,
                lastUpdatedAt: new Date(),
            },
        });
        if (!systemState.internetConnected) {
            await tx.syncOutbox.create({
                data: {
                    examId: session.examId,
                    candidateId: session.candidateId,
                    eventId,
                    payload: JSON.stringify({ questionId, answer, sequenceNumber, status }),
                    status: 'PENDING',
                },
            });
        }
        await tx.auditEvent.create({
            data: {
                eventId: (0, node_crypto_2.randomUUID)(),
                type: 'ANSWER_SAVED',
                details: `Question ${questionId} answered with sequence ${sequenceNumber}.`,
                candidateId: session.candidateId,
                sessionId: session.id,
                examId: session.examId,
                previousHash,
                currentHash,
            },
        });
    });
    await writeAuditEvent({
        type: 'ANSWER_SAVED',
        details: `Candidate updated a response for question ${questionId}.`,
        candidateId: session.candidateId,
        sessionId: session.id,
        examId: session.examId,
    });
    return res.json({
        success: true,
        status,
        sequenceNumber,
        currentHash,
        message: status === 'ACKNOWLEDGED'
            ? 'The response was acknowledged by the local server.'
            : 'The response is pending synchronization while the cloud is offline.',
    });
});
app.post('/api/candidate/exam/:sessionId/submit', async (req, res) => {
    const { submittedAt } = req.body;
    const session = await prisma.examSession.findUnique({ where: { id: req.params.sessionId } });
    if (!session) {
        return res.status(404).json({ message: 'Session not found.' });
    }
    const submission = await prisma.examSubmission.create({
        data: {
            examId: session.examId,
            candidateId: session.candidateId,
            sessionId: session.id,
            submissionId: (0, node_crypto_2.randomUUID)(),
            status: 'SUBMITTED',
            submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
        },
    });
    await prisma.examSession.update({
        where: { id: session.id },
        data: { status: 'SUBMITTED', endedAt: new Date() },
    });
    await writeAuditEvent({
        type: 'EXAMINATION_SUBMITTED',
        details: `Candidate submitted the exam ${submission.submissionId}.`,
        candidateId: session.candidateId,
        sessionId: session.id,
        examId: session.examId,
    });
    return res.json({ success: true, submission });
});
app.post('/api/system/sync', async (_req, res) => {
    if (!systemState.internetConnected) {
        return res.status(400).json({ message: 'Synchronization cannot occur while the internet is disconnected.' });
    }
    const pending = await prisma.syncOutbox.findMany();
    for (const item of pending) {
        await prisma.syncInbox.create({
            data: {
                examId: item.examId,
                candidateId: item.candidateId,
                eventId: item.eventId,
                payload: item.payload,
                status: 'RECEIVED',
            },
        });
        await prisma.responseEvent.updateMany({
            where: { eventId: item.eventId },
            data: { status: 'ACKNOWLEDGED' },
        });
        await prisma.currentResponse.updateMany({
            where: { examId: item.examId, candidateId: item.candidateId },
            data: { status: 'ACKNOWLEDGED' },
        });
    }
    await prisma.syncOutbox.deleteMany();
    await writeAuditEvent({
        type: 'SYNC_COMPLETED',
        details: 'Pending local responses were synchronized to the central cloud successfully.',
    });
    res.json({ success: true, synced: pending.length });
});
async function startServer() {
    await ensureDemoData();
    app.listen(port, () => {
        console.log(`OneMind backend listening on http://localhost:${port}`);
    });
}
startServer().catch((error) => {
    console.error('Unable to start server', error);
    process.exit(1);
});
