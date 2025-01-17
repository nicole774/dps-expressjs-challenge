import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';

const app = express();
const port = 3000;

app.use(express.json());

const db = new Database('./db/db.sqlite3');

db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
    );
    CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
    );
`);

// Crud for project part
app.get('/projects', (req: Request, res: Response) => {
	const projects = db.prepare('SELECT * FROM projects').all();
	res.json(projects);
});

app.get('/projects/:id', (req: Request, res: Response) => {
	const project = db
		.prepare('SELECT * FROM projects WHERE id = ?')
		.get(req.params.id);
	if (project) {
		res.json(project);
	} else {
		res.status(404).json({ error: 'Project not found' });
	}
});

app.post('/projects', (req: Request, res: Response) => {
	const { name, description } = req.body;
	const info = db
		.prepare('INSERT INTO projects (name, description) VALUES (?, ?)')
		.run(name, description);
	res.status(201).json({
		id: info.lastInsertRowid,
		message: 'Project created',
	});
});

app.put('/projects/:id', (req: Request, res: Response) => {
	const { name, description } = req.body;
	db.prepare(
		'UPDATE projects SET name = ?, description = ? WHERE id = ?',
	).run(name, description, req.params.id);
	res.json({ message: 'Project updated' });
});

app.delete('/projects/:id', (req: Request, res: Response) => {
	db.prepare('DELETE FROM reports WHERE project_id = ?').run(req.params.id); // Delete associated reports first
	db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
	res.json({ message: 'Project deleted' });
});

// Crud for project reports
app.get('/reports', (req: Request, res: Response) => {
	const reports = db.prepare('SELECT * FROM reports').all();
	res.json(reports);
});

app.get('/reports/:id', (req: Request, res: Response) => {
	const report = db
		.prepare('SELECT * FROM reports WHERE id = ?')
		.get(req.params.id);
	if (report) {
		res.json(report);
	} else {
		res.status(404).json({ error: 'Report not found' });
	}
});

app.post('/projects/:projectId/reports', (req: Request, res: Response) => {
	const { title, content } = req.body;
	try {
		const info = db
			.prepare(
				'INSERT INTO reports (project_id, title, content) VALUES (?, ?, ?)',
			)
			.run(req.params.projectId, title, content);
		res.status(201).json({
			id: info.lastInsertRowid,
			message: 'Report created',
		});
	} catch (error) {
		res.status(500).json({
			error: 'Failed to create report. Check if project exists.',
		});
	}
});

app.put('/reports/:id', (req: Request, res: Response) => {
	const { title, content } = req.body;
	db.prepare('UPDATE reports SET title = ?, content = ? WHERE id = ?').run(
		title,
		content,
		req.params.id,
	);
	res.json({ message: 'Report updated' });
});

app.delete('/reports/:id', (req: Request, res: Response) => {
	db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id);
	res.json({ message: 'Report deleted' });
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
