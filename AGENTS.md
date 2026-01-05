# Developer Guidelines & Documentation

## External APIs

### Server Logs API
**Endpoint:** `GET https://micro1.sycord.com/api/logs`

**Description:** Retrieves recent server logs for a specific repository deployment.

**Query Parameters:**
*   `repo_id` (string, required): The repository identifier (matches the MongoDB Project ID).
*   `limit` (number, optional): Number of lines to return (default: 200, max: 500).

**Response Format:**
```json
{
  "success": true,
  "project_id": "6957a3fb538e5f68b68b58f7",
  "logs": [
    "2024-01-02 10:56:42 [INFO] Deployment started...",
    "2024-01-02 10:56:45 [ERROR] Build failed: ..."
  ]
}
```

**Usage in Frontend:**
When diagnosing deployment failures, fetch logs using the `repo_id` (which corresponds to the project `_id`).
