#!/usr/bin/env python3
"""Price / stock monitor.

Reads watchlist.yaml, fetches each product page through the Bright Data
Web Unlocker API, extracts price and stock state with CSS selectors, and
posts a Slack message when something interesting changes (price drop,
target hit, or back-in-stock).
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests
import yaml
from bs4 import BeautifulSoup
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
STATE_PATH = ROOT / "state.json"
WATCHLIST_PATH = ROOT / "watchlist.yaml"

BRIGHTDATA_ENDPOINT = "https://api.brightdata.com/request"
DEFAULT_ZONE = "web_unlocker1"

IN_STOCK_PATTERNS = (
    "in stock",
    "in-stock",
    "add to cart",
    "add to bag",
    "buy now",
    "available",
    "ships in",
    "ships within",
)
OUT_OF_STOCK_PATTERNS = (
    "out of stock",
    "out-of-stock",
    "sold out",
    "unavailable",
    "currently unavailable",
    "notify me when",
)

log = logging.getLogger("agent")


@dataclass
class Product:
    name: str
    url: str
    price_selector: str | None
    stock_selector: str | None
    target_price: float | None

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "Product":
        if "name" not in raw or "url" not in raw:
            raise ValueError(f"watchlist entry missing name/url: {raw!r}")
        return cls(
            name=str(raw["name"]),
            url=str(raw["url"]),
            price_selector=raw.get("price_selector"),
            stock_selector=raw.get("stock_selector"),
            target_price=_to_float(raw.get("target_price")),
        )


def _to_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def load_watchlist(path: Path) -> list[Product]:
    if not path.exists():
        raise FileNotFoundError(f"watchlist not found at {path}")
    data = yaml.safe_load(path.read_text()) or {}
    items = data.get("products") or []
    if not isinstance(items, list):
        raise ValueError("watchlist.yaml: 'products' must be a list")
    return [Product.from_dict(item) for item in items]


def load_state(path: Path) -> dict[str, dict[str, Any]]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        log.warning("state file corrupt, starting fresh")
        return {}


def save_state(path: Path, state: dict[str, dict[str, Any]]) -> None:
    path.write_text(json.dumps(state, indent=2, sort_keys=True))


def fetch_html(url: str, token: str, zone: str) -> str:
    resp = requests.post(
        BRIGHTDATA_ENDPOINT,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        json={"zone": zone, "url": url, "format": "raw"},
        timeout=90,
    )
    resp.raise_for_status()
    return resp.text


def parse_price(html: str, selector: str | None) -> float | None:
    if not selector:
        return None
    soup = BeautifulSoup(html, "html.parser")
    element = soup.select_one(selector)
    if element is None:
        return None
    text = element.get_text(" ", strip=True)
    cleaned = text.replace(",", "")
    match = re.search(r"\d+(?:\.\d+)?", cleaned)
    return float(match.group()) if match else None


def parse_stock(html: str, selector: str | None) -> bool | None:
    if not selector:
        return None
    soup = BeautifulSoup(html, "html.parser")
    element = soup.select_one(selector)
    if element is None:
        return None
    haystack = element.get_text(" ", strip=True).lower()
    if any(p in haystack for p in OUT_OF_STOCK_PATTERNS):
        return False
    if any(p in haystack for p in IN_STOCK_PATTERNS):
        return True
    return None


def notify_slack(webhook: str, text: str) -> None:
    try:
        requests.post(webhook, json={"text": text}, timeout=15).raise_for_status()
    except requests.RequestException as err:
        log.error("slack notification failed: %s", err)


def diff_messages(
    product: Product,
    previous: dict[str, Any],
    current: dict[str, Any],
) -> list[str]:
    """Decide what (if anything) to alert about."""
    messages: list[str] = []
    prev_price = previous.get("price")
    cur_price = current.get("price")
    if cur_price is not None and prev_price is not None and cur_price < prev_price:
        delta = prev_price - cur_price
        pct = (delta / prev_price) * 100 if prev_price else 0
        messages.append(
            f":chart_with_downwards_trend: *Price drop* — {product.name}: "
            f"${prev_price:.2f} → *${cur_price:.2f}* (−${delta:.2f}, −{pct:.1f}%)\n{product.url}"
        )
    if (
        product.target_price is not None
        and cur_price is not None
        and cur_price <= product.target_price
        and (prev_price is None or prev_price > product.target_price)
    ):
        messages.append(
            f":dart: *Target hit* — {product.name} at *${cur_price:.2f}* "
            f"(target ${product.target_price:.2f})\n{product.url}"
        )
    prev_stock = previous.get("in_stock")
    cur_stock = current.get("in_stock")
    if cur_stock is True and prev_stock is False:
        messages.append(
            f":package: *Back in stock* — {product.name}\n{product.url}"
        )
    return messages


def check_product(
    product: Product,
    state: dict[str, dict[str, Any]],
    *,
    token: str,
    zone: str,
    webhook: str | None,
) -> None:
    log.info("checking %s", product.name)
    try:
        html = fetch_html(product.url, token=token, zone=zone)
    except requests.RequestException as err:
        log.error("fetch failed for %s: %s", product.name, err)
        return

    current = {
        "price": parse_price(html, product.price_selector),
        "in_stock": parse_stock(html, product.stock_selector),
        "checked_at": int(time.time()),
    }
    previous = state.get(product.url, {})

    if current["price"] is None and product.price_selector:
        log.warning("price selector %r matched nothing on %s", product.price_selector, product.url)
    if current["in_stock"] is None and product.stock_selector:
        log.warning("stock selector %r matched nothing on %s", product.stock_selector, product.url)

    for message in diff_messages(product, previous, current):
        log.info("alert: %s", message.splitlines()[0])
        if webhook:
            notify_slack(webhook, message)

    state[product.url] = {**previous, **current}


def run_once(*, token: str, zone: str, webhook: str | None) -> None:
    products = load_watchlist(WATCHLIST_PATH)
    state = load_state(STATE_PATH)
    log.info("watching %d product(s)", len(products))
    for product in products:
        check_product(product, state, token=token, zone=zone, webhook=webhook)
    save_state(STATE_PATH, state)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Price / stock monitor agent")
    parser.add_argument(
        "--interval",
        type=int,
        default=0,
        help="Seconds to sleep between runs. 0 (default) = run once and exit.",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable debug logging"
    )
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    load_dotenv(ROOT / ".env")
    token = os.environ.get("BRIGHTDATA_API_TOKEN", "").strip()
    zone = os.environ.get("BRIGHTDATA_ZONE", DEFAULT_ZONE).strip() or DEFAULT_ZONE
    webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip() or None

    if not token:
        log.error("BRIGHTDATA_API_TOKEN is required (set it in .env)")
        return 2
    if not webhook:
        log.warning("SLACK_WEBHOOK_URL not set — alerts will only be logged")

    if args.interval > 0:
        log.info("running on a %ds loop (Ctrl-C to stop)", args.interval)
        while True:
            try:
                run_once(token=token, zone=zone, webhook=webhook)
            except Exception:
                log.exception("run failed")
            time.sleep(args.interval)
    else:
        run_once(token=token, zone=zone, webhook=webhook)
    return 0


if __name__ == "__main__":
    sys.exit(main())
