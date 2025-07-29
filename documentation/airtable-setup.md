# Airtable Setup and API Integration with Express.js

This document provides a guide on integrating Airtable with your Express.js application, focusing on using the Airtable API to read and write data to your Airtable bases and tables.

## 1. Introduction to Airtable and its API

Airtable is a cloud collaboration service that functions like a spreadsheet but provides database functionality. Its API allows you to programmatically interact with your Airtable data, enabling you to sync information, automate workflows, and build custom applications.

## 2. Prerequisites

Before you begin, ensure you have the following:

*   **Airtable Account:** Sign up for a free or paid Airtable account at [airtable.com](https://www.airtable.com/).
*   **Airtable Base and Table:** Create a base and at least one table within your Airtable account. Note the **Base ID** and the **Table Name** you intend to use.
*   **Airtable API Key:**
    *   Log in to your Airtable account.
    *   Navigate to your account page: [https://airtable.com/account](https://airtable.com/account).
    *   Under the "API" section, you will find your **Personal access token**. Click "Create a new token" if you don't have one or need a new one.
    *   **Important:** When creating a token, grant it specific permissions (scopes) and access to specific bases. For this guide, you'll need at least `data.read` and `data.write` scopes for the base you intend to use.
    *   **Securely store this token.** Treat it like a password.

## 3. Setting up your Express.js App for Airtable

### 3.1. Install Necessary Packages

You'll need the Airtable Node.js client library and a way to manage environment variables.

```bash
npm install airtable dotenv
```

### 3.2. Configure Environment Variables

Create a `.env` file in the root of your project to store your Airtable credentials securely.

```
# .env file
AIRTABLE_API_KEY=YOUR_PERSONAL_ACCESS_TOKEN
AIRTABLE_BASE_ID=YOUR_BASE_ID
# Optional: Specify a default table name if you frequently use one
# AIRTABLE_TABLE_NAME=YourTableName
```

Replace `YOUR_PERSONAL_ACCESS_TOKEN` and `YOUR_BASE_ID` with your actual Airtable API key and Base ID.

### 3.3. Initialize Airtable Client in your Express App

In your main Express application file (e.g., `src/server.ts` or `app.js`), load the environment variables and initialize the Airtable client.

```typescript
// Example using TypeScript (src/server.ts)
import express from 'express';
import dotenv from 'dotenv';
import Airtable from 'airtable';

dotenv.config(); // Load environment variables from .env file

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Initialize Airtable client
const baseId = process.env.AIRTABLE_BASE_ID;
const apiKey = process.env.AIRTABLE_API_KEY;

if (!baseId || !apiKey) {
  console.error("Airtable Base ID and API Key are required. Please check your .env file.");
  // Handle error appropriately, e.g., exit or return an error response
}

const airtable = new Airtable({ apiKey: apiKey }).base(baseId);

// --- Routes for Airtable operations will go here ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (baseId && apiKey) {
    console.log(`Airtable initialized with Base ID: ${baseId}`);
  }
});
```

## 4. Reading Data from Airtable

You can fetch records from a specific table using the `select()` method.

### Example: Fetching all records from a table

```typescript
// In your Express routes file or within src/server.ts

app.get('/api/items', async (req, res) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME; // Allow specifying table via query param or use default

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }

  try {
    const records = await airtable.table(tableName as string).select({
      // You can add options here, e.g.:
      // view: "Grid view", // Specify a view
      // filterByFormula: "{Name} = 'Example'", // Filter records
      // maxRecords: 50, // Limit the number of records
      // sort: [['Name', 'asc']] // Sort records
    }).all();

    // Map records to a more usable format, extracting fields
    const formattedRecords = records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    res.json(formattedRecords);
  } catch (error) {
    console.error("Error fetching from Airtable:", error);
    res.status(500).json({ error: "Failed to fetch data from Airtable." });
  }
});
```

## 5. Writing Data to Airtable

You can create, update, and delete records.

### 5.1. Creating a New Record

Use the `create()` method to add a new record.

```typescript
// Example: Add a new item
app.post('/api/items', async (req, res) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const newItemData = req.body; // Expecting { fieldName1: value1, fieldName2: value2 }

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!newItemData || Object.keys(newItemData).length === 0) {
    return res.status(400).json({ error: "No item data provided." });
  }

  try {
    const createdRecord = await airtable.table(tableName as string).create([
      { fields: newItemData }
    ]);
    res.status(201).json({ id: createdRecord[0].id, ...createdRecord[0].fields });
  } catch (error) {
    console.error("Error creating record in Airtable:", error);
    res.status(500).json({ error: "Failed to create record in Airtable." });
  }
});
```

### 5.2. Updating an Existing Record

Use the `update()` method, providing the record ID and the fields to update.

```typescript
// Example: Update an item by ID
app.put('/api/items/:id', async (req, res) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const recordId = req.params.id;
  const updatedItemData = req.body; // Expecting { fieldName1: newValue1 }

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!recordId) {
    return res.status(400).json({ error: "Record ID not provided." });
  }
  if (!updatedItemData || Object.keys(updatedItemData).length === 0) {
    return res.status(400).json({ error: "No update data provided." });
  }

  try {
    const updatedRecord = await airtable.table(tableName as string).update(recordId, updatedItemData);
    res.json({ id: updatedRecord.id, ...updatedRecord.fields });
  } catch (error) {
    console.error("Error updating record in Airtable:", error);
    res.status(500).json({ error: "Failed to update record in Airtable." });
  }
});
```

### 5.3. Deleting a Record

Use the `destroy()` method with the record ID.

```typescript
// Example: Delete an item by ID
app.delete('/api/items/:id', async (req, res) => {
  const tableName = req.query.tableName || process.env.AIRTABLE_TABLE_NAME;
  const recordId = req.params.id;

  if (!tableName) {
    return res.status(400).json({ error: "Table name not specified or configured." });
  }
  if (!recordId) {
    return res.status(400).json({ error: "Record ID not provided." });
  }

  try {
    await airtable.table(tableName as string).destroy(recordId);
    res.status(200).json({ message: `Record ${recordId} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting record from Airtable:", error);
    res.status(500).json({ error: "Failed to delete record from Airtable." });
  }
});
```

## 6. Best Practices

*   **Secure API Key:** Always use environment variables (`dotenv`) to store your `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID`. Never hardcode them directly into your code or commit them to version control.
*   **Error Handling:** Implement robust error handling for all API calls. Airtable's API can return various errors (e.g., rate limits, invalid data, authentication issues).
*   **Rate Limiting:** Be mindful of Airtable's API rate limits. The free plan has stricter limits than paid plans. Implement strategies like caching or exponential backoff for retries if you anticipate high usage.
*   **Table and Field Names:** Ensure your code uses the exact table names and field names as they appear in your Airtable base. These are case-sensitive.
*   **Data Validation:** Validate data received from users before sending it to Airtable to prevent errors and maintain data integrity.

By following these steps, you can effectively integrate Airtable into your Express.js application for seamless data management.
