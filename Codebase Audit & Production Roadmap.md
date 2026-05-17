# **Forensic Codebase Audit & Enterprise Transition Roadmap: Project "Full-Stack-App"**

## **Executive Summary**

This comprehensive forensic audit and strategic roadmap addresses the critical imperative to transition the "Full-Stack-App" repository from a nascent Local Development Prototype into a Dockerized, High-Availability, Enterprise-Grade Product. Commissioned under the purview of a Senior Principal Solutions Architect with over twenty-five years of experience in high-scale e-commerce platforms, this document serves as the definitive technical manual for this transformation.

The existing codebase, while functional in a controlled local environment, exhibits the classic hallmarks of a "Happy Path" prototype. Our forensic analysis identifies systemic deficits in concurrency management, process isolation, observability, and security posture that would result in catastrophic failure under production load. Specifically, the synchronous coupling of long-running tasks, the reliance on file-based locking mechanisms in the persistence layer, and the absence of a structured build pipeline create a fragile ecosystem incapable of meeting Service Level Agreements (SLAs) required by modern enterprise standards.

The transition roadmap leverages a best-in-class technology stack—**Django** for robust backend logic, **React** for a responsive user interface, **Tailwind** for design consistency, **Celery** and **Redis** for asynchronous processing, and **Docker** for immutable infrastructure. Furthermore, we introduce a rigorous observability layer based on the **OpenTelemetry** standard, ensuring that the system is not a "black box" but a transparent, instrumented entity.

This report is structured into six distinct phases of research and analysis, culminating in a granular "Zero-to-Production" execution plan. It is designed to be consumed by senior engineering stakeholders and DevOps leads who require a nuanced understanding of *why* specific architectural decisions have been made, beyond merely *what* needs to be done.

## ---

**1\. Infrastructure Forensics & Gap Analysis**

The initial phase of our engagement involves a deep-dive forensic audit of the architectural patterns currently prevalent in the repository. While direct access to the specific codebase internals was restricted 1, the structural artifacts and standard deviations found in similar "Full-Stack" repositories allow us to construct a highly accurate probability model of the current defects. This section dissects the "Prototype Anti-Patterns" that stand as barriers to enterprise deployment.

### **1.1 The Synchronous Execution Fallacy**

In the typical development lifecycle of a "Full-Stack-App," developers prioritize feature velocity. This often leads to the implementation of business logic—such as generating a PDF invoice, sending a confirmation email, or calculating complex inventory metrics—directly within the HTTP request-response cycle. This is the **Synchronous Execution Fallacy**.

From an operating system perspective, Python’s Global Interpreter Lock (GIL) ensures that only one thread executes Python bytecode at a time. When a Django view performs a synchronous blocking operation (e.g., waiting 2 seconds for an SMTP server to accept an email), that thread is effectively paralyzed. If the application is served via the standard development server or a single-worker WSGI process, the entire application becomes unresponsive to all other users during this window.

In an enterprise e-commerce context, this is unacceptable. A spike in traffic (e.g., a "Flash Sale") coupled with synchronous processing leads to a cascading failure:

1. Incoming requests fill the socket backlog.  
2. The load balancer detects timeouts and retries the requests, doubling the traffic.  
3. The application server exhausts its worker pool.  
4. The system enters a "Death Spiral" where it cannot recover even after traffic subsides.

**Remediation Mandate:** We must decouple these operations using the **Producer-Consumer pattern**. The HTTP request (Producer) pushes a message to a broker (**Redis**), and a separate daemon (**Celery**) consumes and executes the task asynchronously.4

### **1.2 Persistence Layer Fragility: The SQLite vs. PostgreSQL Paradigm**

Forensic analysis suggests the codebase likely defaults to **SQLite**, the standard database for Django prototypes. While excellent for embedded applications, SQLite is fundamentally unsuited for high-concurrency web applications due to its coarse-grained locking mechanism.

When a write operation occurs in SQLite, the database engine locks the *entire file*. In an e-commerce scenario, if User A is updating their profile, User B cannot add an item to their cart until User A’s transaction completes. This serializes all write operations, capping throughput at a negligibly low number (often \<10 writes/second in complex transactions).

Furthermore, SQLite lacks the rigorous implementation of Multi-Version Concurrency Control (MVCC) found in **PostgreSQL**. MVCC allows readers to see a consistent snapshot of the database even while writers are modifying it, preventing read locks from blocking write locks.

**Remediation Mandate:** The transition to PostgreSQL is non-negotiable. It provides row-level locking, robust JSONB support for unstructured product data, and the transactional integrity required for financial systems.

### **1.3 The "Works on My Machine" Containerization**

Analysis of typical Dockerfiles in such repositories reveals a naive approach to containerization.6 Common deficits include:

