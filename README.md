1. Purpose & scope

Kumar Bakery single-vendor e-commerce site with:

Product catalog (baked goods)

Customer accounts (register / login)

Cart & simple checkout (payment integration later)

Recommendation engine (hybrid: content + collaborative)

Chatbot (rule-based + optional LLM proxy) for customer support

Admin dashboard for bakery owner to manage products and orders

This is not a multi-vendor marketplace — all products belong to Kumar Bakery.

2. High-level architecture

Frontend: static HTML/CSS/JS pages (index, product, login, register, cart, admin). Communicates with backend via REST API.

Backend: Flask API (serves frontend files too). Components:

Authentication (register / login / JWT)

Product CRUD (admin-protected)

Interaction tracking (views, add-to-cart, purchase)

Recommendations service (train + inference)

Chat service (rule-based, LLM-proxy optional)

Order management

Database: SQLite (dev) — simple SQL schema. Can migrate to PostgreSQL in prod.

Model artifacts: Pickled TF-IDF + CF model files stored in backend/models/.

Cache (optional prod): Redis for token blacklist, cached recommendations, rate-limits.

Optional: Worker (Celery) for background training, email tasks, scheduled jobs.

3. File / folder summary (concise)
ecom-reco-chat/
├─ backend/
│  ├─ app.py                # Flask app + API endpoints
│  ├─ db.py                 # DB helpers & schema init
│  ├─ recommender.py        # build & serve recommendations
│  ├─ chat_service.py       # rule-based + LLM-proxy
│  ├─ auth.py               # auth helpers (hashing, JWT)
│  ├─ models/               # saved model artifacts (pickles)
│  └─ scripts/              # seed_data.py, train_recommender.py
├─ frontend/
│  ├─ index.html
│  ├─ product.html
│  ├─ login.html
│  ├─ register.html
│  ├─ admin.html            # admin product mgmt page
│  ├─ app.js                # shared frontend logic
│  └─ styles.css
├─ infra/
│  ├─ Dockerfile
│  └─ docker-compose.yml
└─ docs/
   ├─ RECOMMENDER.md
   └─ CHATBOT.md

4. Database schema (tables & columns)

users

id INTEGER PK

email TEXT UNIQUE NOT NULL

name TEXT NOT NULL

password_hash TEXT NOT NULL

is_admin INTEGER DEFAULT 0

created_on TEXT (ISO timestamp)

products

id INTEGER PK

sku TEXT UNIQUE

name TEXT

description TEXT

category TEXT

tags TEXT (CSV)

price REAL

image_url TEXT

owner_name TEXT DEFAULT 'Kumar Bakery'

created_on TEXT

interactions

id INTEGER PK

user_id INTEGER (FK users.id)

product_id INTEGER (FK products.id)

event_type TEXT (view, cart, purchase, rating)

rating INTEGER (nullable 1–5)

timestamp TEXT

orders

id INTEGER PK

user_id INTEGER

total REAL

status TEXT (created, paid, shipped, delivered)

created_on TEXT

items TEXT (JSON string with product ids & qty)

Add indexes on interactions(product_id), interactions(user_id), and products(sku) for perf.

5. Authentication & user flow

Register

Endpoint: POST /api/register

Body: { "name","email","password" }

Server: hash password with werkzeug.security.generate_password_hash; insert user; return JWT token.

Login

Endpoint: POST /api/login

Body: { "email","password" }

Server: verify password with check_password_hash, return JWT.

Token

JWT (HS256) with payload { user_id, exp }.

Frontend stores token in localStorage (or secure cookie in prod).

Protected endpoints require header Authorization: Bearer <token>.

Auth middleware

require_auth decorator extracts & validates JWT; sets request.user = payload.

Admin

is_admin=1 for bakery owner. Admin endpoints (/api/admin/products, product create/update/delete, order management) require is_admin check.

6. API list (major endpoints) — request/response examples

Public

GET /api/products → [{id, name, price, image_url, ...}, ...]

GET /api/products/<id> → product object

