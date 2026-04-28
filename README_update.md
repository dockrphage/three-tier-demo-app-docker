
# 🐳 **Three‑Tier Demo Application (Stabilized Architecture Edition)**  
*A fully working, production‑style 3‑tier stack using React, Node.js, MySQL, and NGINX — with correct DNS resolution, port alignment, and container lifecycle stability.*

---

## 🌐 **Updated Architecture Overview**

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌──────────────┐
│  Browser   │ ─▶  │   NGINX    │ ─▶  │  App Tier  │ ─▶  │   MySQL DB   │
│ (React UI) │ ◀─  │ Reverse    │ ◀─  │ Node/Express│ ◀─ │   Storage     │
└────────────┘     │  Proxy     │     └────────────┘     └──────────────┘
                    │ + Static   │
                    │   Files    │
                    └────────────┘
```

### **What’s new in this stabilized version**
- **Backend now listens on port 3000** (previously 3001)
- **Missing dependency (`cors`) added** so the app no longer crashes on startup
- **NGINX now uses dynamic DNS resolution** via Docker’s internal resolver (`127.0.0.11`)
- **Upstream resolution happens at request time**, preventing startup failures
- **All containers now attach correctly to the shared network**
- **End‑to‑end flow verified:**  
  `Browser → NGINX → Backend → MySQL → Backend → NGINX → Browser`

---

## 🚀 **How to Run the Stabilized Stack**

### **Start everything**
```bash
docker compose up -d --build
```

### **Check container health**
```bash
docker compose ps
```

You should see:

- `nginx` — Up  
- `app` — Up  
- `web` — Up  
- `db` — Up  

### **Verify API**
```bash
curl http://localhost/api/transactions
```

Expected:

```
[]
```

### **Open the frontend**
Visit:

```
http://localhost
```

You can now create and view transactions through the UI.

---

## 🔧 **Key Fixes Included in This Version**

### **1. Backend stability**
- Added missing dependency:
  ```bash
  npm install cors
  ```
- Standardized port:
  ```js
  const port = process.env.PORT || 3000;
  ```

### **2. NGINX DNS resolution**
Inside `nginx.conf`:

```nginx
resolver 127.0.0.11 valid=30s;
set $backend app:3000;

location /api/ {
    proxy_pass http://$backend;
}
```

This ensures NGINX resolves `app` **even if the container starts later**.

### **3. Network correctness**
All services now attach to:

```
three-tier-demo-app_app-net
```

### **4. Verified end‑to‑end flow**
- UI loads from NGINX  
- API calls route through `/api/*`  
- Backend queries MySQL  
- Responses return to UI  

---

## 🧪 **Troubleshooting (Updated)**

### **Backend returns 502**
Check if backend is running:
```bash
docker logs app
```

### **NGINX cannot resolve upstream**
Check DNS:
```bash
docker exec -it nginx ping -c1 app
```

### **DB connection errors**
Ensure MySQL is ready:
```bash
docker logs db
```

---

## 📦 **What This Version Represents**

This README reflects the **correct, stable, production‑like architecture** after:

- fixing backend crashes  
- aligning ports  
- stabilizing NGINX  
- ensuring Docker DNS works  
- validating the full 3‑tier flow  

This is now the **canonical main branch** for the project.
