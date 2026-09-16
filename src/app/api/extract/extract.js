import { chromium } from "playwright-core";
import chromiumBinary from "@sparticuz/chromium";

const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function pLimit(concurrency) {
  let active = 0;
  const queue = [];
  const next = () => {
    if (active >= concurrency || !queue.length) return;
    active++;
    const { fn, resolve, reject } = queue.shift();
    Promise.resolve()
      .then(fn)
      .then(resolve, reject)
      .finally(() => {
        active--;
        next();
      });
  };
  return (fn) =>
    new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
}

export const PROVIDERS = [
  "https://vidsrc2.ru",
  "https://vidsrc.ir",
  "https://vidsrcme.ru",
  "https://vidsrcme.su",
  "https://vidsrc-me.ru",
  "https://vidsrc.me",
  "https://vidsrc.io",
  "https://vidsrc.tw",
];

const cache = new Map();
const limit = pLimit(2);

let browser;

export async function ensureBrowser() {
  if (browser?.isConnected()) return browser;

  if (IS_SERVERLESS) {
    browser = await chromium.launch({
      args: chromiumBinary.args,
      executablePath: await chromiumBinary.executablePath(),
      headless: true,
    });
  } else {
    browser = await chromium.launch({
      headless: true,
      channel: "chrome",
    });
  }

  return browser;
}

export async function closeBrowser() {
  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}

function isHlsUrl(u) {
  return (
    /\.m3u8(\?|$)/i.test(u) ||
    /\/master\.m3u8/i.test(u) ||
    (/\/pl\//i.test(u) && u.includes("m3u8"))
  );
}

function isSubtitle(u) {
  if (!u) return false;
  if (u.startsWith("blob:")) return false;
  if (u.includes("thumbnails.vtt")) return false;
  return /\.(vtt|srt)(\?.*)?$/i.test(u) || u.includes(".vtt") || u.includes(".srt");
}

async function collectMediaFromFrames(page) {
  const hls = [];
  const subs = [];
  for (const frame of page.frames()) {
    try {
      const found = await frame.evaluate(() => {
        const urls = [];
        for (const el of document.querySelectorAll("video, source")) {
          if (el.src) urls.push(el.src);
          if (el.currentSrc) urls.push(el.currentSrc);
        }
        return urls;
      });
      for (const u of found) {
        if (isHlsUrl(u)) hls.push(u);
        if (isSubtitle(u)) subs.push(u);
      }
    } catch {
      /* cross-origin or detached */
    }
  }
  return { hls, subs };
}

async function scrapeProvider(domain, url) {
  console.log(`\n[${domain}] Starting scrape for URL: ${url}`);
  const b = await ensureBrowser();
  const context = await b.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  let hlsUrl = null;
  const subtitles = [];

  const noteUrl = (reqUrl) => {
    if (!hlsUrl && isHlsUrl(reqUrl)) {
      hlsUrl = reqUrl;
      console.log(`[${domain}] Found HLS URL: ${hlsUrl}`);
    }
    if (isSubtitle(reqUrl) && !subtitles.includes(reqUrl)) {
      subtitles.push(reqUrl);
    }
  };

  try {
    await page.route("**/*disable-devtool*", (route) => route.abort());
    page.on("request", (request) => noteUrl(request.url()));
    page.on("response", (response) => noteUrl(response.url()));

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });

    const playerIframe = page.locator("#player_iframe");
    const legacyFrame = page.locator("#the_frame");

    if (await playerIframe.count()) {
      await page
        .waitForFunction(
          () => document.querySelector("#player_iframe")?.getAttribute("src"),
          { timeout: 15000 }
        )
        .catch(() => {});

      let landing = null;
      for (let i = 0; i < 20 && !landing; i++) {
        landing = page
          .frames()
          .find(
            (f) =>
              /\/embed\/(movie|tv)/i.test(f.url()) && f !== page.mainFrame()
          );
        if (!landing) await page.waitForTimeout(250);
      }

      if (landing) {
        const playBtn = landing.locator("#bigPlay");
        try {
          await playBtn.waitFor({ state: "visible", timeout: 8000 });
          await playBtn.click({ force: true });
        } catch {
          await landing
            .evaluate(() => document.getElementById("bigPlay")?.click())
            .catch(() => {});
        }
      } else {
        await page.mouse.click(640, 360);
      }

      const deadline = Date.now() + 15000;
      while (!hlsUrl && Date.now() < deadline) {
        const fromDom = await collectMediaFromFrames(page);
        if (fromDom.hls[0]) hlsUrl = fromDom.hls[0];
        for (const s of fromDom.subs) {
          if (!subtitles.includes(s)) subtitles.push(s);
        }
        if (hlsUrl) break;
        await page.waitForTimeout(400);
      }
    } else if (await legacyFrame.count()) {
      const box = await legacyFrame.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      } else {
        await page.evaluate(() => document.querySelector("#the_frame")?.click());
      }
      await page.waitForTimeout(7000);
      if (!hlsUrl) {
        await page
          .waitForResponse((resp) => isHlsUrl(resp.url()), { timeout: 5000 })
          .catch(() => {});
      }
    } else {
      throw new Error("No player iframe found");
    }

    if (!hlsUrl) {
      const fromDom = await collectMediaFromFrames(page);
      if (fromDom.hls[0]) hlsUrl = fromDom.hls[0];
      for (const s of fromDom.subs) {
        if (!subtitles.includes(s)) subtitles.push(s);
      }
    }

    await page.close();
    await context.close();

    if (!hlsUrl) throw new Error("HLS URL not found");
    return { hls_url: hlsUrl, subtitles, error: null };
  } catch (error) {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    console.error(`[${domain}] Error: ${error.message}`);
    return { hls_url: null, subtitles: [], error: error.message };
  }
}

export async function extractFromQuery({
  type = "movie",
  tmdb_id,
  season,
  episode,
  first = false,
}) {
  if (!tmdb_id) {
    return {
      status: 400,
      body: {
        success: false,
        error: "tmdb_id query param is required",
        results: {},
      },
    };
  }

  if (type === "tv" && (season == null || episode == null)) {
    return {
      status: 400,
      body: {
        success: false,
        error: "season and episode query params are required for TV shows",
        results: {},
      },
    };
  }

  const cacheKey = JSON.stringify({ type, tmdb_id, season, episode, first });
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 60 * 15) {
    return { status: 200, body: cached.response };
  }

  await ensureBrowser();

  const urls = PROVIDERS.reduce((acc, domain) => {
    acc[domain] =
      type === "tv"
        ? `${domain}/embed/tv?tmdb=${tmdb_id}&season=${season}&episode=${episode}`
        : `${domain}/embed/movie/${tmdb_id}`;
    return acc;
  }, {});

  const results = {};

  if (first) {
    for (const [domain, url] of Object.entries(urls)) {
      const result = await scrapeProvider(domain, url);
      results[domain] = result;
      if (result.hls_url) break;
    }
  } else {
    const resultsArr = await Promise.all(
      Object.entries(urls).map(([domain, url]) =>
        limit(async () => {
          try {
            return [domain, await scrapeProvider(domain, url)];
          } catch (err) {
            return [
              domain,
              { hls_url: null, subtitles: [], error: err.message },
            ];
          }
        })
      )
    );
    Object.assign(results, Object.fromEntries(resultsArr));
  }

  const success = Object.values(results).some((r) => r.hls_url);
  const response = { success, results };
  cache.set(cacheKey, { timestamp: Date.now(), response });
  return { status: 200, body: response };
}