GET /api/recommendations?product_id=123 → similar items (content-based)

POST /api/chat → { user_id?, message } → { reply }

Auth

POST /api/register → { token, user }

POST /api/login → { token, user }

GET /api/me (auth) → { user }

Interactions

POST /api/interactions (auth optional) { user_id, product_id, event_type, rating? } → { ok: true }

Personalized recommendations

GET /api/recommendations?user_id=42 (auth) → personalized list

Admin

POST /api/admin/products (admin) { name, description, price, ... } → new product

PUT /api/admin/products/<id> (admin) → update

DELETE /api/admin/products/<id> (admin)

Orders

POST /api/orders (auth) { user_id, items: [{product_id, qty}], total } → create order

GET /api/admin/orders (admin) → list orders

GET /api/orders/<id> (auth/admin) → order details

Responses

Use standard HTTP codes:

200 OK for success

201 Created for new resources

400 Bad Request for validation

401 Unauthorized for auth failures

403 Forbidden for admin-only access

404 Not Found for missing resources

7. Recommendation engine — full detail

Goal
Return relevant product suggestions in two modes:

Similar items — when viewing a product (content-based)

Personalized picks — on homepage / account (collaborative + hybrid)

Data inputs

Product metadata (name, description, category, tags)

Interaction logs (views, carts, purchases, ratings)

Preprocessing

Concatenate product text: text = name + " " + description + " " + category + " " + tags

Lowercase, basic cleanup (strip punctuation, stopword removal handled by TF-IDF).

Content-based module

TF-IDF vectorizer (sklearn.feature_extraction.text.TfidfVectorizer)

Fit on product texts; build item matrix X_item

Build NearestNeighbors(metric='cosine') on X_item

Query similar items: find nearest neighbors excluding itself

Collaborative module (implicit)

Build user-item matrix R where cell = implicit score

Weights: purchase=5, cart=3, view=1, rating overrides if present

Approaches (choose one by scale):

Small scale: compute cosine_similarity(R.T, user_vector) to score items

Medium/large: use TruncatedSVD (latent factors) or implicit library ALS

Save model artifacts: item_ids.pkl, tfidf.pkl, cf_model.pkl

Hybrid scoring

For user recommendations, compute:

cf_scores from CF

content_scores for items similar to user’s interacted items (or category-based)

final_score = alpha * cf_scores + (1 - alpha) * content_scores

Default alpha = 0.7 (favor CF). Tune with A/B tests.

Cold start

New user: show popular items (aggregate interaction scores), top categories, or curated picks (e.g., bakery specials).

New product: recommend via content-based similarity.

Serving

Recompute models nightly (or as new interactions accumulate)

Precompute top-N recs per user and store in Redis or as DB table (user_recs(user_id, items_json)).

API /api/recommendations reads precomputed or computes on-the-fly (acceptable for small catalogs).

Evaluation metrics

Precision@k, Recall@k, NDCG@k

Business KPIs: CTR on recommended items, conversion rate, average order value uplift.

8. Chatbot — design & behavior

Capabilities

Answer FAQs: shipping, returns, bakery hours, popular items, allergies (contains nuts/dairy).

Assist with order tracking (requires auth & order id).

Provide product recommendations in chat.

Escalation to human (email / phone) when necessary.

Architecture

Intent matcher / rule-based

Regex patterns for common intents (returns, shipping, order status, ingredients).

Quick deterministic replies; low latency.

Example: r'.*\b(return|refund)\b.*' → return policy text.

Entity extraction (light)

Extract order_id (pattern like ORD1234), pin (6-digit), product name string matches.

For order status, require auth or verify email + OTP.

LLM-proxy (optional)

For human-like responses, forward to LLM (OpenAI etc.) after redaction of PII.

Limit context size; only send product descriptions / sanitized order status if authenticated.

Enforce rate-limits and a guardrail to avoid leaking user data.

Dialog state

Save last few messages for context (DB or ephemeral in-memory per session).

For order flows: track state {expecting_order_id: true} to gather details.

Security & Privacy

