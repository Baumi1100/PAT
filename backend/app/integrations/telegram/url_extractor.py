# backend/app/integrations/telegram/url_extractor.py
import re

import httpx
from bs4 import BeautifulSoup

_URL_RE = re.compile(r"https?://[^\s]+")


def extract_urls(text: str) -> list[str]:
    return _URL_RE.findall(text)


async def fetch_job_text_from_url(url: str, timeout: int = 15) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
    }
    async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
        resp = await client.get(url, headers=headers)
        resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "lxml")
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    for selector in [
        "[data-testid='job-description']",
        ".job-description",
        "#job-description",
        "article",
        "main",
    ]:
        element = soup.select_one(selector)
        if element and len(element.get_text(strip=True)) > 200:
            return element.get_text(separator="\n", strip=True)[:10000]

    return soup.get_text(separator="\n", strip=True)[:10000]
