import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url, width, height, deviceSize } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json({ error: "Only HTTP/HTTPS URLs allowed" }, { status: 400 });
    }

    const puppeteer = await import("puppeteer").catch(() => null);
    if (!puppeteer) {
      return NextResponse.json({ error: "Puppeteer not installed. Run: npm install puppeteer" }, { status: 500 });
    }

    const isMobile = deviceSize === "mobile";
    const isTablet = deviceSize === "tablet";

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    });

    const page = await browser.newPage();

    await page.setViewport({
      width: width || 1280,
      height: height || 800,
      deviceScaleFactor: isMobile ? 2 : 1,
      isMobile: isMobile || isTablet,
      hasTouch: isMobile || isTablet,
    });

    const userAgents: Record<string, string> = {
      mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      tablet: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      laptop: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };

    if (deviceSize && userAgents[deviceSize]) {
      await page.setUserAgent(userAgents[deviceSize]);
    }

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Auto-scroll to trigger lazy-loaded content
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
        }, 80);
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Full page screenshot
    const screenshot = await page.screenshot({ type: "png", fullPage: true });

    await browser.close();

    return new NextResponse(screenshot, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="screenshot-${deviceSize}-${Date.now()}.png"`,
      },
    });
  } catch (error: unknown) {
    console.error("Screenshot error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture screenshot" },
      { status: 500 }
    );
  }
}
