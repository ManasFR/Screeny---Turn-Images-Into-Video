import { NextRequest } from "next/server";

// ─── Cookie banner selectors (common across sites) ───────────────────────────
const COOKIE_SELECTORS = [
  "#onetrust-banner-sdk","#cookieConsent","#cookie-banner","#cookie-notice",
  "#gdpr-banner","#gdpr-cookie-message",".cookie-banner",".cookie-notice",
  ".cookie-consent",".cookie-popup",".cookie-policy",".cc-banner",
  ".cc-window","[id*='cookie']","[class*='cookie']","[id*='consent']",
  "[class*='consent']","[id*='gdpr']","[class*='gdpr']",
  "[aria-label*='cookie']","[aria-label*='Cookie']",
  "#CybotCookiebotDialog",".CybotCookiebotDialog",
  "#didomi-popup",".didomi-popup",
  "#qc-cmp2-ui",".qc-cmp2-ui",
  ".truste_overlay",".truste_popframe",
  "#usercentrics-root","[data-testid*='cookie']",
].join(",");

// ─── Progress emitter ─────────────────────────────────────────────────────────
function makeProgress(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  step: string, pct: number, message: string
) {
  const line = JSON.stringify({ type: "progress", step, pct, message }) + "\n";
  controller.enqueue(encoder.encode(line));
}

function makeDone(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  image: string
) {
  const line = JSON.stringify({ type: "done", image }) + "\n";
  controller.enqueue(encoder.encode(line));
}

function makeError(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  error: string
) {
  const line = JSON.stringify({ type: "error", error }) + "\n";
  controller.enqueue(encoder.encode(line));
}

// ─── Route handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let browser: import("puppeteer").Browser | null = null;

      try {
        const body = await req.json();
        const {
          url, width = 1280, height = 800, deviceSize,
          delay = 0,
          hideCookies = true,
          elementSelector = null,
        } = body;

        // ── Validate ──
        if (!url) { makeError(controller, encoder, "URL is required"); controller.close(); return; }
        let parsedUrl: URL;
        try { parsedUrl = new URL(url); } catch {
          makeError(controller, encoder, "Invalid URL format"); controller.close(); return;
        }
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          makeError(controller, encoder, "Only HTTP/HTTPS URLs allowed"); controller.close(); return;
        }

        // ── Load puppeteer ──
        makeProgress(controller, encoder, "init", 5, "Starting browser...");
        const puppeteer = await import("puppeteer").catch(() => null);
        if (!puppeteer) {
          makeError(controller, encoder, "Puppeteer not installed. Run: npm install puppeteer");
          controller.close(); return;
        }

        browser = await puppeteer.default.launch({
          headless: true,
          args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu","--hide-scrollbars"],
        });

        const page = await browser.newPage();
        const isMobile = deviceSize === "mobile";
        const isTablet = deviceSize === "tablet";

        await page.setViewport({
          width, height,
          deviceScaleFactor: isMobile ? 2 : 1,
          isMobile: isMobile || isTablet,
          hasTouch: isMobile || isTablet,
        });

        const userAgents: Record<string, string> = {
          mobile:  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          tablet:  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
          laptop:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        };
        if (deviceSize && userAgents[deviceSize]) await page.setUserAgent(userAgents[deviceSize]);

        // ── Navigate ──
        makeProgress(controller, encoder, "loading", 15, "Loading page...");
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        makeProgress(controller, encoder, "loading", 35, "Page loaded, processing...");

        // ── Hide cookie banners ──
        if (hideCookies) {
          makeProgress(controller, encoder, "cookies", 40, "Removing cookie banners...");
          await page.evaluate((selectors: string) => {
            // Try clicking common accept buttons first
            const acceptTexts = ["accept all","accept","agree","i agree","ok","got it","close","dismiss","allow all"];
            document.querySelectorAll<HTMLElement>("button,a").forEach(el => {
              const text = el.innerText?.toLowerCase().trim();
              if (acceptTexts.some(t => text === t)) {
                try { el.click(); } catch {}
              }
            });
            // Hide remaining banners via CSS
            const style = document.createElement("style");
            style.textContent = `${selectors} { display: none !important; visibility: hidden !important; opacity: 0 !important; }`;
            document.head.appendChild(style);
            // Remove body overflow lock
            document.body.style.overflow = "auto";
            document.documentElement.style.overflow = "auto";
          }, COOKIE_SELECTORS);
          await new Promise(r => setTimeout(r, 300));
        }

        // ── Element screenshot ──
        if (elementSelector) {
          makeProgress(controller, encoder, "screenshot", 70, `Finding element: ${elementSelector}`);
          const element = await page.$(elementSelector);
          if (!element) {
            makeError(controller, encoder, `Element not found: "${elementSelector}"`);
            await browser.close(); controller.close(); return;
          }
          makeProgress(controller, encoder, "screenshot", 85, "Capturing element...");

          // Custom delay
          if (delay > 0) {
            makeProgress(controller, encoder, "delay", 55, `Waiting ${delay}s before capture...`);
            await new Promise(r => setTimeout(r, delay * 1000));
          }

          const screenshotBuffer = await element.screenshot({ type: "png" });
          const base64 = `data:image/png;base64,${Buffer.from(screenshotBuffer).toString("base64")}`;
          makeProgress(controller, encoder, "done", 98, "Finishing up...");
          makeDone(controller, encoder, base64);
          await browser.close();
          controller.close();
          return;
        }

        // ── Full page: scroll to load lazy content ──
        makeProgress(controller, encoder, "scrolling", 50, "Scanning page content...");
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 300;
            const timer = setInterval(() => {
              window.scrollBy(0, distance);
              totalHeight += distance;
              if (totalHeight >= document.body.scrollHeight) {
                clearInterval(timer);
                window.scrollTo(0, 0);
                resolve();
              }
            }, 60);
          });
        });
        makeProgress(controller, encoder, "scrolling", 65, "Content loaded, preparing capture...");

        // ── Custom delay ──
        if (delay > 0) {
          makeProgress(controller, encoder, "delay", 70, `Waiting ${delay}s before capture...`);
          await new Promise(r => setTimeout(r, delay * 1000));
        } else {
          await new Promise(r => setTimeout(r, 800));
        }

        // ── Capture ──
        makeProgress(controller, encoder, "screenshot", 80, "Capturing full page...");
        const screenshotBuffer = await page.screenshot({ type: "png", fullPage: true });
        makeProgress(controller, encoder, "screenshot", 95, "Encoding image...");

        const base64 = `data:image/png;base64,${Buffer.from(screenshotBuffer).toString("base64")}`;
        makeProgress(controller, encoder, "done", 99, "Almost done...");
        makeDone(controller, encoder, base64);

        await browser.close();
        controller.close();

      } catch (error: unknown) {
        if (browser) await browser.close().catch(() => {});
        makeError(controller, encoder, error instanceof Error ? error.message : "Screenshot failed");
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
