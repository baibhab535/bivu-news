const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");

const app = express();
const parser = new Parser();

app.use(cors());

// ===============================
// NEWS ROUTE (GOOGLE NEWS RSS)
// ===============================
app.get("/news", async (req, res) => {
  try {
    // India news
    const indiaFeed =
      "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en";

    // International news
    const worldFeed =
      "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en";

    const indiaNews = await parser.parseURL(indiaFeed);
    const worldNews = await parser.parseURL(worldFeed);

    const combinedNews = [
      ...indiaNews.items,
      ...worldNews.items
    ].slice(0, 10);

    const formattedNews = combinedNews.map((item, index) => ({
      id: index + 1,
      title: item.title,
      description:
        item.contentSnippet ||
        item.content ||
        "More details available online.",
      source: "Google News"
    }));

    res.json(formattedNews);
  } catch (error) {
    console.error("RSS ERROR:", error.message);
    res.status(500).json({
      error: "Failed to load live news"
    });
  }
});

// ===============================
// SERVER START
// ===============================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
