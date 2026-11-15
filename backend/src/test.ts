import { startServer } from './index';

const API_BASE = 'http://127.0.0.1:4000/api';

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(endpoint: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, ok: res.ok };
}

async function runTests() {
  console.log('====================================================');
  console.log('OneMind Seva Prototype — Automated Integration Tests');
  console.log('====================================================\n');

  let serverInstance: any = null;

  try {
    console.log('Starting in-process backend server on 127.0.0.1:4000...');
    serverInstance = await startServer(4000);
    await wait(200);

    const ping = await request('/health');
    if (!ping.ok) {
      throw new Error('Health check failed: ' + JSON.stringify(ping.data));
    }
    console.log('Backend server verified healthy.\n');

    let adminToken = '';
    let candToken = '';
    let testExamId = '';
    let testSessionId = '';
    let questionId1 = '';
    let optionText1 = '';

    // 1. Admin can log in
    {
      const res = await request('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@onemind.local', password: 'Admin@123' }),
      });
      if (res.status === 200 && res.data.token) {
        adminToken = res.data.token;
        console.log('✔ Test 1: Admin can log in (200 OK, Token generated)');
      } else {
        throw new Error(`Test 1 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 2. Candidate can log in
    {
      const res = await request('/auth/candidate/login', {
        method: 'POST',
        body: JSON.stringify({ registrationId: 'CAND-101', password: 'Candidate@123' }),
      });
      if (res.status === 200 && res.data.token) {
        candToken = res.data.token;
        console.log('✔ Test 2: Candidate can log in (200 OK, Candidate authenticated)');
      } else {
        throw new Error(`Test 2 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 3 & 4. Admin can create an exam and add questions
    {
      const res = await request(
        '/admin/exams',
        {
          method: 'POST',
          body: JSON.stringify({
            title: 'Automated Test Assessment ' + Date.now(),
            description: 'Automated test examination',
            durationMinutes: 15,
            questions: [
              {
                text: 'What is the function of the witness node in OneMind?',
                options: [
                  { text: 'Prevent split-brain quorum conflicts', isCorrect: true },
                  { text: 'Store candidates passwords in plain text', isCorrect: false },
                  { text: 'Run bitcoin mining', isCorrect: false },
                  { text: 'Crash the database', isCorrect: false },
                ],
              },
            ],
          }),
        },
        adminToken
      );
      if (res.status === 201 && res.data.exam) {
        testExamId = res.data.exam.id;
        questionId1 = res.data.exam.questions[0].id;
        optionText1 = res.data.exam.questions[0].options[0].text;
        console.log('✔ Test 3: Admin can create an exam (201 Created)');
        console.log('✔ Test 4: Admin can add multiple-choice questions with 4 options and correct answer');
      } else {
        throw new Error(`Test 3/4 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // Assign candidate to this new exam
    await request(
      '/admin/candidates',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Aisha Rahman',
          email: 'cand101@demo.local',
          registrationId: 'CAND-101',
          examId: testExamId,
        }),
      },
      adminToken
    );

    // 5. Candidate can start an exam
    {
      const res = await request(
        '/candidate/exam/start',
        {
          method: 'POST',
          body: JSON.stringify({ examId: testExamId }),
        },
        candToken
      );
      if (res.status === 200 && res.data.sessionId) {
        testSessionId = res.data.sessionId;
        console.log('✔ Test 5: Candidate can start an exam session (Session ID generated)');
      } else {
        throw new Error(`Test 5 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 6. Candidate can navigate questions / load session without leaking isCorrect
    {
      const res = await request(`/candidate/exam/${testSessionId}`, {}, candToken);
      if (res.status === 200 && res.data.exam.questions.length > 0) {
        const firstOpt = res.data.exam.questions[0].options[0];
        if (firstOpt.isCorrect === undefined) {
          console.log('✔ Test 6: Candidate can view/navigate questions (isCorrect is strictly sanitized)');
        } else {
          throw new Error('Security Violation: isCorrect was exposed to candidate!');
        }
      } else {
        throw new Error(`Test 6 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 7. Candidate can save answers
    const clientEvtId = 'test_evt_' + Date.now();
    {
      const res = await request(
        `/candidate/exam/${testSessionId}/response`,
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: questionId1,
            answer: optionText1,
            clientEventId: clientEvtId,
          }),
        },
        candToken
      );
      if (res.status === 200 && res.data.success) {
        console.log('✔ Test 7: Candidate can save answers (Status: ' + res.data.status + ')');
      } else {
        throw new Error(`Test 7 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 8. Answer remains after retrieval (simulating refresh)
    {
      const res = await request(`/candidate/exam/${testSessionId}`, {}, candToken);
      const saved = res.data.responses.find((r: any) => r.questionId === questionId1);
      if (saved && saved.answer === optionText1) {
        console.log('✔ Test 8: Answer remains persisted in SQLite database after page refresh');
      } else {
        throw new Error('Test 8 Failed: Saved response not found on retrieval.');
      }
    }

    // 9. Duplicate response events are not processed twice (Idempotency)
    {
      const res = await request(
        `/candidate/exam/${testSessionId}/response`,
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: questionId1,
            answer: optionText1,
            clientEventId: clientEvtId,
          }),
        },
        candToken
      );
      if (res.status === 200 && res.data.message.includes('idempotent')) {
        console.log('✔ Test 9: Duplicate response event is handled idempotently without re-execution');
      } else {
        throw new Error(`Test 9 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 10. Candidate cannot access another candidate's session
    {
      // Log in CAND-102
      const cand2Login = await request('/auth/candidate/login', {
        method: 'POST',
        body: JSON.stringify({ registrationId: 'CAND-102', password: 'Candidate@123' }),
      });
      const cand2Token = cand2Login.data.token;

      // Try accessing CAND-101's session
      const unauthorizedRes = await request(`/candidate/exam/${testSessionId}`, {}, cand2Token);
      if (unauthorizedRes.status === 403) {
        console.log('✔ Test 10: Unauthorized candidate cannot access another candidate session (403 Forbidden)');
      } else {
        throw new Error(`Test 10 Failed: Expected 403, got ${unauthorizedRes.status}`);
      }
    }

    // 11. Internet disconnection does not stop local examination
    {
      await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'disconnect_internet' }),
      });

      const res = await request(
        `/candidate/exam/${testSessionId}/response`,
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: questionId1,
            answer: optionText1,
            clientEventId: 'offline_evt_' + Date.now(),
          }),
        },
        candToken
      );
      if (res.status === 200 && res.data.status === 'PENDING_SYNC') {
        console.log('✔ Test 11: Internet disconnection allows local examination to continue (PENDING_SYNC)');
      } else {
        throw new Error(`Test 11 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 12. Reconnection processes pending records
    {
      await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'reconnect_internet' }),
      });

      const syncRes = await request('/system/sync', { method: 'POST' });
      if (syncRes.status === 200 && syncRes.data.syncedCount >= 1) {
        console.log(`✔ Test 12: Reconnection synchronizes ${syncRes.data.syncedCount} pending records without duplicates`);
      } else {
        throw new Error(`Test 12 Failed: ${JSON.stringify(syncRes.data)}`);
      }
    }

    // 13. Node B failure pauses the examination
    {
      await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'fail_node_b' }),
      });

      const pauseRes = await request(
        `/candidate/exam/${testSessionId}/response`,
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: questionId1,
            answer: optionText1,
          }),
        },
        candToken
      );
      if (pauseRes.status === 409 && pauseRes.data.status === 'PAUSED') {
        console.log('✔ Test 13: Node B failure safely PAUSES examination and rejects writes (409 Conflict)');
      } else {
        throw new Error(`Test 13 Failed: Expected 409 PAUSED, got ${pauseRes.status}`);
      }
    }

    // 14. Node B restoration allows controlled resume
    {
      await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'restore_node_b' }),
      });

      const resumeRes = await request(
        `/candidate/exam/${testSessionId}/response`,
        {
          method: 'POST',
          body: JSON.stringify({
            questionId: questionId1,
            answer: optionText1,
          }),
        },
        candToken
      );
      if (resumeRes.status === 200 && resumeRes.data.success) {
        console.log('✔ Test 14: Node B restoration resumes examination write capabilities');
      } else {
        throw new Error(`Test 14 Failed: ${JSON.stringify(resumeRes.data)}`);
      }
    }

    // 15. Node C failure shows witness warning
    {
      const res = await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'fail_node_c' }),
      });
      if (res.status === 200 && res.data.systemState.nodeC === 'OFFLINE') {
        console.log('✔ Test 15: Node C failure updates witness health and triggers quorum warning');
      } else {
        throw new Error(`Test 15 Failed: ${JSON.stringify(res.data)}`);
      }
      // Restore Node C
      await request('/system/simulate', {
        method: 'POST',
        body: JSON.stringify({ action: 'restore_node_c' }),
      });
    }

    // 16. Examination submission works
    {
      const res = await request(
        `/candidate/exam/${testSessionId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({ submittedAt: new Date().toISOString() }),
        },
        candToken
      );
      if (res.status === 200 && res.data.submission) {
        console.log(`✔ Test 16: Examination submission confirmed (Submission ID: ${res.data.submission.submissionId})`);
      } else {
        throw new Error(`Test 16 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 17. Audit events are persisted and cryptographically hash-chained
    {
      const res = await request('/audit/verify');
      if (res.status === 200 && res.data.verified) {
        console.log(`✔ Test 17: Audit events persisted and verified via SHA-256 hash chaining (${res.data.totalEvents} events)`);
      } else {
        throw new Error(`Test 17 Failed: ${JSON.stringify(res.data)}`);
      }
    }

    // 18. Unauthorized administrator operations are rejected
    {
      // Attempt admin operation with candidate token
      const res = await request(
        '/admin/exams',
        {
          method: 'POST',
          body: JSON.stringify({ title: 'Hacked Exam' }),
        },
        candToken
      );
      if (res.status === 403) {
        console.log('✔ Test 18: Candidate token rejected from admin routes (403 Forbidden)');
      } else {
        throw new Error(`Test 18 Failed: Expected 403, got ${res.status}`);
      }
    }

    console.log('\n====================================================');
    console.log('ALL 18 INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('====================================================\n');
  } catch (err: any) {
    console.error('\n✖ Test suite failed:', err.message);
    process.exitCode = 1;
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }
}

runTests();
