```text
Orchestrator: SafeCred Phase0 (High level pseudocode)

Purpose:
- Coordinate flow from frontend -> backend -> document storage -> (future) scoring service
- Ensure reliability: retries, idempotency, status updates

Components:
- API Gateway (Express endpoints)
- Orchestrator service (simple Node module invoked after application creation / doc upload)
- Persistent store: applications table (status, timestamps)
- Optional: message queue (RabbitMQ / Redis stream) — not required for Phase0 but recommended

Pseudocode:

function handleCreateApplication(application):
    # application: { id, userId, income, loan_amount, tenure_months }
    set application.status = "CREATED"
    save application to DB
    log("Application created", application.id)
    # Kickoff orchestrator workflow
    orchestrator.enqueue({ type: "PROCESS_APPLICATION", id: application.id })

orchestrator.enqueue(job):
    # simple in-memory queue or push to Redis list
    push job into queue

orchestrator.workerLoop():
    while true:
        job = queue.pop()
        if job.type == "PROCESS_APPLICATION":
            processApplication(job.id)

processApplication(appId):
    app = DB.fetchApplication(appId)
    if not app:
        log("Missing app", appId); return
    if app.status in ["COMPLETED","PROCESSING"]:
        log("Already processed", appId); return

    set app.status = "PROCESSING"
    updateDB(app)

    # Step 1: Check documents
    docs = DB.fetchDocumentsForApplication(appId)
    if docs.count == 0:
        set app.status = "AWAITING_DOCUMENTS"
        updateDB(app)
        return

    # Step 2: Basic validation on docs (filetypes, size)
    valid = validateDocuments(docs)
    if not valid:
        set app.status = "DOCUMENTS_INVALID"
        updateDB(app)
        return

    # Step 3: (Phase0) store document metadata and mark ready
    set app.status = "READY_FOR_SCORING"
    updateDB(app)

    # if future: enqueue scoring job
    # orchestrator.enqueue({ type: "SCORE_APPLICATION", id: appId })

    set app.status = "COMPLETED"
    updateDB(app)
    log("Processing completed", appId)

# Utilities
validateDocuments(docs):
    for d in docs:
        if d.size > MAX_SIZE: return false
        if d.type not in allowed_types: return false
    return true

# Failure handling
- Any DB write failure -> retry with exponential backoff (max 3 attempts)
- Long-running jobs -> mark as "PROCESSING" with last_heartbeat timestamp; worker periodically cleans orphaned jobs older than X minutes.

# Idempotency
- processApplication uses application.status guards to avoid re-processing.

# Observability
- emit logs for each state change
- update DB audit table: (appId, oldStatus, newStatus, timestamp, actor)

# Local dev
- For Phase0: orchestrator can be synchronous (called right after API returns)
- Recommended: keep orchestrator as a separate module to swap with a queue later.