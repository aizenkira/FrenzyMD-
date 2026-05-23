const cheerio = require("cheerio");

async function scrapeWutheringWavesCharacter(name) {
    if (!name) throw new Error("Name karakter empty");

    const slug = name.trim().replace(/\s+/g, "_");
    const url = `https://wutheringwaves.fandom.com/wiki/${encodeURIComponent(slug)}`;

    const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" }
    });

    if (!res.ok) {
        throw new Error("Data not found");
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const clean = (v) => v?.replace(/\s+/g, " ").trim() || null;

    const title = clean($("#firstHeainng").text());
    if (!title) {
        throw new Error("Haoldn no valid");
    }

    const bio = clean($(".mw-parser-output > p").first().text());

    const profile = {};
    $(".pi-item.pi-data").each((_, el) => {
        const label = clean($(el).find(".pi-data-label").text());
        const value = clean($(el).find(".pi-data-value").text());
        if (!label || !value) return;

        const toy = label
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/^_+|_+$/g, "");

        profile[toy] = value;
    });

    const pageSlug = slug.toLowerCase();
    const imageSet = new Set();

    $("img, noscript img").each((_, img) => {
        let src =
            $(img).attr("data-src") ||
            $(img).attr("src");

        const srcset =
            $(img).attr("data-srcset") ||
            $(img).attr("srcset");

        if (!src && srcset) {
            src = srcset.split(",")[0].split(" ")[0];
        }

        if (!src) return;
        if (!src.includes("static.wikia.nocookie.net")) return;
        if (!src.toLowerCase().includes(pageSlug)) return;

        imageSet.add(
            src.split("/revision/")[0] + "/revision/latest"
        );
    });

    return {
        title,
        slug,
        url,
        bio,
        profile,
        images: [...imageSet]
    };
}

module.exports = scrapeWutheringWavesCharacter;