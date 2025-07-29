import express, { Request, Response } from 'express';
import cors from 'cors'; // Often useful for frontend interaction
import Parser, { Item } from 'rss-parser'; // For RSS feed parsing
import path from 'path'; // Import path module
import dotenv from 'dotenv'; // For .env file loading
import Airtable from 'airtable'; // Airtable SDK

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Parse JSON request bodies

// --- Placeholder Routes ---

// Root route to serve the landing page HTML file
app.get('/', (req: Request, res: Response) => {
  // Use path.join for robust path construction
  // __dirname will be the directory of the executed file (e.g., src/)
  res.sendFile(path.join(__dirname, '..', 'documentation', 'index.html'));
});

// Root route for health check (this will now be overridden by the '/' route for the landing page)
// If you want a separate health check, you might use '/api/health'
app.get('/api/health', (req: Request, res: Response) => {
  res.send('AgentSmart Backend is running!');
});

// Route to serve the dashboard HTML file
app.get('/dashboard', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'documentation', 'dashboard.html'));
});

// Placeholder for User Authentication
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  // In a real application, you would:
  // 1. Validate email and password.
  // 2. Check against a user database.
  // 3. Generate and return a JWT or session token.
  console.log(`Login attempt: Email=${email}, Password=${password}`);
  if (email === 'test@example.com' && password === 'password123') {
    res.status(200).json({ message: 'Login successful (placeholder)', token: 'fake-jwt-token' });
  } else {
    res.status(401).json({ message: 'Invalid credentials (placeholder)' });
  }
});

// Placeholder for RSS Feed Intelligence Gathering and Summarization
app.post('/api/intelligence/rss-feed', async (req: Request, res: Response) => {
  const { feedUrl } = req.body;

  if (!feedUrl) {
    return res.status(400).json({ message: 'RSS feed URL is required.' });
  }

  const parser = new Parser();
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log(`Successfully parsed RSS feed from: ${feedUrl}`);

    // Basic summarization logic (placeholder)
    // In a real scenario, this would involve AI to summarize feed content
    const summaries: Item[] = feed.items.slice(0, 5).map((item: Item) => ({
      title: item.title,
      link: item.link,
      // Placeholder for AI-generated summary
      summary: `AI summary of: ${item.title || 'No title'}...`
    }));

    res.status(200).json({
      feedTitle: feed.title,
      feedDescription: feed.description,
      latestItems: summaries
    });

  } catch (error: any) {
    console.error(`Error processing RSS feed ${feedUrl}:`, error.message);
    res.status(500).json({ message: 'Failed to process RSS feed.', error: error.message });
  }
});

// Placeholder for AI Content Generation (e.g., Social Media Post Outline)
app.post('/api/content/generate-social-post', (req: Request, res: Response) => {
  const { topic, tone, keywords } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required for content generation.' });
  }

  // Placeholder for AI content generation
  // In a real scenario, this would call an AI model with the provided parameters
  const generatedContent = `
    AI-generated draft for a social media post on "${topic}"
    Tone: ${tone || 'neutral'}
    Keywords: ${keywords ? keywords.join(', ') : 'none'}

    ---
    Draft Content:
    [Placeholder for AI generated social media post content based on topic, tone, and keywords.]
    ---
  `;

  res.status(200).json({
    generatedContent: generatedContent.trim(),
    message: 'Social media post draft generated (placeholder).'
  });
});

// --- Airtable Integration ---
dotenv.config(); // Load environment variables from .env file

// Get Airtable credentials
const baseIdEnv = process.env.AIRTABLE_BASE_ID;
const apiKeyEnv = process.env.AIRTABLE_API_KEY;

// Validate and ensure baseId and apiKey are strings
let baseId: string;
let apiKey: string;

if (typeof baseIdEnv === 'string' && typeof apiKeyEnv === 'string') {
  baseId = baseIdEnv;
  apiKey = apiKeyEnv;
} else {
  console.error("Airtable Base ID and API Key are required and must be strings. Please check your .env file.");
  // If these are critical, exit the process.
  // For this example, we'll assign dummy values to satisfy TypeScript,
  // but Airtable operations will likely fail.
  process.exit(1); // Exit if critical configuration is missing
}

// Pass the validated string values to Airtable constructor
const airtable = new Airtable({ apiKey: apiKey }).base(baseId);

// Route to serve the Airtable CRUD interface
app.get('/airtable', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '..', 'documentation', 'airtable-crud.html'));
});

