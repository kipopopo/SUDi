import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer';
import { uploadFile } from './src/file-upload';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { generateEcardPdf } from './src/ecardGenerator';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.sendStatus(403); // Token no longer valid
    }
    req.userId = user.id;
    next();
  });
};

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3001;

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-ecard-backdrop', upload.single('ecardBackdrop'), uploadFile);

app.get('/api/ecard-backdrop/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  });
});

const verificationCodes = new Map<string, { code: string, expires: number }>();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const initialDepartments = [
  { id: '1', name: 'Marketing' },
  { id: '2', name: 'Engineering' },
  { id: '3', name: 'Human Resources' },
  { id: '4', name: 'Sales' },
];

const initialParticipants = [
  { id: '101', name: 'John Doe', email: 'john.doe@example.com', role: 'Pembangun Frontend', departmentId: '2' },
  { id: '102', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'Pengurus Pemasaran', departmentId: '1' },
  { id: '103', name: 'Peter Jones', email: 'peter.jones@example.com', role: 'Eksekutif Jualan', departmentId: '4' },
  { id: '104', name: 'Mary Johnson', email: 'mary.j@example.com', role: 'Pakar Sumber Manusia', departmentId: '3' },
  { id: '105', name: 'Sam Wilson', email: 'sam.w@example.com', role: 'Pembangun Backend', departmentId: '2' },
  { id: '106', name: 'Patricia Williams', email: 'pat.w@example.com', role: 'Pakar SEO', departmentId: '1' },
];

