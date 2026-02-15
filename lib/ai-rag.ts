import clientPromise from "@/lib/mongodb"

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export async function getRelevantContext(query: string): Promise<string> {
  try {
    const client = await clientPromise
    const db = client.db()
    const collection = db.collection("rag_knowledge")

    // Extract keywords (words > 3 chars)
    const keywords = query.split(/\s+/).filter(w => w.length > 3 && !["with", "from", "that", "this", "make", "create"].includes(w.toLowerCase()))

    if (keywords.length === 0) return ""

    // Create a regex for keyword matching (OR logic)
    // Escape keywords to prevent regex injection
    const escapedKeywords = keywords.map(escapeRegExp)
    const regex = new RegExp(escapedKeywords.join("|"), "i")

    // Find documents that match keywords in tags, title, or content
    // Limit to top 3 most relevant (heuristically, MongoDB sort would be better with text index)
    const docs = await collection.find({
        $or: [
            { tags: { $in: keywords } },
            { title: { $regex: regex } },
            { content: { $regex: regex } }
        ]
    }).limit(3).toArray()

    if (docs.length === 0) return ""

    return docs.map(d => `[Snippet: ${d.title || "Untitled"}]\n${d.content}`).join("\n\n")

  } catch (error) {
    console.error("Error fetching RAG context:", error)
    return ""
  }
}