// Airtable API Routes for CRUD operations
app.get('/api/items', async (req: Request, res: Response) => {
  // Get tableName from query parameter, or environment variable
  const queryTableName = req.query.tableName as string | undefined;
  const envTableName = process.env.AIRTABLE_TABLE_NAME as string | undefined;

  let tableName: string;

  if (queryTableName) {
    tableName = queryTableName;
  } else if (envTableName) {
    tableName = envTableName;
  } else {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }

  // Check if Airtable credentials are configured
  if (!baseId || !apiKey) {
    return res.status(500).json({ error: "Airtable not configured." });
  }

  try {
    // Simplified fetch: just get all records from the specified table
    const records = await airtable.table(tableName).select().all(); // Removed selectOptions

    const formattedRecords = records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    res.json(formattedRecords);
  } catch (error: any) {
    console.error("Error fetching from Airtable:", error.message);
    res.status(500).json({ error: "Failed to fetch data from Airtable.", details: error.message });
  }
});

app.post('/api/items', async (req: Request, res: Response) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const newItemData = req.body;

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!newItemData || Object.keys(newItemData).length === 0) {
    return res.status(400).json({ error: "No item data provided." });
  }
  if (!baseId || !apiKey) {
    return res.status(500).json({ error: "Airtable not configured." });
  }

  try {
    const createdRecord = await airtable.table(tableName as string).create([
      { fields: newItemData }
    ]);
    res.status(201).json({ id: createdRecord[0].id, ...createdRecord[0].fields });
  } catch (error: any) {
    console.error("Error creating record in Airtable:", error.message);
    res.status(500).json({ error: "Failed to create record in Airtable.", details: error.message });
  }
});

app.put('/api/items/:id', async (req: Request, res: Response) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const recordId = req.params.id;
  const updatedItemData = req.body;

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!recordId) {
    return res.status(400).json({ error: "Record ID not provided." });
  }
  if (!updatedItemData || Object.keys(updatedItemData).length === 0) {
    return res.status(400).json({ error: "No update data provided." });
  }
  if (!baseId || !apiKey) {
    return res.status(500).json({ error: "Airtable not configured." });
  }

  try {
    const updatedRecord = await airtable.table(tableName as string).update(recordId, updatedItemData);
    res.json({ id: updatedRecord.id, ...updatedRecord.fields });
  } catch (error: any) {
    console.error("Error updating record in Airtable:", error.message);
    res.status(500).json({ error: "Failed to update record in Airtable.", details: error.message });
  }
});

app.delete('/api/items/:id', async (req: Request, res: Response) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const recordId = req.params.id;

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!recordId) {
    return res.status(400).json({ error: "Record ID not provided." });
  }
  if (!baseId || !apiKey) {
    return res.status(500).json({ error: "Airtable not configured." });
  }

  try {
    await airtable.table(tableName as string).destroy(recordId);
    res.status(200).json({ message: `Record ${recordId} deleted successfully.` });
  } catch (error: any) {
    console.error("Error deleting record from Airtable:", error.message);
    res.status(500).json({ error: "Failed to delete record from Airtable.", details: error.message });
  }
});
// --- End Airtable Integration ---


// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle EADDRINUSE error: if the port is already in use, kill the process and restart
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Attempting to kill the process.`);
    // Use a shell command to find the process ID and kill it
    // This command might vary slightly depending on the OS, but 'lsof' and 'kill' are common on Linux/macOS
    // For Windows, you might use 'netstat -ano | findstr :<port>' and 'taskkill /PID <PID> /F'
    // We'll use a Linux-compatible command here.
    const killCommand = `lsof -i :${port} | grep LISTEN | awk '{print $2}' | xargs kill -9`;

    require('child_process').exec(killCommand, (error: Error | null, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Error killing process on port ${port}: ${stderr}`);
        // If killing failed, we might want to exit or retry differently
        process.exit(1);
      } else {
        console.log(`Process on port ${port} killed successfully.`);
        // Attempt to restart the server after killing the process
        // Note: This is a simplified restart. In a real app, you might want a more robust retry mechanism.
        console.log('Attempting to restart the server...');
        // A simple way to restart is to re-execute the script, but that's complex.
        // For this example, we'll just log that it should restart.
        // In a production environment, a process manager like PM2 would handle this.
        // For demonstration, we'll just exit and let nodemon (if used) handle the restart.
        process.exit(0); // Exit cleanly, expecting nodemon to restart
      }
    });
  } else {
    console.error(`Server error: ${err.message}`);
    process.exit(1); // Exit for other errors
  }
});