Do not send full unredacted PII / payment details to LLM.

Require authentication for order-specific info.

Keep conversation logs encrypted at rest if they contain user identifiers.

Endpoints

POST /api/chat -> { user_id?, message } -> { reply }

If authenticated and message asks about order, fetch order status from DB and return masked info.

Otherwise, run rule-based -> LLM fallback.

9. Frontend pages & UX flows

Public pages

index.html: hero, category list, recommended products (personalized if logged in)

product.html?id=XXX: detail page, add-to-cart, show similar items (calls /api/recommendations?product_id=XXX)

login.html / register.html: auth forms (store token)

cart.html: show items, place order (calls /api/orders)

chat widget: persistent floating chat UI; sends to /api/chat

Admin pages (protected by is_admin)

admin.html: product management (create / edit / delete)

admin/orders.html: view & update order statuses

Key UX details

After viewing a product, call POST /api/interactions event_type=view

When adding to cart → interactions event cart

After successful checkout, record purchase events for items

Display recommended section: "You may also like" (product page) and "Recommended for you" (homepage)

10. Sample user scenarios (step-by-step)

A. New user registers and browses

User opens register.html, submits details → POST /api/register → receives JWT.

Frontend stores JWT in localStorage.

On product view: frontend calls POST /api/interactions with token (or user_id) and event_type=view.

On homepage /api/recommendations?user_id=... returns personalized picks (if enough history) or top items.

B. User asks chatbot "What is your return policy?"

Chat widget sends { message: "What is your return policy?" } → /api/chat.

Rule-based matches return/refund pattern → returns static policy text.

C. User wants order status

Chat message contains order id. If user authenticated (token present), server fetches order and replies masked status. If not authenticated, ask for email + OTP or instruct to login.

D. Admin adds a new product

Admin logs in; token with is_admin=1.

Hits POST /api/admin/products with product data → inserts product with owner_name = 'Kumar Bakery'.

Trigger model retrain (background) or mark rebuild for nightly trainer.

11. Deployment & infra recommendations

Dev

Use Docker for reproducibility. docker-compose with web (Flask) + Redis (optional) + Postgres (optional).

SQLite is fine for prototyping.

Prod

Use PostgreSQL.

Use Gunicorn + Nginx proxy (HTTPS via Let's Encrypt).

Use Redis for caching recommendations, session invalidation (logout), and rate-limiting.

Background job runner (Celery + Redis) for retraining, email, scheduled tasks.

Secrets: store SECRET_KEY and any LLM API keys in env (do not commit).

Scaling

Precompute top-N recs per user; serve from Redis to reduce latency.

Use vector DB (Faiss) for item similarity at scale.

Use implicit library ALS for CF large scale.

12. Monitoring, metrics & ML ops

Track:

Interactions ingestion rate

Recommendation CTR, add-to-cart rate from recs, conversion rate

Chatbot fallback rate to LLM or to human handoff

Model staleness (time since last retrain)

Store logs for A/B tests; experiment with alpha hybrid weight.

Retrain schedule: nightly or weekly depending on interaction volume.

13. Security checklist

Use HTTPS; set HSTS.

Use secure JWT handling; rotate secrets periodically.

Hash passwords with pbkdf2/bcrypt (Werkzeug uses PBKDF2 by default).

Input validation & parameterized DB queries to prevent injection.

Rate-limit critical endpoints (login, chat).

Redact PII before any external LLM calls.

Implement admin role checks server-side.

14. Next recommended deliverables I can generate right now

(Choose any; I’ll produce the files/content immediately.)

Full backend code: app.py, db.py, auth.py, recommender.py, chat_service.py, schema.sql, and scripts/seed_data.py.

Full frontend pages: index.html, product.html, login.html, register.html, admin.html, app.js, styles.css.

train_recommender.py with synthetic data and saved pickles so you can run and test recommendations locally.

Dockerfile + docker-compose.yml for a dev environment (Flask + Redis + Postgres).

RECOMMENDER.md and CHATBOT.md detailed docs suitable for your docs/ folder.
