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
import { emailService } from './src/email/emailService';

interface AuthenticatedRequest extends Request {
  user?: any; 
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); 

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(bodyParser.json());
const port = 3001;

const upload = multer({ dest: 'uploads/' });

app.post('/api/upload-ecard-backdrop', upload.single('ecardBackdrop'), uploadFile);

app.get(/\/api\/ecard-backdrop\/(.*)/, (req, res) => {
  const filename = (req.params as any)[0];
  const filePath = path.join(__dirname, 'uploads', filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.sendFile(filePath);
  });
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
  { id: 't1', name: 'Tech Conference Invite', subject: 'Invitation: Annual Tech Conference 2024', body: `Hello {name},` },
  { id: 't2', name: 'Product Launch Announcement', subject: 'Introducing Our New Product!', body: `Hi {name},` },
  { id: 't3', name: 'Internal Q3 Update', subject: 'Q3 Company Performance Review', body: `Hello Team,` }
];

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error(err.message);
  }
});

const logActivity = (user: string, action: string, details: string) => {
  const timestamp = new Date().toISOString();
  db.run('INSERT INTO activity_logs (user, action, details, timestamp) VALUES (?, ?, ?, ?)', [user, action, details, timestamp]);
};

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS departments (id TEXT PRIMARY KEY, name TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS participants (id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, departmentId TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, name TEXT, subject TEXT, body TEXT, category TEXT, ecardBackdropPath TEXT, nameX INTEGER, nameY INTEGER, nameFontSize INTEGER, nameColor TEXT, roleX INTEGER, roleY INTEGER, roleFontSize INTEGER, roleColor TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS blast_history (id TEXT PRIMARY KEY, templateName TEXT, subject TEXT, recipientGroup TEXT, recipientCount INTEGER, sentDate TEXT, status TEXT, scheduledDate TEXT, deliveryRate REAL, openRate REAL, clickRate REAL, unsubscribeRate REAL, body TEXT, recipientIds TEXT, detailedRecipientActivity TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, email TEXT UNIQUE, firstName TEXT, lastName TEXT, role TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (userId TEXT PRIMARY KEY)`);
  db.run(`CREATE TABLE IF NOT EXISTS unsubscribed_emails (email TEXT PRIMARY KEY)`);
  db.run(`CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, action TEXT, details TEXT, timestamp TEXT)`);
  db.run(`CREATE TABLE IF NOT EXISTS verification_codes (email TEXT PRIMARY KEY, code TEXT, expires INTEGER)`);
          db.run(`CREATE TABLE IF NOT EXISTS global_settings (id INTEGER PRIMARY KEY DEFAULT 1, globalHeader TEXT, globalFooter TEXT)`);});

app.post('/api/ecard-backdrops/folders', (req, res) => {
  const { folderName } = req.body;
  const currentPath = req.query.path as string || '/';

  if (!folderName) {
    return res.status(400).json({ error: 'Folder name is required' });
  }
  const folderPath = path.join(__dirname, 'uploads', currentPath, folderName);
  fs.mkdir(folderPath, { recursive: true }, (err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to create folder' });
      return;
    }
    res.json({ message: 'Folder created successfully' });
  });
});

app.get('/api/ecard-backdrops', (req, res) => {
  const currentPath = req.query.path as string || '/';
  const uploadsPath = path.join(__dirname, 'uploads', currentPath);

  fs.readdir(uploadsPath, { withFileTypes: true }, (err, files) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read uploads directory' });
      return;
    }
    const fileNames = files.filter(file => !file.isDirectory()).map(file => file.name);
    const folderNames = files.filter(file => file.isDirectory()).map(file => file.name);
    res.json({ files: fileNames, folders: folderNames });
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

  db.run('REPLACE INTO verification_codes (email, code, expires) VALUES (?, ?, ?)', [email, code, expires], async function(err) {
    if (err) {
      console.error('Error saving verification code:', err.message);
      return res.status(500).json({ error: 'Failed to save verification code' });
    }

    try {
      await emailService.sendEmail({
        to: email,
        subject: 'Your SUDI Verification Code',
        text: `Your verification code is: ${code}`,
        html: `<b>Your verification code is: ${code}</b>`,
      });
      res.status(200).json({ message: 'Verification code sent' });
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      res.status(500).json({ error: 'Failed to send verification code', details: error.message });
    }
  });
});

app.post('/api/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  db.get('SELECT * FROM verification_codes WHERE email = ?', [email], (err, row: any) => {
    if (err) {
      console.error('Error fetching verification code:', err.message);
      return res.status(500).json({ error: 'Failed to fetch verification code' });
    }

    if (!row) {
      return res.status(400).json({ error: 'No verification code found for this email' });
    }

    if (row.expires < Date.now()) {
      db.run('DELETE FROM verification_codes WHERE email = ?', [email]);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (row.code === code) {
      db.run('DELETE FROM verification_codes WHERE email = ?', [email]);
      res.status(200).json({ message: 'Email verified successfully' });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  });
});

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
    logActivity('System', 'Department Creation', `Department ${name} created`);
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
    logActivity('System', 'Department Update', `Department ${req.params.id} updated to ${name}`);
    res.json({ id: req.params.id, name });
  });
});

app.delete('/api/departments/:id', (req, res) => {
  db.run('DELETE FROM departments WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    logActivity('System', 'Department Deletion', `Department ${req.params.id} deleted`);
    res.json({ deletedID: req.params.id });
  });
});

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
    logActivity('System', 'Participant Creation', `Participant ${name} created`);
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
    logActivity('System', 'Participant Update', `Participant ${req.params.id} (${name}) updated`);
    res.json({ id: req.params.id, name, email, role, departmentId });
  });
});

app.delete('/api/participants/:id', (req, res) => {
  db.run('DELETE FROM participants WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    logActivity('System', 'Participant Deletion', `Participant ${req.params.id} deleted`);
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

    const unsubscribedEmails = await new Promise<string[]>((resolve, reject) => {
      db.all('SELECT email FROM unsubscribed_emails', [], (err, rows: { email: string }[]) => {
        if (err) reject(err);
        resolve(rows.map(row => row.email));
      });
    });

    for (const recipient of recipients) {
      if (!recipient.email) {
        console.log(`Skipping recipient with no email: ${recipient.name}`);
        continue;
      }

      if (unsubscribedEmails.includes(recipient.email)) {
        console.log(`Skipping unsubscribed recipient: ${recipient.email}`);
        continue;
      }

                              const personalizedBody = template.body.replace(/{name}/g, recipient.name).replace(/{email}/g, recipient.email).replace(/{role}/g, recipient.role);
                              const unsubscribeLink = `${req.protocol}://${req.get('host')}/api/unsubscribe?email=${encodeURIComponent(recipient.email)}`;
                              const fullHtml = `${globalHeader}${personalizedBody}${globalFooter}`.replace(/{unsubscribe_link}/g, unsubscribeLink);      let mailOptions: nodemailer.SendMailOptions = {
        to: recipient.email,
        subject: template.subject,
        html: fullHtml,
      };

      if (template.ecardBackdropPath) {
        const backdropPath = path.join(__dirname, '..', template.ecardBackdropPath);
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

      await emailService.sendBlastEmail(mailOptions, senderProfile);
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
      logActivity('System', 'Template Creation', `Template ${name} created`);
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
      logActivity('System', 'Template Update', `Template ${req.params.id} (${name}) updated`);
      res.json(row);
    });
  });
});

