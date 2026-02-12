import httpx
from bs4 import BeautifulSoup
import re
from datetime import datetime

async def test():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
    url = "https://lista.mercadolivre.com.br/notebook"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=headers, follow_redirects=True)
    
    soup = BeautifulSoup(r.text, 'html.parser')
    # Tenta seletores genéricos baseados no HTML observado
    items = soup.select('div.ui-search-result__wrapper, li.ui-search-layout__item, div.poly-card')
    print(f"Encontrados {len(items)} itens")
    
    for item in items[:5]:
        title = item.select_one('h2, h3')
        price = item.select_one('span.andes-money-amount__fraction')
        link = item.select_one('a')
        if title and price:
            print(f"Produto: {title.get_text().strip()} | Preço: {price.get_text().strip()}")

import asyncio
asyncio.run(test())
