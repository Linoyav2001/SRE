# SRE Assignment

This project provides a containerized, end-to-end infrastructure pipeline demonstrating database reliability, event-driven data streaming, and structured system monitoring.

## System Components

* **Frontend Interface:** React (Vite) application served via a lightweight, multi-stage Nginx container.
* **Service Layer:** Node.js API implementing RESTful endpoints with structured JSON logging, token-based authentication, and graceful error handling.
* **Database Infrastructure:** MySQL 8.0 configured with ROW binlog format, initialized automatically with predefined schemas and seed configuration.
* **Streaming Pipeline:** Apache Kafka cluster (running in modern KRaft mode) integrated with Debezium Connect for real-time, Change Data Capture (CDC) row-level database monitoring.
* **Observability:** Standalone Node.js consumer service processing Kafka streams for event-driven logging and monitoring.
* **Container Orchestration:** Docker Compose environment ensuring strict service isolation and single-command deployment.

## Deployment Instructions

Ensure Docker and Docker Compose are installed on your host machine (ports 8080, 3001, 3307, 8083, and 9092 must be available). Execute the following command in the root directory:

```bash
docker-compose up --build -d
```

Note: Infrastructure components (MySQL, Kafka, Debezium) require approximately 30-60 seconds for full initialization. A dedicated connector-init service will automatically register the Debezium connector once Kafka Connect is healthy.

## Verification Procedures

### 1. Service Connectivity

Navigate to http://localhost:8080 to interact with the frontend interface, or test the API directly via CLI:

```bash
curl -s -X POST -H "Content-Type: application/json" -d "{\"username\":\"AdminSre\", \"password\":\"HelfySre\"}" http://localhost:3001/api/login
```

### 2. Default Credentials

Use the following credentials to access the application and trigger database changes:

**Username:** AdminSre

**Password:** HelfySre

### 3. Monitoring & Logging

The system implements structured logging according to SRE best practices.

**API Activity Logs (User Logins):**

```bash
docker-compose logs -f api
```

**CDC Pipeline Logs (Database row changes via Kafka):**

To observe real-time database changes (e.g., token updates upon login) captured via Debezium:

```bash
docker-compose logs -f consumer
```

### 4. Advanced SRE Verification

Verify Debezium connector health:

```bash
curl -s http://localhost:8083/connectors/mysql-connector/status
```

Verify database state and token insertion:

```bash
docker exec -it mysql-db mysql -h 127.0.0.1 -uroot -prootpassword -e "USE login_app; SELECT id, username, token FROM users;"
```

## Engineering & Security Trade-offs

**Secrets Management:** Default credentials and database passwords are hardcoded in initialization scripts (docker-compose.yml, seed.sql) to satisfy the "single-command deployment" requirement. In a production environment, these would be managed via secure secret injection (e.g., HashiCorp Vault, AWS Secrets Manager) and excluded from version control.

**Logging Architecture:** The implementation utilizes log4js to generate structured JSON logs. This ensures seamless integration with centralized logging and observability platforms (e.g., ELK Stack, Datadog), adhering strictly to best practices for distributed environments.

**Automated Provisioning:** Instead of requiring manual API calls to register the CDC connector, a lightweight polling container (connector-init) is used to dynamically register the Debezium configuration at startup, eliminating manual infrastructure setup steps.