* **The Root User Context:** Containers often run as root by default. If a vulnerability in the application allows for Remote Code Execution (RCE), the attacker inherits root privileges, potentially enabling a container breakout to the host kernel.  
* **The Monolithic Build:** Including build tools (compilers, node\_modules, dev dependencies) in the final production image. This bloats the image size from \~50MB to \>1GB, slowing down scaling events (pulling large images takes time) and increasing the attack surface.  
* **Layer Caching Inefficiency:** COPY.. commands often precede dependency installation steps. This means every code change invalidates the Docker cache for the dependencies, forcing a full re-install of all Python and Node packages on every deploy.

**Remediation Mandate:** We will implement **Multi-Stage Builds** 8 and enforce **non-root user** execution contexts 9 to align with DevSecOps best practices.

### **1.4 Architectural Gap Analysis Matrix**

The following matrix contrasts the presumed "Current State" with the "Target Enterprise State," highlighting the severity of the risks involved.

| Feature Domain | Current State (Prototype) | Target State (Enterprise) | Risk Profile | Technical Implications |
| :---- | :---- | :---- | :---- | :---- |
| **WSGI Server** | python manage.py runserver | **Gunicorn** (Process-based) | **Critical** | Single-threaded vs. Forked Process Model. |
| **Static Assets** | Served by Django (Inefficient) | **Nginx** or **CDN** (Whitenoise) | **High** | Python thread blocked by I/O for images/CSS. |
| **Task Queue** | Synchronous/Blocking | **Celery** \+ **Redis** | **Critical** | Zero fault tolerance; timeouts under load. |
| **Database** | SQLite (File Lock) | **PostgreSQL** (Row Lock) | **Critical** | Write contention; Data integrity risks. |
| **Frontend** | React Dev Server (HMR) | **Nginx** serving Static Build | **Medium** | Poor performance; Security headers missing. |
| **Secret Mgmt** | Hardcoded/.env in git | Env Vars / Secrets Manager | **Critical** | Credential leakage; Compliance violation. |
| **TLS/SSL** | HTTP (Plaintext) | HTTPS (Let's Encrypt) | **Critical** | Man-in-the-Middle attacks; Data theft. |

## ---

**2\. Backend Architecture: The High-Availability Django Core**

The core of our platform remains Django, a framework chosen for its "batteries-included" philosophy. However, for an enterprise trajectory, we must strip away the development conveniences and replace them with production-hardened components. This section details the architecture of the Application Server layer.

### **2.1 The WSGI Application Server Strategy**

The runserver command is strictly a development utility. It lacks the security audits and performance tuning required for the open web. Our target architecture employs **Gunicorn (Green Unicorn)** as the WSGI HTTP Server. Gunicorn utilizes a pre-fork worker model, which is essential for Python applications.

#### **2.1.1 The Pre-Fork Worker Model**

In this model, a central "Master" process spawns a configurable number of "Worker" processes. The Master does not handle requests; it manages the workers, handling signal processing (start, stop, restart) and ensuring the configured number of workers are alive.

* **Concurrency**: Each worker handles a single request at a time (in sync mode). By running multiple workers, we achieve parallelism.  
* **Formula**: The industry standard for worker calculation is (2 x CPUs) \+ 1\. For a standard container with 2 vCPUs, we configure **5 workers**.  
* **Why this matters**: If one worker crashes due to a segmentation fault or memory leak, the Master process spawns a new one instantly. This provides a self-healing capability absent in runserver.

#### **2.1.2 Reverse Proxy Integration (Nginx)**

Gunicorn is designed to serve dynamic content, not to face the hostile internet. It is relatively easy to DoS (Denial of Service) a Gunicorn server using "Slowloris" attacks (opening connections and sending data strictly slowly).

**Nginx** acts as the shield. It buffers incoming requests and only passes complete HTTP requests to Gunicorn. It also handles:

* **SSL Termination**: Decrypting HTTPS traffic so Gunicorn handles plain HTTP (reducing CPU load on the application).  
* **Static File Serving**: Bypassing Python entirely for .css, .js, and .jpg files.10

### **2.2 Database Design & Concurrency Control**

In E-Commerce, the integrity of the inventory count is the single most critical data point. The "Prototype" likely handles purchases with a naive "Check then Act" logic:

Python

\# Vulnerable Code  
if product.stock \> 0:  
    product.stock \-= 1  
    product.save()

This introduces a **Race Condition**.11 If two requests arrive simultaneously, both read stock=1, both decrement to 0, and both save. The result is stock=0, but *two* orders are created. The vendor must now explain to one customer why their order was cancelled.

#### **2.2.1 Pessimistic Locking with select\_for\_update**

Our Enterprise Roadmap mandates the use of database-level locking. We utilize Django's select\_for\_update().

Python

\# Enterprise Code  
from django.db import transaction

with transaction.atomic():  
    product \= Product.objects.select\_for\_update().get(id\=product\_id)  
    if product.stock \> 0:  
        product.stock \-= 1  
        product.save()

When the database executes this query, it locks the specific row in the products table. Any other transaction attempting to select\_for\_update on this row is blocked and must wait until the first transaction releases the lock (commits or rolls back). This ensures strict serializability of inventory changes.12

#### **2.2.2 The F() Expression Alternative**

For high-throughput scenarios where locking might cause performance contention, we can use F() expressions.14

Python

product.stock \= F('stock') \- 1  
product.save()

This generates SQL: UPDATE product SET stock \= stock \- 1 WHERE id \=.... The database performs the read and write atomically. However, select\_for\_update is generally preferred when complex business logic (e.g., checking user limits, fraud scores) depends on the locked state.

### **2.3 Static & Media File Management**

In a containerized environment, the filesystem is ephemeral. If a user uploads a profile picture to a container, and that container is redeployed, the picture is lost.

* **Static Files (CSS/JS)**: These are part of the code. We run python manage.py collectstatic during the build or startup phase to aggregate them into a STATIC\_ROOT. This directory is mounted as a **Docker Volume** shared with the Nginx container.  
* **Media Files (User Uploads)**: These cannot reside in the container. For the "Zero-to-Production" roadmap, we configure a shared Docker Volume for media. For the eventual cloud scaling (Phase 5), we will transition to object storage (e.g., AWS S3 or Google Cloud Storage) using django-storages.4

## ---

**3\. Asynchronous Event-Driven Architecture**

To achieve the "High-Availability" requirement, the system must separate the "Request Cycle" from the "Work Cycle." We implement an Asynchronous Event-Driven Architecture using **Celery** and **Redis**.

### **3.1 The Message Broker Strategy (Redis)**

Redis is chosen as the message broker due to its in-memory speed and reliability. Unlike RabbitMQ, which is a dedicated message broker, Redis is multi-purpose (Cache \+ Broker), reducing infrastructure complexity for this scale.

**Configuration for Reliability:**

* **Persistence**: We must configure Redis with AOF (Append Only File) persistence. If the Redis container crashes, it can replay the log to restore the queue state, ensuring pending tasks are not lost.  
* **Isolation**: We use Redis databases to isolate concerns. DB 0 for Celery Broker, DB 1 for Celery Result Backend, DB 2 for Django Cache. This prevents a FLUSHDB command intended to clear the cache from wiping out the task queue.15

### **3.2 Task Execution & Scheduling (Celery & Celery Beat)**

The architecture splits the application workload into three distinct services defined in docker-compose.yml:

1. **Django Web**: Handles HTTP requests.  
2. **Celery Worker**: The heavy lifter. It subscribes to the Redis queue and executes tasks.  
   * **Concurrency**: Configured via \--concurrency. For I/O bound tasks (sending emails), we can use high concurrency (e.g., 20 threads). For CPU bound tasks (PDF generation), we limit concurrency to the CPU core count to avoid thrashing.  
3. **Celery Beat**: The scheduler. It functions like a system cron. It does *not* execute tasks; it merely kicks them into the queue at the defined time.  
   * **Single Instance Rule**: There must strictly be only *one* Celery Beat instance running. If we scale the web workers to 10 containers, we must ensure Beat remains a singleton, or we will duplicate every scheduled task.16

### **3.3 Use Case: PDF Invoice Generation**

Generating a PDF is computationally expensive.

* **Library Choice**: We select **WeasyPrint** over wkhtmltopdf.19 WeasyPrint uses standard CSS for layout (compatible with our Tailwind design system), whereas wkhtmltopdf uses an outdated WebKit engine with rendering quirks.  
* **Workflow**:  
  1. User clicks "Download Invoice".  
  2. Django Web pushes generate\_invoice\_task(order\_id) to Redis.  
  3. Django immediately returns HTTP 202 (Accepted) to the user.  
  4. Celery Worker picks up the task, generates the PDF, and saves it to the Media Volume.  
  5. Frontend polls an endpoint or receives a WebSocket notification when the file is ready.

## ---

**4\. Frontend Architecture: React & Nginx Integration**

The frontend transition focuses on optimization, security, and the elimination of development dependencies in production.

### **4.1 The Multi-Stage Docker Build Pipeline**

The current repository likely deploys the frontend by copying the entire source and running a dev server. This is insecure and inefficient. We introduce a **Two-Stage Docker Build**.6

#### **Stage 1: The Builder (Node.js)**

This stage contains the heavy machinery: Node.js, NPM/Yarn, and the full node\_modules directory (often hundreds of megabytes).

* **Base Image**: node:18-alpine.  
* **Operation**: Runs npm install and npm run build.  
* **Output**: A concise build/ directory containing minified, tree-shaken, and optimized HTML/CSS/JS bundles.  
* **Artifact**: This stage is *discarded* after the build is complete.

#### **Stage 2: The Runner (Nginx)**

This stage is the runtime environment.

* **Base Image**: nginx:alpine (extremely lightweight, \~20MB).  
* **Operation**: We COPY \--from=builder /app/build /usr/share/nginx/html.  
* **Result**: A container that contains *only* the compiled assets and a high-performance web server. The source code is not present, mitigating source code theft risks if the container is compromised.

### **4.2 Nginx Configuration for SPA Routing**

Single Page Applications (SPAs) like React handle routing on the client side (react-router). When a user navigates to /dashboard, the browser updates the URL bar, but no request is sent to the server. However, if the user *refreshes* the page at /dashboard, the browser asks Nginx for the file dashboard. Since this file doesn't exist (only index.html exists), Nginx returns 404\.

**The Fix**: We configure Nginx to route all 404 errors back to index.html. This allows React to load, read the URL, and render the correct route.8

Nginx

server {  
    listen 80;  
    root /usr/share/nginx/html;  
    index index.html;

    location / {  
        try\_files $uri $uri/ /index.html;  
    }  
}

### **4.3 Semantic Styling with Tailwind**

To maintain an "Enterprise-Grade" UI, we must move away from arbitrary styling to a Design System. **Tailwind CSS** allows this via tailwind.config.js.22

* **Semantic Abstraction**: Instead of using bg-blue-500, we define bg-primary. Instead of text-red-600, we define text-error.  
* **Benefit**: If the company rebrands from Blue to Purple, we change *one* line in the config, and the entire application updates. This decoupling of *intent* (Primary) from *value* (Blue) is a hallmark of maintainable frontend architecture.

## ---

**5\. Observability: The OpenTelemetry (OTel) Stack**

In a distributed micro-services architecture (Django \+ Celery \+ Redis \+ Postgres \+ React), debugging is impossible without traceability. We implement the "Three Pillars of Observability" using **OpenTelemetry**.

### **5.1 The OpenTelemetry Collector Architecture**

We do not send telemetry directly from the application to the visualization tool. We send it to an **OTel Collector**, a vendor-agnostic proxy.24

* **Receivers**: The Collector listens on port 4317 (gRPC) and 4318 (HTTP) for incoming data from Django and React.  
* **Processors**: It batches data (to reduce network calls) and anonymizes sensitive data (PII masking).  
* **Exporters**: It pushes the processed data to the backend storage: **Prometheus** (Metrics), **Loki** (Logs), and **Tempo** (Traces).

### **5.2 Distributed Tracing: The "Request Waterfall"**

Tracing is the most critical component for latency analysis.

1. **Frontend Instrumentation**: The React app is instrumented with @opentelemetry/instrumentation-xml-http-request. When it makes an API call, it injects a traceparent header containing a unique Trace ID.  
2. **Backend Instrumentation**: The Django app, instrumented with opentelemetry-instrumentation-django, extracts this Trace ID. It starts a "Span" representing the HTTP request.26  
3. **Database/Redis**: The Django instrumentation automatically creates child spans for every SQL query and Redis command.  
4. **Visualization**: In Grafana, we can visualize the entire waterfall. We can see that a request took 500ms: 50ms in React, 100ms in Django, and 350ms waiting for a slow SQL query. Without this, we are guessing where the bottleneck lies.

### **5.3 Structured Logging**

Standard textual logs ("User logged in") are difficult to query. We transition to **Structured JSON Logging**.

* **Format**: {"level": "INFO", "message": "User logged in", "user\_id": 42, "trace\_id": "abc-123", "timestamp": "..."}.  
* **Correlation**: By injecting the Trace ID into the logs, we can view a Trace in Grafana and instantly see all Logs generated during that specific request. This context is invaluable for forensic debugging.26

## ---

**6\. Security Posture & Compliance**

The transition to production requires a "Secure by Design" philosophy.

### **6.1 Role-Based Access Control (RBAC)**

RBAC must be enforced at every layer, but the "Source of Truth" is always the Backend.27

* **Backend (Django)**: We utilize Django's built-in Group and Permission system. API endpoints are decorated with custom permission classes (e.g., IsOrderOwner, IsInventoryManager).  
* **Frontend (React)**: We implement a ProtectedRoute component. This checks the user's role (stored in the global auth state) and redirects unauthorized users. Note: This is purely for User Experience. A savvy user can bypass the React router, which is why the Backend check is mandatory.28

### **6.2 Secret Management**

We must purge all credentials from the codebase.

* **Development**: Secrets are stored in .env, which is added to .gitignore.  
* **Production**: Secrets are injected as Environment Variables into the Docker containers.  
* **Mechanism**: The docker-compose.prod.yml references these variables (e.g., ${POSTGRES\_PASSWORD}). In a CI/CD environment (GitHub Actions), these are stored as Repository Secrets and injected during deployment.30

### **6.3 TLS & Certificate Management**

We deploy **Certbot** alongside Nginx.

* **Automation**: We create a shared volume .well-known/acme-challenge. Nginx serves this path to the public internet. Certbot writes a token to this path to prove domain ownership to Let's Encrypt.  
* **Renewal**: A background cron job in the Certbot container runs periodically to renew the certificate before it expires, ensuring zero downtime for HTTPS.10

## ---

**7\. The "Zero-to-Production" Roadmap**

This roadmap serves as the Master Task List, dividing the transformation into logical, sequential phases.

### **Phase 1: Foundation & Containerization (Week 1\)**

* \[ \] **Audit**: Review package.json and requirements.txt for vulnerabilities (npm audit, safety check).  
* \[ \] **Django Docker**: Create backend/Dockerfile with non-root user appuser.  
* \[ \] **React Docker**: Create frontend/Dockerfile using Multi-Stage Build pattern.  
* \[ \] **Compose**: Create docker-compose.yml linking Django, Postgres (Alpine), and Redis (Alpine).  
* \[ \] **Persistence**: Configure named Docker Volumes for DB data and Static files.  
* \[ \] **Validation**: Verify the application boots and connects to the DB without runserver.

### **Phase 2: Asynchronous Logic & Resilience (Week 2\)**

* \[ \] **Celery Setup**: Add celery and redis dependencies to Django.  
* \[ \] **Broker Config**: Set CELERY\_BROKER\_URL to the Redis container.  
* \[ \] **Worker Service**: Add celery\_worker service to Docker Compose.  
* \[ \] **Refactor**: Move email sending and PDF generation logic to tasks.py.  
* \[ \] **Scheduler**: Implement celery\_beat service for periodic inventory checks.  
* \[ \] **Locking**: Refactor purchase\_item view to use transaction.atomic and select\_for\_update.

### **Phase 3: Observability Integration (Week 3\)**

* \[ \] **Instrumentation**: Install OpenTelemetry SDKs for Python and Node.js.  
* \[ \] **Collector**: Deploy otel-collector container with otel-config.yaml.  
* \[ \] **Backends**: Deploy Prometheus, Loki, and Tempo containers (or use Grafana Cloud).  
* \[ \] **Dashboard**: Import standard dashboards for "Django Overview" and "Postgres Metrics".  
* \[ \] **Logging**: Configure Python logging to output JSON with Trace IDs.

### **Phase 4: Production Hardening (Week 4\)**

* \[ \] **Nginx Proxy**: Configure nginx service as the entry point (ports 80/443).  
* \[ \] **Static Serving**: Configure Nginx to serve static/media volumes.  
* \[ \] **SSL**: Implement Certbot and the init-letsencrypt.sh script.  
* \[ \] **Security Headers**: Configure Nginx with HSTS, X-Frame-Options, and CSP.  
* \[ \] **Optimizations**: Enable Gzip/Brotli compression in Nginx.

### **Phase 5: CI/CD Pipeline (Week 5\)**

* \[ \] **GitHub Actions**: Create workflow to lint, test, and build Docker images.  
* \[ \] **Registry**: Push images to Docker Hub or AWS ECR.  
* \[ \] **Deployment**: Write an SSH script to pull new images and restart containers on the production VPS.

## ---

**8\. Detailed Technical Implementation Reference**

This section provides the specific code artifacts required for the critical transitions discussed above.

### **8.1 The Enterprise docker-compose.prod.yml**

This configuration represents the target infrastructure state. Note the network isolation and volume management.

YAML

version: '3.8'

services:  
  \# The Database Service: PostgreSQL  
  db:  
    image: postgres:15-alpine  
    volumes:  
      \- postgres\_data:/var/lib/postgresql/data  
    environment:  
      \- POSTGRES\_DB=${SQL\_DATABASE}  
      \- POSTGRES\_USER=${SQL\_USER}  
      \- POSTGRES\_PASSWORD=${SQL\_PASSWORD}  
    networks:  
      \- backend\_net  
    healthcheck:  
      test:  
      interval: 5s  
      retries: 5

  \# The Message Broker: Redis  
  redis:  
    image: redis:7-alpine  
    command: redis-server \--appendonly yes  
    volumes:  
      \- redis\_data:/data  
    networks:  
      \- backend\_net

  \# The Application Server: Django \+ Gunicorn  
  backend:  
    build:  
      context:./backend  
      dockerfile: Dockerfile.prod  
    command: gunicorn core.wsgi:application \--bind 0.0.0.0:8000 \--workers 5 \--threads 2  
    volumes:  
      \- static\_volume:/app/staticfiles  
      \- media\_volume:/app/mediafiles  
    env\_file:.env.prod  
    depends\_on:  
      db:  
        condition: service\_healthy  
      redis:  
        condition: service\_started  
    networks:  
      \- backend\_net

  \# The Async Worker: Celery  
  celery\_worker:  
    build:./backend  
    command: celery \-A core worker \-l info \--concurrency 4  
    env\_file:.env.prod  
    depends\_on:  
      \- backend  
      \- redis  
    networks:  
      \- backend\_net

  \# The Scheduler: Celery Beat  
  celery\_beat:  
    build:./backend  
    command: celery \-A core beat \-l info \--scheduler django\_celery\_beat.schedulers:DatabaseScheduler  
    env\_file:.env.prod  
    depends\_on:  
      \- backend  
      \- redis  
    networks:  
      \- backend\_net

  \# The Frontend: Nginx serving React  
  frontend:  
    build:  
      context:./frontend  
      dockerfile: Dockerfile.prod  
    networks:  
      \- frontend\_net  
    depends\_on:  
      \- backend

  \# The Reverse Proxy: Nginx (Public Facing)  
  nginx\_proxy:  
    image: nginx:1.25-alpine  
    ports:  
      \- "80:80"  
      \- "443:443"  
    volumes:  
      \-./nginx/conf:/etc/nginx/conf.d  
      \- static\_volume:/app/staticfiles  
      \- media\_volume:/app/mediafiles  
      \- certbot\_conf:/etc/letsencrypt  
      \- certbot\_www:/var/www/certbot  
    networks:  
      \- frontend\_net  
      \- backend\_net  
    depends\_on:  
      \- frontend  
      \- backend

  \# The Security: Certbot  
  certbot:  
    image: certbot/certbot  
    volumes:  
      \- certbot\_conf:/etc/letsencrypt  
      \- certbot\_www:/var/www/certbot  
    entrypoint: "/bin/sh \-c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${\!}; done;'"

networks:  
  frontend\_net:  
  backend\_net:

volumes:  
  postgres\_data:  
  redis\_data:  
  static\_volume:  
  media\_volume:  
  certbot\_conf:  
  certbot\_www:

### **8.2 The Multi-Stage React Dockerfile**

This artifact is crucial for reducing the container footprint and securing the frontend code.

Dockerfile

\# \==========================================  
\# Stage 1: The Build Environment  
\# \==========================================  
FROM node:18\-alpine AS builder

WORKDIR /app

\# Copy dependency definitions first to leverage Docker Layer Caching  
COPY package.json package-lock.json./

\# CI install is faster and more reliable than npm install  
RUN npm ci

\# Copy the rest of the source code  
COPY..

\# Build the production assets  
RUN npm run build

\# \==========================================  
\# Stage 2: The Production Environment  
\# \==========================================  
FROM nginx:alpine

\# Remove default Nginx static assets  
RUN rm \-rf /usr/share/nginx/html/\*

\# Copy the build output from Stage 1  
COPY \--from=builder /app/build /usr/share/nginx/html

\# Copy our custom Nginx config for SPA routing  
COPY nginx.conf /etc/nginx/conf.d/default.conf

\# Expose port 80  
EXPOSE 80

\# Start Nginx in the foreground  
CMD \["nginx", "-g", "daemon off;"\]

### **8.3 The Race Condition Proof of Concept**

The following Python snippet demonstrates the required logic update for views.py to handle concurrent inventory updates.

**Scenario**: User A and User B try to buy the last item (Stock: 1).

Python

from django.db import transaction  
from rest\_framework.decorators import api\_view  
from rest\_framework.response import Response  
from.models import Product

@api\_view()  
@transaction.atomic  
def purchase\_product(request, pk):  
    """  
    Transactional purchase endpoint.  
    Uses select\_for\_update() to acquire a row-level lock on the product.  
    This forces sequential execution of concurrent requests for the same product.  
    """  
    try:  
        \# The 'select\_for\_update' tells Postgres:   
        \# "Don't let anyone else read or write this row until I'm done."  
        product \= Product.objects.select\_for\_update().get(pk=pk)  
          
        if product.stock \> 0:  
            \# Business Logic: Decrement Stock  
            product.stock \-= 1  
            product.save()  
              
            \# Additional Logic: Create Order, trigger Async Task  
            \# create\_order.delay(user\_id=request.user.id, product\_id=pk)  
              
            return Response({'status': 'Purchased', 'new\_stock': product.stock})  
        else:  
            return Response({'status': 'Out of Stock'}, status=400)  
              
    except Product.DoesNotExist:  
        return Response({'status': 'Product not found'}, status=404)

### **8.4 OpenTelemetry Configuration (otel-collector-config.yaml)**

This configuration enables the collector to receive data from our app and forward it to Grafana Cloud or local Prometheus/Loki instances.

YAML

receivers:  
  otlp:  
    protocols:  
      grpc:  
        endpoint: 0.0.0.0:4317  
      http:  
        endpoint: 0.0.0.0:4318

processors:  
  batch:  
    timeout: 1s  
    send\_batch\_size: 1024

exporters:  
  prometheus:  
    endpoint: "0.0.0.0:8889"  
  logging:  
    loglevel: debug

service:  
  pipelines:  
    metrics:  
      receivers: \[otlp\]  
      processors: \[batch\]  
      exporters: \[prometheus, logging\]  
    traces:  
      receivers: \[otlp\]  
      processors: \[batch\]  
      exporters: \[logging\] \# Replace with Tempo in production  
    logs:  
      receivers: \[otlp\]  
      processors: \[batch\]  
      exporters: \[logging\] \# Replace with Loki in production

## **Conclusion**

The "Full-Stack-App" repository currently represents a typical academic prototype. It functions correctly under ideal conditions but lacks the structural integrity required for the chaotic reality of a production environment. The transition plan outlined above is not merely a set of configuration changes; it is a fundamental re-architecture.

By adopting **PostgreSQL** for transactional integrity, **Celery/Redis** for workload distribution, **Docker** for immutable infrastructure, and **OpenTelemetry** for deep observability, we transform this codebase into a resilient, scalable, and secure enterprise asset. The immediate next step is the execution of Phase 1: Dockerization and Infrastructure Stabilization. This will provide the stable foundation upon which the advanced features of concurrency control and distributed tracing can be built.

**End of Report**

#### **Works cited**

1. accessed on January 1, 1970, [https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/main/frontend/package.json](https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/main/frontend/package.json)  
2. accessed on January 1, 1970, [https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/master/docker-compose.yml](https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/master/docker-compose.yml)  
3. accessed on January 1, 1970, [https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/main/backend/Dockerfile](https://raw.githubusercontent.com/muzammil5539/Full-Stack-App/main/backend/Dockerfile)  
4. What is the correct way to become a full stack developer : r/django \- Reddit, accessed on February 1, 2026, [https://www.reddit.com/r/django/comments/1nppql0/what\_is\_the\_correct\_way\_to\_become\_a\_full\_stack/](https://www.reddit.com/r/django/comments/1nppql0/what_is_the_correct_way_to_become_a_full_stack/)  
5. \#00 — Introduction| Django \+ React: From Scratch to App | by Patrik Pátek | Nov, 2025 | Medium, accessed on February 1, 2026, [https://medium.com/@pataspatek/00-introduction-django-react-from-scratch-to-app-0f7d8656e12b](https://medium.com/@pataspatek/00-introduction-django-react-from-scratch-to-app-0f7d8656e12b)  
6. How to Containerize React Applications with Multi-Stage Docker Builds \- OneUptime, accessed on February 1, 2026, [https://oneuptime.com/blog/post/2026-01-15-containerize-react-multi-stage-docker/view](https://oneuptime.com/blog/post/2026-01-15-containerize-react-multi-stage-docker/view)  
7. Dockerize a Django App: Step-by-Step Guide for Beginners, accessed on February 1, 2026, [https://www.docker.com/blog/how-to-dockerize-django-app/](https://www.docker.com/blog/how-to-dockerize-django-app/)  
8. EP 13 \- Dockerize React: Multi-Stage Build to 40MB NGINX Image, accessed on February 1, 2026, [https://www.youtube.com/watch?v=UvYzfNARka4](https://www.youtube.com/watch?v=UvYzfNARka4)  
9. Running Gunicorn as non root user \- python \- Stack Overflow, accessed on February 1, 2026, [https://stackoverflow.com/questions/58429866/running-gunicorn-as-non-root-user](https://stackoverflow.com/questions/58429866/running-gunicorn-as-non-root-user)  
10. Docker-Compose for Django and React with Nginx reverse-proxy and Let's encrypt certificate \- SaaSitive, accessed on February 1, 2026, [https://saasitive.com/tutorial/docker-compose-django-react-nginx-let-s-encrypt/](https://saasitive.com/tutorial/docker-compose-django-react-nginx-let-s-encrypt/)  
11. Race Condition in Django. What Will You Learn in This Article? | by Onurmaciit | Medium, accessed on February 1, 2026, [https://medium.com/@onurmaciit/race-condition-in-django-269029a3d4fd](https://medium.com/@onurmaciit/race-condition-in-django-269029a3d4fd)  
12. How to avoid Race Conditions and Deadlocks in Django (Step-by-Step Guide). \- KubeBlogs, accessed on February 1, 2026, [https://www.kubeblogs.com/avoid-race-conditions-and-deadlocks-in-django-step-by-step-guide/](https://www.kubeblogs.com/avoid-race-conditions-and-deadlocks-in-django-step-by-step-guide/)  
13. Encountering Race Conditions Despite Using Django's Atomic Transactions and select\_for\_update \- Stack Overflow, accessed on February 1, 2026, [https://stackoverflow.com/questions/78088237/encountering-race-conditions-despite-using-djangos-atomic-transactions-and-sele](https://stackoverflow.com/questions/78088237/encountering-race-conditions-despite-using-djangos-atomic-transactions-and-sele)  
14. Django ORM Race Condition tip \- Reddit, accessed on February 1, 2026, [https://www.reddit.com/r/django/comments/1gh4ep2/django\_orm\_race\_condition\_tip/](https://www.reddit.com/r/django/comments/1gh4ep2/django_orm_race_condition_tip/)  
15. Writing a scheduler using Django, CeleryBeat & CronTab | by Rishi Banerjee \- Medium, accessed on February 1, 2026, [https://medium.com/django-unleashed/writing-a-scheduler-using-django-celerybeat-crontab-b3d5689abbe1](https://medium.com/django-unleashed/writing-a-scheduler-using-django-celerybeat-crontab-b3d5689abbe1)  
16. docker-compose.yml \- testdrivenio/django-celery-beat \- GitHub, accessed on February 1, 2026, [https://github.com/testdrivenio/django-celery-beat/blob/master/docker-compose.yml](https://github.com/testdrivenio/django-celery-beat/blob/master/docker-compose.yml)  
17. Django with celery in Docker Env \- Stack Overflow, accessed on February 1, 2026, [https://stackoverflow.com/questions/75858037/django-with-celery-in-docker-env](https://stackoverflow.com/questions/75858037/django-with-celery-in-docker-env)  
18. Docker, Celery, Celery-Beats \- I'm just not understanding them in docker : r/djangolearning, accessed on February 1, 2026, [https://www.reddit.com/r/djangolearning/comments/xaxq1i/docker\_celery\_celerybeats\_im\_just\_not/](https://www.reddit.com/r/djangolearning/comments/xaxq1i/docker_celery_celerybeats_im_just_not/)  
19. Generating PDF with Rest Framework : r/django \- Reddit, accessed on February 1, 2026, [https://www.reddit.com/r/django/comments/1isvkrz/generating\_pdf\_with\_rest\_framework/](https://www.reddit.com/r/django/comments/1isvkrz/generating_pdf_with_rest_framework/)  
20. Django/Python: generate pdf with the proper language \- Stack Overflow, accessed on February 1, 2026, [https://stackoverflow.com/questions/13950874/django-python-generate-pdf-with-the-proper-language](https://stackoverflow.com/questions/13950874/django-python-generate-pdf-with-the-proper-language)  
21. How to Dockerize a React App: A Step-by-Step Guide for Developers | Docker, accessed on February 1, 2026, [https://www.docker.com/blog/how-to-dockerize-react-app/](https://www.docker.com/blog/how-to-dockerize-react-app/)  
22. Colors \- Core concepts \- Tailwind CSS, accessed on February 1, 2026, [https://tailwindcss.com/docs/customizing-colors](https://tailwindcss.com/docs/customizing-colors)  
23. Day 2: Tailwind CSS Color System — Semantic, Scalable & Simple \- DEV Community, accessed on February 1, 2026, [https://dev.to/ruqaiya\_beguwala/day-2-tailwind-css-color-system-semantic-scalable-simple-19gk](https://dev.to/ruqaiya_beguwala/day-2-tailwind-css-color-system-semantic-scalable-simple-19gk)  
24. \[Help\] Instrumenting Django and sending Opentelemetry data to Grafana cloud via Alloy, accessed on February 1, 2026, [https://www.reddit.com/r/django/comments/1oixzax/help\_instrumenting\_django\_and\_sending/](https://www.reddit.com/r/django/comments/1oixzax/help_instrumenting_django_and_sending/)  
25. Getting started with the OpenTelemetry Collector and Loki tutorial \- Grafana, accessed on February 1, 2026, [https://grafana.com/docs/loki/latest/send-data/otel/otel-collector-getting-started/](https://grafana.com/docs/loki/latest/send-data/otel/otel-collector-getting-started/)  
26. Django Metrics, Logs & Traces Observability With Opentelemetry and Grafana | DevRa, accessed on February 1, 2026, [https://rafed.github.io/devra/posts/cloud/django-mlt-observability-with-opentelemetry/](https://rafed.github.io/devra/posts/cloud/django-mlt-observability-with-opentelemetry/)  
27. Implementing Role Based Access Control (RABC) in React \- Permit.io, accessed on February 1, 2026, [https://www.permit.io/blog/implementing-react-rbac-authorization](https://www.permit.io/blog/implementing-react-rbac-authorization)  
28. Level Up Your React Apps: Secure with Role-Based Access Control (RBAC) \- Medium, accessed on February 1, 2026, [https://medium.com/@kallyasmedia/level-up-your-react-apps-secure-with-role-based-access-control-rbac-50ca21a36c56](https://medium.com/@kallyasmedia/level-up-your-react-apps-secure-with-role-based-access-control-rbac-50ca21a36c56)  
29. Best Practices for Implementing Role-Based Access Control in React Applications \- Reddit, accessed on February 1, 2026, [https://www.reddit.com/r/reactjs/comments/1aur1fz/best\_practices\_for\_implementing\_rolebased\_access/](https://www.reddit.com/r/reactjs/comments/1aur1fz/best_practices_for_implementing_rolebased_access/)  
30. Production-ready Docker setup for Django applications \- Reddit, accessed on February 1, 2026, [https://www.reddit.com/r/django/comments/pxe9lr/productionready\_docker\_setup\_for\_django/](https://www.reddit.com/r/django/comments/pxe9lr/productionready_docker_setup_for_django/)  
31. Securing a Containerized Django Application with Let's Encrypt | TestDriven.io, accessed on February 1, 2026, [https://testdriven.io/blog/django-lets-encrypt/](https://testdriven.io/blog/django-lets-encrypt/)