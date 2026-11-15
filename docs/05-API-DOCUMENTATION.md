# 05 — API Documentation

**Project:** OneMind  
**Base URL:** `http://localhost:4000/api`  
**Authentication Scheme:** Bearer Token (HMAC-SHA256) in `Authorization` header  
**Version:** 1.0.0  

---

## 1. Authentication Endpoints

### 1.1 Administrator Login
- **Endpoint:** `POST /api/auth/admin/login`
- **Request Body:**
  ```json
  {
    "email": "admin@onemind.local",
    "password": "Admin@123"
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiJ9....",
    "user": {
      "id": "uuid-v4",
      "name": "System Administrator",
      "email": "admin@onemind.local",
      "role": "ADMIN"
    }
  }
  ```

### 1.2 Candidate Login
- **Endpoint:** `POST /api/auth/candidate/login`
- **Request Body:**
  ```json
  {
    "registrationId": "CAND-101",
    "password": "Candidate@123"
  }
  ```
- **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiJ9....",
    "candidate": {
      "id": "cand-uuid",
      "name": "Aisha Rahman",
      "registrationId": "CAND-101",
      "assignments": [...]
    }
  }
  ```

---

## 2. Administrator Endpoints

### 2.1 Get Dashboard Metrics
- **Endpoint:** `GET /api/admin/dashboard`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Success Response (HTTP 200):**
  ```json
  {
    "metrics": {
      "totalExams": 2,
      "registeredCandidates": 3,
      "activeExamTitle": "Seva Aptitude Demo",
      "totalSubmissions": 1,
      "pendingSyncCount": 0
    },
    "exams": [...],
    "candidates": [...],
    "systemState": {
      "internetConnected": true,
      "nodeA": "ONLINE",
      "nodeB": "ONLINE",
      "nodeC": "ONLINE",
      "pauseActive": false
    }
  }
  ```

### 2.2 Create Examination
- **Endpoint:** `POST /api/admin/exams`
- **Headers:** `Authorization: Bearer <admin-token>`
- **Request Body:**
  ```json
  {
    "title": "Seva Mathematics Assessment",
    "description": "General assessment for technical admissions.",
    "durationMinutes": 30,
    "questions": [
      {
        "text": "What is the square root of 144?",
        "options": [
          { "text": "10", "isCorrect": false },
          { "text": "12", "isCorrect": true },
          { "text": "14", "isCorrect": false },
          { "text": "16", "isCorrect": false }
        ]
      }
    ]
  }
  ```
- **Success Response (HTTP 201):** Returns created exam with assigned IDs.

---

## 3. Candidate Examination Endpoints

### 3.1 Start / Resume Examination
- **Endpoint:** `POST /api/candidate/exam/start`
- **Headers:** `Authorization: Bearer <candidate-token>`
- **Request Body:** `{ "examId": "optional-exam-uuid" }`
- **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "sessionId": "session-uuid",
    "startedAt": "2026-11-15T14:00:00.000Z",
    "exam": {
      "id": "exam-uuid",
      "title": "Seva Aptitude Demo",
      "durationMinutes": 25,
      "questions": [
        {
          "id": "q-1",
          "order": 1,
          "text": "Sample prompt...",
          "options": [
            { "id": "opt-1", "order": 1, "text": "Option A" }
          ]
        }
      ]
    },
    "responses": []
  }
  ```
  *(Note: `isCorrect` is strictly omitted from option objects).*

### 3.2 Save / Update Response
- **Endpoint:** `POST /api/candidate/exam/:sessionId/response`
- **Headers:** `Authorization: Bearer <candidate-token>`
- **Request Body:**
  ```json
  {
    "questionId": "q-1",
    "answer": "Option A",
    "clientEventId": "ev_1731678123_abc",
    "sequenceNumber": 1
  }
  ```
- **Normal Acknowledgement (HTTP 200):**
  ```json
  {
    "success": true,
    "status": "ACKNOWLEDGED",
    "sequenceNumber": 1,
    "currentHash": "a3f5b9...",
    "message": "Response confirmed and stored by local examination server."
  }
  ```
- **Offline Cloud Acknowledgement (HTTP 200):**
  ```json
  {
    "success": true,
    "status": "PENDING_SYNC",
    "message": "Response saved locally; cloud synchronization queued while internet is disconnected."
  }
  ```
- **Standby Failure Rejection (HTTP 409 Conflict):**
  ```json
  {
    "success": false,
    "status": "PAUSED",
    "message": "Standby node (Node B) is offline. Examination is safely paused to prevent un-replicated response loss."
  }
  ```

### 3.3 Submit Examination
- **Endpoint:** `POST /api/candidate/exam/:sessionId/submit`
- **Headers:** `Authorization: Bearer <candidate-token>`
- **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "submission": {
      "submissionId": "uuid-v4",
      "submittedAt": "2026-11-15T14:24:10.000Z",
      "status": "SUBMITTED"
    },
    "summary": {
      "totalQuestions": 5,
      "answeredCount": 5,
      "score": 4,
      "percentage": 80
    }
  }
  ```

---

## 4. System Simulation & Audit Endpoints

### 4.1 Topology Simulation
- **Endpoint:** `POST /api/system/simulate`
- **Request Body:**
  ```json
  {
    "action": "disconnect_internet" | "reconnect_internet" | "fail_node_b" | "restore_node_b" | "fail_node_a" | "restore_node_a" | "fail_node_c" | "restore_node_c" | "reset"
  }
  ```

### 4.2 Cloud Synchronization
- **Endpoint:** `POST /api/system/sync`
- **Success Response (HTTP 200):**
  ```json
  {
    "success": true,
    "syncedCount": 3,
    "message": "Successfully synchronized 3 records with central repository."
  }
  ```

### 4.3 Verify Audit Chain Integrity
- **Endpoint:** `GET /api/audit/verify`
- **Success Response (HTTP 200):**
  ```json
  {
    "verified": true,
    "totalEvents": 18,
    "corruptedIndex": null,
    "algorithm": "SHA-256 Chained Hash Digest",
    "status": "TAMPER_FREE"
  }
  ```
