import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { initDb } from "./src/backend/db.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "./src/backend/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "teamflow-secret-key";

async function startServer() {
  await initDb();
  
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Access denied" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Invalid token" });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post("/api/auth/signup", async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email already exists" });
          return res.status(500).json({ error: err.message });
        }
        const token = jwt.sign({ id: this.lastID, email, name }, JWT_SECRET);
        res.status(201).json({ token, user: { id: this.lastID, name, email } });
      }
    );
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(400).json({ error: "User not found" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ error: "Invalid password" });

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
  });

  app.get("/api/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // --- Project Routes ---
  app.get("/api/projects", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    db.all(
      `SELECT p.* FROM projects p 
       LEFT JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.user_id = ? OR pm.user_id = ? 
       GROUP BY p.id`,
      [userId, userId],
      (err, projects) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(projects);
      }
    );
  });

  app.post("/api/projects", authenticateToken, (req: any, res) => {
    const { name, description } = req.body;
    const userId = req.user.id;

    db.run(
      "INSERT INTO projects (name, description, user_id) VALUES (?, ?, ?)",
      [name, description, userId],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const projectId = this.lastID;
        // Add creator as Admin member
        db.run(
          "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'Admin')",
          [projectId, userId],
          (memberErr) => {
            if (memberErr) return res.status(500).json({ error: memberErr.message });
            res.status(201).json({ id: projectId, name, description, user_id: userId });
          }
        );
      }
    );
  });

  app.get("/api/projects/:id", authenticateToken, (req: any, res) => {
    const projectId = req.params.id;
    const userId = req.user.id;

    db.get(
      `SELECT p.*, pm.role FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE p.id = ? AND pm.user_id = ?`,
      [projectId, userId],
      (err, project) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!project) return res.status(404).json({ error: "Project not found or access denied" });
        res.json(project);
      }
    );
  });

  app.get("/api/projects/:id/members", authenticateToken, (req: any, res) => {
    db.all(
      `SELECT u.id, u.name, u.email, pm.role FROM users u 
       JOIN project_members pm ON u.id = pm.user_id 
       WHERE pm.project_id = ?`,
      [req.params.id],
      (err, members) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(members);
      }
    );
  });

  app.post("/api/projects/:id/members", authenticateToken, (req: any, res) => {
    const { email } = req.body;
    const projectId = req.params.id;

    db.get("SELECT id FROM users WHERE email = ?", [email], (err, user: any) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: "User not found" });

      db.run(
        "INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'Member')",
        [projectId, user.id],
        (insertErr) => {
          if (insertErr) {
            if (insertErr.message.includes("UNIQUE")) return res.status(400).json({ error: "User already in project" });
            return res.status(500).json({ error: insertErr.message });
          }
          res.json({ message: "Member added successfully" });
        }
      );
    });
  });

  // --- Task Routes ---
  app.get("/api/projects/:id/tasks", authenticateToken, (req: any, res) => {
    const projectId = req.params.id;
    db.all(
      `SELECT t.*, u.name as assigned_name FROM tasks t 
       LEFT JOIN users u ON t.assigned_id = u.id 
       WHERE t.project_id = ?`,
      [projectId],
      (err, tasks) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(tasks);
      }
    );
  });

  app.post("/api/projects/:id/tasks", authenticateToken, (req: any, res) => {
    const projectId = req.params.id;
    const { title, description, due_date, priority, assigned_id } = req.body;

    db.run(
      "INSERT INTO tasks (project_id, title, description, due_date, priority, assigned_id) VALUES (?, ?, ?, ?, ?, ?)",
      [projectId, title, description, due_date, priority, assigned_id],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, project_id: projectId, title, status: 'To Do' });
      }
    );
  });

  app.patch("/api/tasks/:id", authenticateToken, (req: any, res) => {
    const { status, title, description, due_date, priority, assigned_id } = req.body;
    const updates = [];
    const params = [];

    if (status !== undefined) { updates.push("status = ?"); params.push(status); }
    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (description !== undefined) { updates.push("description = ?"); params.push(description); }
    if (due_date !== undefined) { updates.push("due_date = ?"); params.push(due_date); }
    if (priority !== undefined) { updates.push("priority = ?"); params.push(priority); }
    if (assigned_id !== undefined) { updates.push("assigned_id = ?"); params.push(assigned_id); }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    params.push(req.params.id);

    db.run(
      `UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`,
      params,
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Task updated" });
      }
    );
  });

  app.delete("/api/tasks/:id", authenticateToken, (req: any, res) => {
    db.run("DELETE FROM tasks WHERE id = ?", [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Task deleted" });
    });
  });

  // --- Dashboard Stats ---
  app.get("/api/dashboard/stats", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    
    const stats: any = {};

    db.get(
      `SELECT COUNT(DISTINCT p.id) as count FROM projects p 
       JOIN project_members pm ON p.id = pm.project_id 
       WHERE pm.user_id = ?`,
      [userId],
      (err, result: any) => {
        stats.projectsCount = result.count;
        
        db.get(
          `SELECT COUNT(*) as count FROM tasks t 
           JOIN project_members pm ON t.project_id = pm.project_id 
           WHERE pm.user_id = ?`,
          [userId],
          (err, result: any) => {
            stats.tasksCount = result.count;

            db.all(
              `SELECT status, COUNT(*) as count FROM tasks t 
               JOIN project_members pm ON t.project_id = pm.project_id 
               WHERE pm.user_id = ? GROUP BY status`,
              [userId],
              (err, rows) => {
                stats.tasksByStatus = rows;

                db.all(
                  `SELECT priority, COUNT(*) as count FROM tasks t 
                   JOIN project_members pm ON t.project_id = pm.project_id 
                   WHERE pm.user_id = ? GROUP BY priority`,
                  [userId],
                  (err, rows) => {
                    stats.tasksByPriority = rows;

                    db.all(
                      `SELECT t.*, p.name as project_name FROM tasks t 
                       JOIN projects p ON t.project_id = p.id 
                       JOIN project_members pm ON p.id = pm.project_id 
                       WHERE pm.user_id = ? ORDER BY t.created_at DESC LIMIT 5`,
                      [userId],
                      (err, rows) => {
                        stats.recentTasks = rows;
                        res.json(stats);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });


  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