const initialTemplates = [
  { id: 't1', name: 'Tech Conference Invite', subject: 'Invitation: Annual Tech Conference 2024', body: `Hello {name},

You are invited to our annual tech conference...`, category: 'Event Invitations' },
  { id: 't2', name: 'Product Launch Announcement', subject: 'Introducing Our New Product!', body: `Hi {name},

We are excited to announce the launch of our new product...`, category: 'Marketing' },
  { id: 't3', name: 'Internal Q3 Update', subject: 'Q3 Company Performance Review', body: `Hello Team,

Please join us for the quarterly review...`, category: 'Internal Communication' }
];

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT
  )`,
   (err) => {
    if (err) {
      console.error(err.message);
    }
    db.all('SELECT * FROM departments', [], (err, rows) => {
      if (err) {
        console.error(err.message);
      }
      if (rows.length === 0) {
        const stmt = db.prepare('INSERT INTO departments VALUES (?, ?)');
        initialDepartments.forEach(dep => {
          stmt.run(dep.id, dep.name);
        });
        stmt.finalize();
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    role TEXT,
    departmentId TEXT
  )`,
   (err) => {
    if (err) {
      console.error(err.message);
    }
    db.all('SELECT * FROM participants', [], (err, rows) => {
      if (err) {
        console.error(err.message);
      }
      if (rows.length === 0) {
        const stmt = db.prepare('INSERT INTO participants VALUES (?, ?, ?, ?, ?)');
        initialParticipants.forEach(p => {
          stmt.run(p.id, p.name, p.email, p.role, p.departmentId);
        });
        stmt.finalize();
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT,
    subject TEXT,
    body TEXT,
    category TEXT,
    ecardBackdropPath TEXT,
    nameX INTEGER,
    nameY INTEGER,
    nameFontSize INTEGER,
    nameColor TEXT,
    roleX INTEGER,
    roleY INTEGER,
    roleFontSize INTEGER,
    roleColor TEXT
  )`,
   (err) => {
    if (err) {
      console.error(err.message);
    }
    // Add ecardBackdropPath column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN ecardBackdropPath TEXT", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add nameX column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN nameX INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add nameY column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN nameY INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add nameFontSize column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN nameFontSize INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add nameColor column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN nameColor TEXT", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add roleX column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN roleX INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add roleY column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN roleY INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add roleFontSize column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN roleFontSize INTEGER", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });
    // Add roleColor column if it doesn't exist
    db.run("ALTER TABLE templates ADD COLUMN roleColor TEXT", (alterErr) => {
      if (alterErr && !alterErr.message.includes('duplicate column name')) {
        console.error("Error altering templates table:", alterErr.message);
      }
    });

    db.all('SELECT * FROM templates', [], (err, rows) => {
      if (err) {
        console.error(err.message);
      }
      if (rows.length === 0) {
        const stmt = db.prepare('INSERT INTO templates (id, name, subject, body, category, ecardBackdropPath) VALUES (?, ?, ?, ?, ?, ?)');
        initialTemplates.forEach(t => {
          stmt.run(t.id, t.name, t.subject, t.body, t.category, null);
        });
        stmt.finalize();
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS blast_history (
    id TEXT PRIMARY KEY,
    templateName TEXT,
    subject TEXT,
    recipientGroup TEXT,
    recipientCount INTEGER,
    sentDate TEXT,
    status TEXT,
    scheduledDate TEXT,
    deliveryRate REAL,
    openRate REAL,
    clickRate REAL,
    unsubscribeRate REAL,
    body TEXT,
    recipientIds TEXT,
    detailedRecipientActivity TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    username TEXT UNIQUE,\n    password TEXT,\n    email TEXT UNIQUE,\n    firstName TEXT,\n    lastName TEXT,\n    role TEXT\n  )`, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      db.get("SELECT COUNT(*) as count FROM users", (err, row: { count: number }) => {
        if (err) {
          console.error('Error counting users:', err.message);
        } else if (row.count === 0) {
          const salt = bcrypt.genSaltSync(10);
          const hash = bcrypt.hashSync('superadmin', salt);
          db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['superadmin', hash, 'SuperAdmin'], (err) => {
            if (err) {
              console.error('Error inserting superadmin:', err.message);
            }
          });
        }
      });
    }
  });

  // Add new columns if they don't exist (run after table creation)
  // Note: UNIQUE constraints removed from ALTER TABLE to avoid issues with existing data
  // Uniqueness will be enforced by application logic
  db.run("ALTER TABLE users ADD COLUMN email TEXT", (alterErr) => {
    if (alterErr && !alterErr.message.includes('duplicate column name')) {
      console.error("Error altering users table for email:", alterErr.message);
    }
  });
  db.run("ALTER TABLE users ADD COLUMN firstName TEXT", (alterErr) => {
    if (alterErr && !alterErr.message.includes('duplicate column name')) {
      console.error("Error altering users table for firstName:", alterErr.message);
    }
  });
  db.run("ALTER TABLE users ADD COLUMN lastName TEXT", (alterErr) => {
    if (alterErr && !alterErr.message.includes('duplicate column name')) {
      console.error("Error altering users table for lastName:", alterErr.message);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS settings (\n    userId TEXT PRIMARY KEY\n  )`, (err) => {
    if (err) {
      console.error('Error creating settings table:', err.message);
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS global_settings (\n    id INTEGER PRIMARY KEY DEFAULT 1,\n    globalHeader TEXT,\n    globalFooter TEXT\n  )`, (err) => {
    if (err) {
      console.error('Error creating global_settings table:', err.message);
    } else {
      // Insert default global settings if the table is empty
      db.get('SELECT COUNT(*) as count FROM global_settings', [], (err, row: { count: number }) => {
        if (err) {
          console.error('Error counting global_settings:', err.message);
        } else if (row.count === 0) {
          db.run('INSERT INTO global_settings (id, globalHeader, globalFooter) VALUES (?, ?, ?)', [
            1,
            '<!-- Your global header HTML goes here. It will be automatically added to the top of every email. -->',
            '<!-- Your global footer HTML goes here. It will be automatically added to the bottom of every email. -->\n<div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; margin-top: 20px; font-family: sans-serif; font-size: 12px; color: #64748b;">\n    <p>SUDi HQ, Persiaran Perdana, 62502 Putrajaya</p>\n    <p>&copy; 2025 FELDA. All rights reserved.</p>\n    <p><a href="#" style="color: #9333ea;">Unsubscribe</a> | <a href="#" style="color: #9333ea;">Privacy Policy</a></p>\n</div>'
          ], (err) => {
            if (err) {
              console.error('Error inserting default global settings:', err.message);
            }
          });
        }
      });
    }
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running' });
});

app.post('/api/send-verification-code', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes

  verificationCodes.set(email, { code, expires });

  try {
    await transporter.sendMail({
      from: `"SUDI Verification" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your SUDI Verification Code',
      text: `Your verification code is: ${code}`,
      html: `<b>Your verification code is: ${code}</b>`,
    });
    res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const stored = verificationCodes.get(email);

  if (!stored) {
    return res.status(400).json({ error: 'No verification code found for this email' });
  }

  if (stored.expires < Date.now()) {
    verificationCodes.delete(email);
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  if (stored.code === code) {
    verificationCodes.delete(email);
    res.status(200).json({ message: 'Email verified successfully' });
  } else {
    res.status(400).json({ error: 'Invalid verification code' });
  }
});

// Departments API
app.get('/api/departments', (req, res) => {
  db.all('SELECT * FROM departments', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/departments', (req, res) => {
  const { id, name } = req.body;
  db.run('INSERT INTO departments (id, name) VALUES (?, ?)', [id, name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, name });
  });
});

app.put('/api/departments/:id', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE departments SET name = ? WHERE id = ?', [name, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: req.params.id, name });
  });
});

app.delete('/api/departments/:id', (req, res) => {
  db.run('DELETE FROM departments WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deletedID: req.params.id });
  });
});

// Participants API
app.get('/api/participants', (req, res) => {
  db.all('SELECT * FROM participants', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/participants', (req, res) => {
  const { id, name, email, role, departmentId } = req.body;
  db.run('INSERT INTO participants (id, name, email, role, departmentId) VALUES (?, ?, ?, ?, ?)', [id, name, email, role, departmentId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id, name, email, role, departmentId });
  });
});

app.put('/api/participants/:id', (req, res) => {
  const { name, email, role, departmentId } = req.body;
  db.run('UPDATE participants SET name = ?, email = ?, role = ?, departmentId = ? WHERE id = ?', [name, email, role, departmentId, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: req.params.id, name, email, role, departmentId });
  });
});

app.delete('/api/participants/:id', (req, res) => {
  db.run('DELETE FROM participants WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deletedID: req.params.id });
  });
});

app.post('/api/blast', async (req, res) => {
  const { templateId, recipientIds, senderProfile, blastDetails, globalHeader, globalFooter } = req.body;

  if (!templateId || !recipientIds || !senderProfile) {
    return res.status(400).json({ error: 'templateId, recipientIds, and senderProfile are required' });
  }

  if (!senderProfile.verified) {
    return res.status(400).json({ error: 'Sender email is not verified' });
  }

  try {
    const template = await new Promise<any>((resolve, reject) => {
      db.get('SELECT * FROM templates WHERE id = ?', [templateId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const recipients = await new Promise<any[]>((resolve, reject) => {
      const placeholders = recipientIds.map(() => '?').join(',');
      db.all(`SELECT * FROM participants WHERE id IN (${placeholders})`, recipientIds, (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    for (const recipient of recipients) {
      const personalizedBody = template.body.replace(/{name}/g, recipient.name).replace(/{email}/g, recipient.email).replace(/{role}/g, recipient.role);
      const fullHtml = `${globalHeader}${personalizedBody}${globalFooter}`;

      let mailOptions: nodemailer.SendMailOptions = {
        from: `"${senderProfile.name}" <${process.env.SMTP_USER}>`,
        replyTo: senderProfile.email,
        to: recipient.email,
        subject: template.subject,
        html: fullHtml,
      };

      if (template.ecardBackdropPath) {
        const backdropPath = path.join(__dirname, template.ecardBackdropPath);
        const backdropImageUrl = `data:image/png;base64,${fs.readFileSync(backdropPath, 'base64')}`;

        const pdfBase64 = await generateEcardPdf({
            name: recipient.name,
            role: recipient.role,
            backdropImageUrl: backdropImageUrl,
            nameX: template.nameX,
            nameY: template.nameY,
            nameFontSize: template.nameFontSize,
            nameColor: template.nameColor,
            roleX: template.roleX,
            roleY: template.roleY,
            roleFontSize: template.roleFontSize,
            roleColor: template.roleColor,
        });

        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        mailOptions.attachments = [
            {
                filename: 'ecard.pdf',
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ];
      }

      await transporter.sendMail(mailOptions);
    }

    const detailedRecipientActivity = recipients.map(r => ({ participantId: r.id, name: r.name, email: r.email, status: 'Sent' }));

    const historyItem = {
      id: `hist_${Date.now()}`,
      templateName: blastDetails.templateName,
      subject: blastDetails.subject,
      recipientGroup: blastDetails.departmentName,
      recipientCount: blastDetails.count,
      status: 'Completed',
      sentDate: new Date().toISOString(),
      body: template.body,
      recipientIds: JSON.stringify(recipientIds),
      detailedRecipientActivity: JSON.stringify(detailedRecipientActivity),
      deliveryRate: 100,
      openRate: 0,
      clickRate: 0,
      unsubscribeRate: 0,
    };

    db.run('INSERT INTO blast_history (id, templateName, subject, recipientGroup, recipientCount, status, sentDate, body, recipientIds, detailedRecipientActivity, deliveryRate, openRate, clickRate, unsubscribeRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [historyItem.id, historyItem.templateName, historyItem.subject, historyItem.recipientGroup, historyItem.recipientCount, historyItem.status, historyItem.sentDate, historyItem.body, historyItem.recipientIds, historyItem.detailedRecipientActivity, historyItem.deliveryRate, historyItem.openRate, historyItem.clickRate, historyItem.unsubscribeRate]);

    res.status(200).json({ message: 'Email blast sent successfully' });
  } catch (error) {
    console.error('Error sending blast:', error);
    res.status(500).json({ error: 'Failed to send email blast' });
  }
});

// Templates API
app.get('/api/templates', (req, res) => {
  db.all('SELECT * FROM templates', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/templates', (req, res) => {
  const { id, name, subject, body, category, ecardBackdropPath, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor } = req.body;
  db.run('INSERT INTO templates (id, name, subject, body, category, ecardBackdropPath, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, name, subject, body, category, ecardBackdropPath, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get('SELECT * FROM templates WHERE id = ?', [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

app.put('/api/templates/:id', (req, res) => {
  const { name, subject, body, category, ecardBackdropPath, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor } = req.body;
  db.run('UPDATE templates SET name = ?, subject = ?, body = ?, category = ?, ecardBackdropPath = ?, nameX = ?, nameY = ?, nameFontSize = ?, nameColor = ?, roleX = ?, roleY = ?, roleFontSize = ?, roleColor = ? WHERE id = ?', [name, subject, body, category, ecardBackdropPath, nameX, nameY, nameFontSize, nameColor, roleX, roleY, roleFontSize, roleColor, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    db.get('SELECT * FROM templates WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(row);
    });
  });
});

app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM blast_history ORDER BY sentDate DESC', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const history = rows.map(row => ({
      ...row,
      detailedRecipientActivity: JSON.parse(row.detailedRecipientActivity || '[]'),
      recipientIds: JSON.parse(row.recipientIds || '[]'),
    }));
    res.json(history);
  });
});

app.delete('/api/templates/:id', (req, res) => {
  db.run('DELETE FROM templates WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deletedID: req.params.id });
  });
});

app.post('/api/register', (req, res) => {
  const { username, password, email, firstName, lastName, confirmPassword } = req.body;

  // Validation
  if (!username || !password || !email || !firstName || !lastName || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  // Password strength validation
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one uppercase letter' });
  }
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one lowercase letter' });
  }
  if (!/\d/.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one number' });
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ error: 'Password must include at least one special character' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db.run('INSERT INTO users (username, password, email, firstName, lastName, role) VALUES (?, ?, ?, ?, ?, ?)', [username, hash, email, firstName, lastName, 'User'], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        if (err.message.includes('username')) {
          return res.status(400).json({ error: 'Username already exists' });
        } else if (err.message.includes('email')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, username, email, firstName, lastName });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: 86400 });
    res.status(200).json({ auth: true, token });
  });
});

// User Settings API
app.get('/api/user/settings', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  db.get('SELECT * FROM settings WHERE userId = ?', [userId], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      // Return default settings if none found
      res.json({ userId, globalHeader: '', globalFooter: '' });
    }
  });
});

app.put('/api/user/settings', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  // Currently no user-specific settings other than userId, but keeping the structure
  res.status(200).json({ userId });
});

// Global Settings API (no authentication required for now, but could add admin check)
app.get('/api/global-settings', (req, res) => {
  db.get('SELECT globalHeader, globalFooter FROM global_settings WHERE id = 1', [], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.json({ globalHeader: '', globalFooter: '' }); // Default empty
    }
  });
});

app.put('/api/global-settings', (req, res) => {
  const { globalHeader, globalFooter } = req.body;
  db.run(
    'UPDATE global_settings SET globalHeader = ?, globalFooter = ? WHERE id = 1',
    [globalHeader, globalFooter],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.get('SELECT globalHeader, globalFooter FROM global_settings WHERE id = 1', [], (err, row) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(row);
      });
    }
  );
});

app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, firstName, lastName, role FROM users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ deletedID: req.params.id });
  });
});

app.listen(port, () => {
  
});