app.get('/api/history', authenticateToken, (req, res) => {
  db.all('SELECT * FROM blast_history ORDER BY sentDate DESC', [], (err, rows: any[]) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    const history = rows.map(row => {
      try {
        return {
          ...row,
          detailedRecipientActivity: JSON.parse(row.detailedRecipientActivity || '[]'),
          recipientIds: JSON.parse(row.recipientIds || '[]'),
        };
      } catch (e) {
        console.error(`Failed to parse history row with id ${row.id}:`, e);
        return {
          ...row,
          detailedRecipientActivity: [],
          recipientIds: [],
        };
      }
    });
    res.json(history);
  });
});

app.delete('/api/templates/:id', (req, res) => {
  db.run('DELETE FROM templates WHERE id = ?', req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    logActivity('System', 'Template Deletion', `Template ${req.params.id} deleted`);
    res.json({ deletedID: req.params.id });
  });
});

app.delete('/api/history/reset', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'SuperAdmin') {
    return res.status(403).json({ error: 'Forbidden: Only Super Admins can perform this action.' });
  }

  db.run('DELETE FROM blast_history', function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    logActivity(req.user.username, 'History Reset', 'All blast history has been deleted.');
    res.status(200).json({ message: 'Blast history has been successfully reset.' });
  });
});

app.post('/api/register', (req, res) => {
  const { username, password, email, firstName, lastName, confirmPassword } = req.body;

  if (!username || !password || !email || !firstName || !lastName || !confirmPassword) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
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
    logActivity('System', 'User Registration', `User ${username} created`);
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
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role, firstName: user.firstName, lastName: user.lastName, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: 86400 });
    logActivity(user.username, 'User Login', `User ${user.username} logged in`);
    res.status(200).json({ auth: true, token });
  });
});

app.get('/api/user/settings', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;
  db.get('SELECT * FROM settings WHERE userId = ?', [userId], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.json({ userId, globalHeader: '', globalFooter: '' });
    }
  });
});

app.put('/api/user/settings', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;
  res.status(200).json({ userId });
});

app.get('/api/global-settings', (req, res) => {
  db.get('SELECT globalHeader, globalFooter FROM global_settings WHERE id = 1', [], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      res.json(row);
    } else {
      res.json({ globalHeader: '', globalFooter: '' });
    }
  });
});

app.put('/api/global-settings', (req, res) => {
  const { globalHeader, globalFooter } = req.body;
  db.run('UPDATE global_settings SET globalHeader = ?, globalFooter = ? WHERE id = 1', [globalHeader, globalFooter], function (err) {
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
  });
});

app.post('/api/unsubscribe', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  db.run('INSERT OR IGNORE INTO unsubscribed_emails (email) VALUES (?)', [email], function(err) {
    if (err) {
      console.error('Error unsubscribing email:', err.message);
      return res.status(500).json({ error: 'Failed to unsubscribe email' });
    }
    res.status(200).json({ message: 'Email unsubscribed successfully' });
  });
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

app.get('/api/activity-logs', (req, res) => {
    db.all('SELECT * FROM activity_logs ORDER BY timestamp DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});
app.delete('/api/users/:id', (req, res) => {
    db.run('DELETE FROM users WHERE id = ?', req.params.id, function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deletedID: req.params.id });
    });
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
