import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

async def debug():
    ua = UserAgent()
    headers = {'User-Agent': ua.random}
    url = "https://lista.mercadolivre.com.br/notebook"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=headers, follow_redirects=True)
    
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Procura todos os <h2>
    h2s = soup.find_all('h2')
    print(f"Total de H2: {len(h2s)}")
    for h in h2s[:5]:
        print(f"H2: {h.get_text()}")
        # Tenta subir até o card
        parent = h.parent
        while parent and parent.name != 'div':
            parent = parent.parent
        if parent:
            print(f"Parent div classes: {parent.get('class')}")

import asyncio
asyncio.run(debug())
