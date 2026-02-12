import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent

async def debug():
    ua = UserAgent()
    headers = {
        'User-Agent': ua.random,
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Referer': 'https://www.google.com/'
    }
    url = "https://lista.mercadolivre.com.br/notebook"
    print(f"Acessando: {url}")
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(url, headers=headers, follow_redirects=True)
    
    print(f"Status: {r.status_code}")
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Tenta seletores diferentes
    selectors = [
        'div.ui-search-result__wrapper',
        'li.ui-search-layout__item',
        'div.poly-card',
        'div.ui-search-item__group'
    ]
    
    for sel in selectors:
        elements = soup.select(sel)
        print(f"Seletor '{sel}': {len(elements)} encontrados")
        if elements:
            # Mostra o primeiro para análise
            print(f"Exemplo de conteúdo (primeiros 200 chars): {elements[0].get_text()[:200]}")

    # Salva HTML para inspeção se nada for encontrado
    if not any(len(soup.select(s)) for s in selectors):
        with open("ml_debug.html", "w") as f:
            f.write(r.text)
        print("HTML salvo em ml_debug.html")

import asyncio
asyncio.run(debug())
